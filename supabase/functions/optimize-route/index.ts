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
  const R = 6371000;
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
  const ROAD_FACTOR = 1.4; // roads are ~40% longer than straight line
  const n = coords.length;
  const matrix: number[][] = [];
  for (let i = 0; i < n; i++) {
    matrix[i] = [];
    for (let j = 0; j < n; j++) {
      if (i === j) {
        matrix[i][j] = 0;
      } else {
        const dist = haversineDistance(coords[i], coords[j]);
        matrix[i][j] = (dist * ROAD_FACTOR) / AVG_SPEED_MPS;
      }
    }
  }
  return matrix;
}

/**
 * Get driving durations matrix from OSRM public API.
 * Returns a 2D array [from][to] of durations in seconds.
 * Patches null entries with haversine estimates.
 */
async function getOSRMDurationMatrix(
  coords: Coordinates[],
): Promise<{ durations: number[][] | null; hasNulls: boolean }> {
  if (coords.length < 2) return { durations: null, hasNulls: false };

  const coordString = coords.map((c) => `${c.lon},${c.lat}`).join(";");
  const url = `https://router.project-osrm.org/table/v1/driving/${coordString}?annotations=duration`;

  console.log("Calling OSRM table API for", coords.length, "points");

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "HomeFolio/1.0 (https://home-folio.net)" },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      console.error("OSRM API error:", response.status, await response.text());
      return { durations: null, hasNulls: false };
    }

    const data = await response.json();
    if (data.code !== "Ok" || !data.durations) {
      console.error("OSRM returned non-OK:", data.code, data.message);
      return { durations: null, hasNulls: false };
    }

    // Patch null entries with haversine estimates
    const durations = data.durations as (number | null)[][];
    let hasNulls = false;
    const AVG_SPEED_MPS = 40000 / 3600;
    const ROAD_FACTOR = 1.4;

    for (let i = 0; i < durations.length; i++) {
      for (let j = 0; j < durations[i].length; j++) {
        if (durations[i][j] === null || durations[i][j] === undefined) {
          hasNulls = true;
          if (i === j) {
            durations[i][j] = 0;
          } else {
            // Fall back to haversine estimate for this pair
            const dist = haversineDistance(coords[i], coords[j]);
            durations[i][j] = (dist * ROAD_FACTOR) / AVG_SPEED_MPS;
          }
        }
      }
    }

    if (hasNulls) {
      console.warn("OSRM returned null for some coordinate pairs — patched with haversine estimates");
    }

    return { durations: durations as number[][], hasNulls };
  } catch (err) {
    console.error("OSRM fetch error:", err);
    return { durations: null, hasNulls: false };
  }
}

/**
 * Calculate total route time from a duration matrix.
 */
