import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
 * Nearest-neighbor heuristic for TSP, optimizing for minimum total driving time.
 * Returns the order of indices (not including the origin twice; caller can handle round-trip).
 */
function nearestNeighborTSP(durations: number[][], startIdx: number): number[] {
  const n = durations.length;
  const visited = new Set<number>([startIdx]);
  const route = [startIdx];
  let current = startIdx;

  while (visited.size < n) {
    let best = -1;
    let bestTime = Infinity;

    for (let i = 0; i < n; i++) {
      if (visited.has(i)) continue;
      const time = durations[current][i];
      if (time !== null && time < bestTime) {
        bestTime = time;
        best = i;
      }
    }

    if (best === -1) break; // No reachable nodes left
    visited.add(best);
    route.push(best);
    current = best;
  }

  return route;
}

/**
 * 2-opt improvement: iteratively reverses segments to reduce total time.
 */
function twoOptImprove(route: number[], durations: number[][], isRoundTrip: boolean): number[] {
  const improved = [...route];
  const n = improved.length;
  let madeSwap = true;

  const totalTime = (r: number[]) => {
    let sum = 0;
    for (let i = 0; i < r.length - 1; i++) {
      sum += durations[r[i]][r[i + 1]] ?? 0;
    }
    if (isRoundTrip && r.length > 1) {
      sum += durations[r[r.length - 1]][r[0]] ?? 0;
    }
    return sum;
  };

  while (madeSwap) {
    madeSwap = false;
    for (let i = 1; i < n - 1; i++) {
      for (let j = i + 1; j < n; j++) {
        const newRoute = [
          ...improved.slice(0, i),
          ...improved.slice(i, j + 1).reverse(),
          ...improved.slice(j + 1),
        ];
        if (totalTime(newRoute) < totalTime(improved)) {
          improved.splice(0, improved.length, ...newRoute);
          madeSwap = true;
        }
      }
    }
  }

  return improved;
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

    if (properties.length > 20) {
      return new Response(
        JSON.stringify({ error: "Too many properties to optimize at once (max 20)." }),
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
      ...normalized.map((p) => ({ id: p.id, address: p.fullAddress })),
      ...(hasEndingPoint ? [{ id: DEST_ID, address: endingPoint.trim() }] : []),
    ];

    const { data: geoData, error: geoError } = await supabase.functions.invoke("geocode-address", {
      body: { addresses: addressesPayload },
    });

    if (geoError || geoData?.error) {
      console.error("Geocoding function error:", geoError || geoData?.error);
      return new Response(
        JSON.stringify({ optimizedOrder: normalized.map((p) => p.id) }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
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

    console.log(
      `Geocoded ${geocoded.length}/${normalized.length} properties` +
        (ungeocodedIds.length ? `; missing: ${ungeocodedIds.join(", ")}` : ""),
    );

    if (geocoded.length < 2) {
      console.warn("Not enough geocoded properties to optimize; returning original order");
      return new Response(
        JSON.stringify({ optimizedOrder: normalized.map((p) => p.id) }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Build coordinate list for OSRM: origin (if any) + geocoded properties
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

    // Add destination if specified (different from origin)
    if (hasDestination && destCoords) {
      osrmCoords.push(destCoords);
      idxToId.push(DEST_ID);
    }

    // Get driving time matrix from OSRM
    const durations = await getOSRMDurationMatrix(osrmCoords);

    if (!durations) {
      console.warn("OSRM failed; falling back to original order");
      return new Response(
        JSON.stringify({ optimizedOrder: normalized.map((p) => p.id) }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Run nearest-neighbor starting from origin index (0 if origin, else first property)
    const startIdx = hasOrigin ? 0 : 0;
    let route = nearestNeighborTSP(durations, startIdx);

    // Apply 2-opt improvement (only round trip if no explicit destination)
    const isRoundTrip = !hasDestination;
    route = twoOptImprove(route, durations, isRoundTrip);

    // Convert indices to property IDs (exclude origin and destination markers)
    const orderedIds = route.map((idx) => idxToId[idx]).filter((id) => id !== ORIGIN_ID && id !== DEST_ID);

    // Append ungeocoded properties at the end
    const optimizedOrder = [...orderedIds, ...ungeocodedIds];

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

    // Add return to origin only if round trip (no explicit destination)
    if (isRoundTrip && route.length > 1) {
      const returnTime = durations[route[route.length - 1]][route[0]] ?? 0;
      totalSeconds += returnTime;
      legDurations.push({
        from: idxToId[route[route.length - 1]],
        to: idxToId[route[0]],
        seconds: returnTime,
      });
    }

    console.log("Optimized order:", optimizedOrder.join(" → "), `(${Math.round(totalSeconds / 60)} min)`);

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
