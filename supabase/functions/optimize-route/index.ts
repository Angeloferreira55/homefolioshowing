import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit, getRateLimitIdentifier } from "../_shared/rateLimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PropertyInput {
  id: string;
  address: string;
  city: string | null;
  state: string | null;
  zip_code: string | null;
}

interface Coordinates {
  lat: number;
  lon: number;
}

function buildFullAddress(p: { address: string; city?: string | null; state?: string | null; zip_code?: string | null }) {
  return [p.address, p.city, p.state, p.zip_code].filter(Boolean).join(", ");
}

/**
 * Haversine distance in meters between two coordinates.
 */
function haversineDistance(a: Coordinates, b: Coordinates): number {
  const R = 6371000; // Earth's radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const h = sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLon * sinLon;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Build a duration matrix from haversine distances.
 * Assumes average driving speed of 40 km/h (~25 mph) in urban areas.
 * Returns seconds.
 */
function buildHaversineDurationMatrix(coords: Coordinates[]): number[][] {
  const AVG_SPEED_MPS = 40000 / 3600; // 40 km/h in m/s
  const n = coords.length;
  const matrix: number[][] = [];
  for (let i = 0; i < n; i++) {
    matrix[i] = [];
    for (let j = 0; j < n; j++) {
      if (i === j) {
        matrix[i][j] = 0;
      } else {
        const dist = haversineDistance(coords[i], coords[j]);
        // Multiply by 1.4 to account for road distance vs straight-line
        matrix[i][j] = (dist * 1.4) / AVG_SPEED_MPS;
      }
    }
  }
  return matrix;
}

/**
 * Get driving durations matrix from OSRM public API.
 * Returns a 2D array [from][to] of durations in seconds.
 */
async function getOSRMDurationMatrix(coords: Coordinates[]): Promise<number[][] | null> {
  if (coords.length < 2) return null;

  // OSRM expects "lon,lat;lon,lat;..." format
  const coordString = coords.map((c) => `${c.lon},${c.lat}`).join(";");
  const url = `https://router.project-osrm.org/table/v1/driving/${coordString}?annotations=duration`;

  console.log("Calling OSRM table API for", coords.length, "points");

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "HomeFolio/1.0 (https://homefolioshowing.lovable.app)",
      },
    });

    if (!response.ok) {
      console.error("OSRM API error:", response.status, await response.text());
      return null;
    }

    const data = await response.json();
    if (data.code !== "Ok" || !data.durations) {
      console.error("OSRM returned non-OK:", data.code, data.message);
      return null;
    }

    return data.durations as number[][];
  } catch (err) {
    console.error("OSRM fetch error:", err);
    return null;
  }
}

/**
 * Calculate total route time from a duration matrix.
 */
function routeTime(route: number[], durations: number[][]): number {
  let sum = 0;
  for (let i = 0; i < route.length - 1; i++) {
    sum += durations[route[i]][route[i + 1]] ?? 0;
  }
  return sum;
}

/**
 * Nearest-neighbor heuristic for TSP.
 * excludeIdx: optional index to exclude from the greedy search (e.g. fixed destination).
 */
function nearestNeighborTSP(durations: number[][], startIdx: number, excludeIdx?: number): number[] {
  const n = durations.length;
  const visited = new Set<number>([startIdx]);
  if (excludeIdx !== undefined) visited.add(excludeIdx);
  const route = [startIdx];
  let current = startIdx;

  while (visited.size < n) {
    let best = -1;
    let bestTime = Infinity;

    for (let i = 0; i < n; i++) {
      if (visited.has(i)) continue;
      const time = durations[current][i];
      if (time !== null && time !== undefined && time < bestTime) {
        bestTime = time;
        best = i;
      }
    }

    if (best === -1) break;
    visited.add(best);
    route.push(best);
    current = best;
  }

  if (excludeIdx !== undefined) {
    route.push(excludeIdx);
  }

  return route;
}

/**
 * 2-opt improvement using incremental cost calculation.
 * Only recalculates the 2 edges that change instead of the full route.
 * fixStart/fixEnd: if true, the first/last element is locked in place.
 */
