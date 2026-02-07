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

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

function haversineDistanceKm(a: Coordinates, b: Coordinates): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * c;
}

function buildFullAddress(p: { address: string; city?: string | null; state?: string | null; zip_code?: string | null }) {
  return [p.address, p.city, p.state, p.zip_code].filter(Boolean).join(", ");
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

    const { properties, startingPoint } = await req.json();

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

    // Keep requests bounded (geocoding policy + user experience)
    if (properties.length > 20) {
      return new Response(
        JSON.stringify({
          error: "Too many properties to optimize at once (max 20).",
        }),
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

    // Use the existing geocoder function (same one the map uses) for better hit-rate.
    const ORIGIN_ID = "__origin__";
    const addressesPayload = [
      ...(typeof startingPoint === "string" && startingPoint.trim()
        ? [{ id: ORIGIN_ID, address: startingPoint.trim() }]
        : []),
      ...normalized.map((p) => ({ id: p.id, address: p.fullAddress })),
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

    const originCoords = coordsById.get(ORIGIN_ID) || null;

    const geocoded = normalized.filter((p) => coordsById.has(p.id));
    const ungeocodedIdsInOriginalOrder = normalized
      .filter((p) => !coordsById.has(p.id))
      .map((p) => p.id);

    console.log(
      `Geocoded ${geocoded.length}/${normalized.length} properties` +
        (ungeocodedIdsInOriginalOrder.length ? `; missing: ${ungeocodedIdsInOriginalOrder.join(", ")}` : ""),
    );

    if (geocoded.length < 2) {
      console.warn("Not enough geocoded properties to optimize; returning original order");
      return new Response(
        JSON.stringify({ optimizedOrder: normalized.map((p) => p.id) }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Nearest-neighbor route (deterministic tie-breakers)
    const remaining = [...geocoded].sort((a, b) => a.id.localeCompare(b.id));

    const route: PropertyInput[] = [];

    // Determine the first stop
    if (originCoords) {
      remaining.sort((a, b) => {
        const da = haversineDistanceKm(originCoords!, coordsById.get(a.id)!);
        const db = haversineDistanceKm(originCoords!, coordsById.get(b.id)!);
        if (da !== db) return da - db;
        return a.id.localeCompare(b.id);
      });
      route.push(remaining.shift()!);
    } else {
      // No starting point: keep the current first property as start to avoid surprising users
      const firstId = (properties as PropertyInput[])[0]?.id;
      const idx = firstId ? remaining.findIndex((p) => p.id === firstId) : -1;
      if (idx >= 0) route.push(remaining.splice(idx, 1)[0]);
      else route.push(remaining.shift()!);
    }

    while (remaining.length) {
      const current = route[route.length - 1];
      const currentCoords = coordsById.get(current.id)!;

      remaining.sort((a, b) => {
        const da = haversineDistanceKm(currentCoords, coordsById.get(a.id)!);
        const db = haversineDistanceKm(currentCoords, coordsById.get(b.id)!);
        if (da !== db) return da - db;
        return a.id.localeCompare(b.id);
      });

      route.push(remaining.shift()!);
    }

    // Append ungeocoded properties at the end in their original order (deterministic + transparent)
    const optimizedOrder = [...route.map((p) => p.id), ...ungeocodedIdsInOriginalOrder];

    return new Response(JSON.stringify({ optimizedOrder }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Route optimization error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