function routeTime(route: number[], durations: number[][]): number {
  let sum = 0;
  for (let i = 0; i < route.length - 1; i++) {
    sum += durations[route[i]][route[i + 1]];
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
      if (time < bestTime) {
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
 * 2-opt improvement using FULL route cost comparison.
 * This correctly handles asymmetric duration matrices (A→B ≠ B→A)
 * where reversing a segment changes internal edge costs.
 */
function twoOptImprove(route: number[], durations: number[][], fixStart: boolean, fixEnd: boolean): number[] {
  let improved = [...route];
  const n = improved.length;
  let bestCost = routeTime(improved, durations);
  let madeSwap = true;

  const iStart = fixStart ? 1 : 0;
  const jEnd = fixEnd ? n - 1 : n;

  while (madeSwap) {
    madeSwap = false;
    for (let i = iStart; i < jEnd - 1; i++) {
      for (let j = i + 1; j < jEnd; j++) {
        // Create candidate route with segment [i..j] reversed
        const candidate = [...improved];
        let left = i;
        let right = j;
        while (left < right) {
          const tmp = candidate[left];
          candidate[left] = candidate[right];
          candidate[right] = tmp;
          left++;
          right--;
        }

        const candidateCost = routeTime(candidate, durations);
        if (candidateCost < bestCost) {
          improved = candidate;
          bestCost = candidateCost;
          madeSwap = true;
        }
      }
    }
  }

  return improved;
}

/**
 * Or-opt improvement: try moving single nodes to better positions.
 * Works well for asymmetric matrices.
 */
function orOptImprove(route: number[], durations: number[][], fixStart: boolean, fixEnd: boolean): number[] {
  let improved = [...route];
  const n = improved.length;
  let bestCost = routeTime(improved, durations);
  let madeMove = true;

  const iStart = fixStart ? 1 : 0;
  const iEnd = fixEnd ? n - 1 : n;

  while (madeMove) {
    madeMove = false;
    for (let i = iStart; i < iEnd; i++) {
      for (let j = iStart; j < iEnd; j++) {
        if (j === i || j === i - 1) continue;

        // Try moving node at position i to position after j
        const candidate = [...improved];
        const [node] = candidate.splice(i, 1);
        const insertPos = j > i ? j : j + 1;
        candidate.splice(insertPos, 0, node);

        const candidateCost = routeTime(candidate, durations);
        if (candidateCost < bestCost) {
          improved = candidate;
          bestCost = candidateCost;
          madeMove = true;
          break; // Restart inner loop with new route
        }
      }
      if (madeMove) break; // Restart outer loop
    }
  }

  return improved;
}

/**
 * Multi-start TSP: try nearest-neighbor from multiple starting points,
 * improve each with 2-opt + or-opt, and return the best route found.
 */
function solveRoute(
  durations: number[][],
  fixedStart?: number,
  fixedEnd?: number,
): number[] {
  const n = durations.length;
  if (n <= 1) return [0];

  const hasFixedStart = fixedStart !== undefined;
  const hasFixedEnd = fixedEnd !== undefined;

  // Determine which starting points to try
  let startCandidates: number[];
  if (hasFixedStart) {
    startCandidates = [fixedStart];
  } else {
    startCandidates = Array.from({ length: n }, (_, i) => i);
    if (hasFixedEnd) {
      startCandidates = startCandidates.filter((i) => i !== fixedEnd);
    }
    // Limit to 15 candidates to keep runtime reasonable
    if (startCandidates.length > 15) {
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
    route = orOptImprove(route, durations, hasFixedStart, hasFixedEnd);
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
      windowSeconds: 3600,
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
      "Optimizing route for properties:\n" +
        normalized.map((p, i) => `  ${i + 1}. ${p.fullAddress}`).join("\n"),
    );

    // Use the existing geocoder function for address -> coords
    const ORIGIN_ID = "__origin__";
    const DEST_ID = "__destination__";
    const hasEndingPoint = typeof endingPoint === "string" && endingPoint.trim();
    const addressesPayload = [
      ...(typeof startingPoint === "string" && startingPoint.trim()
        ? [{ id: ORIGIN_ID, address: startingPoint.trim() }]
        : []),
      ...normalized.map((p) => ({
        id: p.id,
        address: p.fullAddress,
        city: p.city,
        state: p.state,
        zip_code: p.zip_code,
      })),
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

    if (hasDestination && destCoords) {
      osrmCoords.push(destCoords);
      idxToId.push(DEST_ID);
    }

    // Log coordinates for debugging
    console.log(
      "Coordinates for routing:\n" +
        osrmCoords.map((c, i) => `  ${idxToId[i]}: lat=${c.lat.toFixed(5)}, lon=${c.lon.toFixed(5)}`).join("\n"),
    );

    // Get driving time matrix from OSRM, fall back to haversine if unavailable
    const osrmResult = await getOSRMDurationMatrix(osrmCoords);
    let durations = osrmResult.durations;
    let usedHaversine = false;

    if (!durations) {
      console.warn("OSRM unavailable — falling back to haversine distance matrix");
      durations = buildHaversineDurationMatrix(osrmCoords);
      usedHaversine = true;
    }

    // Log the duration matrix for debugging
    console.log("Duration matrix (minutes):");
    for (let i = 0; i < durations.length; i++) {
      const row = durations[i].map((d) => `${Math.round(d / 60)}`).join(", ");
      console.log(`  ${idxToId[i]}: [${row}]`);
    }

    // Solve TSP with multi-start optimization
    const fixedStart = hasOrigin ? 0 : undefined;
    const fixedEnd = hasDestination ? osrmCoords.length - 1 : undefined;
    const route = solveRoute(durations, fixedStart, fixedEnd);

    // Convert indices to property IDs (exclude origin and destination markers)
    const orderedIds = route.map((idx) => idxToId[idx]).filter((id) => id !== ORIGIN_ID && id !== DEST_ID);
    const optimizedOrder = orderedIds;

    // Calculate total driving time for the optimized route
    let totalSeconds = 0;
    const legDurations: Array<{ from: string; to: string; seconds: number }> = [];

    for (let i = 0; i < route.length - 1; i++) {
      const legTime = durations[route[i]][route[i + 1]];
      totalSeconds += legTime;
      legDurations.push({
        from: idxToId[route[i]],
        to: idxToId[route[i + 1]],
        seconds: legTime,
      });
    }

    console.log(
      `Optimized route (${Math.round(totalSeconds / 60)} min total):\n` +
        route.map((idx, i) => {
          const id = idxToId[idx];
          const leg = i < route.length - 1 ? ` → ${Math.round(durations[route[i]][route[i + 1]] / 60)} min →` : "";
          return `  ${i + 1}. ${id}${leg}`;
        }).join("\n"),
    );

    // Build route coordinates for map display
    const routeCoordinates = route.map((idx) => {
      const coords = osrmCoords[idx];
      return { id: idxToId[idx], lat: coords.lat, lng: coords.lon };
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