function twoOptImprove(route: number[], durations: number[][], fixStart: boolean, fixEnd: boolean): number[] {
  const improved = [...route];
  const n = improved.length;
  let madeSwap = true;

  const iStart = fixStart ? 1 : 0;
  const jEnd = fixEnd ? n - 1 : n;

  while (madeSwap) {
    madeSwap = false;
    for (let i = iStart; i < jEnd - 1; i++) {
      for (let j = i + 1; j < jEnd; j++) {
        // Calculate cost change from reversing segment [i..j]
        // Old edges: (i-1)->i and j->(j+1)
        // New edges: (i-1)->j and i->(j+1)
        const prevI = i > 0 ? improved[i - 1] : -1;
        const nextJ = j < n - 1 ? improved[j + 1] : -1;

        let oldCost = 0;
        let newCost = 0;

        if (prevI >= 0) {
          oldCost += durations[prevI][improved[i]] ?? 0;
          newCost += durations[prevI][improved[j]] ?? 0;
        }
        if (nextJ >= 0) {
          oldCost += durations[improved[j]][nextJ] ?? 0;
          newCost += durations[improved[i]][nextJ] ?? 0;
        }

        if (newCost < oldCost) {
          // Reverse segment in-place
          let left = i;
          let right = j;
          while (left < right) {
            const tmp = improved[left];
            improved[left] = improved[right];
            improved[right] = tmp;
            left++;
            right--;
          }
          madeSwap = true;
        }
      }
    }
  }

  return improved;
}

/**
 * Multi-start TSP: try nearest-neighbor from multiple starting points,
 * improve each with 2-opt, and return the best route found.
 */
function solveRoute(
  durations: number[][],
  fixedStart?: number,
  fixedEnd?: number,
): number[] {
  const n = durations.length;
  const hasFixedStart = fixedStart !== undefined;
  const hasFixedEnd = fixedEnd !== undefined;

  // Determine which starting points to try
  let startCandidates: number[];
  if (hasFixedStart) {
    startCandidates = [fixedStart];
  } else {
    // Try all points as starting positions (or up to 15 for large sets)
    startCandidates = Array.from({ length: n }, (_, i) => i);
    if (hasFixedEnd) {
      startCandidates = startCandidates.filter((i) => i !== fixedEnd);
    }
    // Limit to 15 candidates to keep runtime reasonable
    if (startCandidates.length > 15) {
      // Pick evenly spaced candidates + always include first and last
      const step = Math.floor(startCandidates.length / 15);
      const sampled = new Set<number>();
      for (let i = 0; i < startCandidates.length; i += step) {
        sampled.add(startCandidates[i]);
      }
      sampled.add(startCandidates[0]);
      sampled.add(startCandidates[startCandidates.length - 1]);
      startCandidates = Array.from(sampled);
    }
  }

  let bestRoute: number[] | null = null;
  let bestTime = Infinity;

  for (const start of startCandidates) {
    let route = nearestNeighborTSP(durations, start, fixedEnd);
    route = twoOptImprove(route, durations, hasFixedStart, hasFixedEnd);
    const time = routeTime(route, durations);
    if (time < bestTime) {
      bestTime = time;
      bestRoute = route;
    }
  }

  return bestRoute || [0];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claims.claims.sub;
    console.log("Authenticated user:", userId);

    // Rate limiting: 30 route optimizations per hour per user
    const identifier = getRateLimitIdentifier(req, userId);
    const rateLimit = await checkRateLimit(identifier, {
      maxRequests: 30,
      windowSeconds: 3600, // 1 hour
      operation: "optimize-route",
    });

    if (!rateLimit.allowed) {
      console.warn(`Rate limit exceeded for ${identifier}`);
      return new Response(
        JSON.stringify({
          error: rateLimit.error,
          retryAfter: Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": String(Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000)),
            "X-RateLimit-Limit": "30",
            "X-RateLimit-Remaining": String(rateLimit.remaining),
            "X-RateLimit-Reset": rateLimit.resetAt.toISOString(),
          },
        }
      );
    }

    const { properties, startingPoint, endingPoint } = await req.json();

    if (!properties || !Array.isArray(properties)) {
      return new Response(JSON.stringify({ error: "properties array is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (properties.length < 2) {
      return new Response(
        JSON.stringify({ optimizedOrder: properties.map((p: PropertyInput) => p.id) }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (properties.length > 50) {
      return new Response(
        JSON.stringify({ error: "Too many properties to optimize at once (max 50)." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const normalized = (properties as PropertyInput[]).map((p) => ({
      ...p,
      fullAddress: buildFullAddress(p),
    }));

    console.log(
      "Optimizing route for properties:",
      normalized.map((p, i) => `${i + 1}. ID: ${p.id} - ${p.fullAddress}`).join("\n"),
    );

    // Use the existing geocoder function for address -> coords
    const ORIGIN_ID = "__origin__";
    const DEST_ID = "__destination__";
    const hasEndingPoint = typeof endingPoint === "string" && endingPoint.trim();
    const addressesPayload = [
      ...(typeof startingPoint === "string" && startingPoint.trim()
        ? [{ id: ORIGIN_ID, address: startingPoint.trim() }]
        : []),
      ...normalized.map((p) => ({ id: p.id, address: p.fullAddress, city: p.city, state: p.state, zip_code: p.zip_code })),
      ...(hasEndingPoint ? [{ id: DEST_ID, address: endingPoint.trim() }] : []),
    ];

    const { data: geoData, error: geoError } = await supabase.functions.invoke("geocode-address", {
      body: { addresses: addressesPayload },
    });

    if (geoError || geoData?.error) {
      console.error("Geocoding function error:", geoError || geoData?.error);
      return new Response(
        JSON.stringify({ error: "Failed to geocode addresses. Please ensure each address includes city and state." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const coordsById = new Map<string, Coordinates>();
    const results = Array.isArray(geoData?.results) ? geoData.results : [];
    for (const r of results) {
      if (!r?.id || typeof r.lat !== "number" || typeof r.lng !== "number") continue;
      coordsById.set(r.id, { lat: r.lat, lon: r.lng });
    }

    const hasOrigin = coordsById.has(ORIGIN_ID);
    const hasDestination = coordsById.has(DEST_ID);
    const originCoords = coordsById.get(ORIGIN_ID) || null;
    const destCoords = coordsById.get(DEST_ID) || null;

    const geocoded = normalized.filter((p) => coordsById.has(p.id));
    const ungeocodedIds = normalized.filter((p) => !coordsById.has(p.id)).map((p) => p.id);
    const failedAddresses = normalized.filter((p) => !coordsById.has(p.id)).map((p) => p.fullAddress);

    console.log(
      `Geocoded ${geocoded.length}/${normalized.length} properties` +
        (failedAddresses.length ? `; FAILED: ${failedAddresses.join(" | ")}` : ""),
    );

    if (geocoded.length < 2) {
      return new Response(
        JSON.stringify({
          error: `Could not locate enough addresses to optimize (only ${geocoded.length} of ${normalized.length} found). Please ensure each address includes city and state.`,
          failedAddresses,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Build coordinate list for OSRM: origin (if any) + geocoded properties + destination (if any)
    const osrmCoords: Coordinates[] = [];
    const idxToId: string[] = [];

    if (hasOrigin && originCoords) {
      osrmCoords.push(originCoords);
      idxToId.push(ORIGIN_ID);
    }

    for (const p of geocoded) {
      osrmCoords.push(coordsById.get(p.id)!);
      idxToId.push(p.id);
    }

    // Add destination as the last index
    if (hasDestination && destCoords) {
      osrmCoords.push(destCoords);
      idxToId.push(DEST_ID);
    }

    // Get driving time matrix from OSRM, fall back to haversine if unavailable
    let durations = await getOSRMDurationMatrix(osrmCoords);
    let usedHaversine = false;

    if (!durations) {
      console.warn("OSRM unavailable — falling back to haversine distance matrix");
      durations = buildHaversineDurationMatrix(osrmCoords);
      usedHaversine = true;
    }

    // Solve TSP with multi-start optimization
    const fixedStart = hasOrigin ? 0 : undefined;
    const fixedEnd = hasDestination ? osrmCoords.length - 1 : undefined;
    const route = solveRoute(durations, fixedStart, fixedEnd);

    // Convert indices to property IDs (exclude origin and destination markers)
    const orderedIds = route.map((idx) => idxToId[idx]).filter((id) => id !== ORIGIN_ID && id !== DEST_ID);

    // Don't include ungeocoded properties — they'll be auto-removed by the frontend
    const optimizedOrder = orderedIds;

    // Calculate total driving time for the optimized route
    let totalSeconds = 0;
    const legDurations: Array<{ from: string; to: string; seconds: number }> = [];

    for (let i = 0; i < route.length - 1; i++) {
      const legTime = durations[route[i]][route[i + 1]] ?? 0;
      totalSeconds += legTime;
      legDurations.push({
        from: idxToId[route[i]],
        to: idxToId[route[i + 1]],
        seconds: legTime,
      });
    }

    console.log("Optimized order:", optimizedOrder.join(" -> "), `(${Math.round(totalSeconds / 60)} min)`);

    // Build route coordinates for map display
    const routeCoordinates = route.map((idx) => {
      const id = idxToId[idx];
      const coords = osrmCoords[idx];
      return { id, lat: coords.lat, lng: coords.lon };
    });

    return new Response(
      JSON.stringify({
        optimizedOrder,
        totalSeconds,
        legDurations,
        routeCoordinates,
        geocodedCount: geocoded.length,
        totalCount: normalized.length,
        usedHaversine,
        ...(ungeocodedIds.length > 0 ? { ungeocodedIds, failedAddresses } : {}),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Route optimization error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
