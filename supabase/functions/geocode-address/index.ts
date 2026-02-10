import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit, getRateLimitIdentifier } from "../_shared/rateLimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function normalizeQuery(address: unknown): string {
  if (typeof address !== "string") return "";
  return address
    .replace(/\s+/g, " ")
    .replace(/\s*,\s*/g, ", ")
    .trim();
}

interface GeoResult {
  lat: number;
  lng: number;
}

/**
 * Try LocationIQ first (better US coverage), fall back to Nominatim
 */
async function geocodeAddress(
  query: string,
  locationIqKey: string | undefined,
): Promise<GeoResult | null> {
  // Try LocationIQ first if key is available
  if (locationIqKey) {
    try {
      const url = `https://us1.locationiq.com/v1/search?key=${locationIqKey}&q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=us`;
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0 && data[0]?.lat && data[0]?.lon) {
          console.log(`LocationIQ success for "${query}"`);
          return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        }
      } else {
        const body = await response.text();
        console.warn(`LocationIQ failed (${response.status}): ${body.slice(0, 200)}`);
      }
    } catch (err) {
      console.warn("LocationIQ error:", err);
    }
  }

  // Fallback to Nominatim
  try {
    const url =
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}` +
      `&limit=1&countrycodes=us`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "HomeFolio/1.0 (Real Estate Showing App; support@homefolio.app)",
        Accept: "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0 && data[0]?.lat && data[0]?.lon) {
        console.log(`Nominatim success for "${query}"`);
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
    } else {
      const body = await response.text();
      console.warn(`Nominatim failed (${response.status}): ${body.slice(0, 200)}`);
    }
  } catch (err) {
    console.warn("Nominatim error:", err);
  }

  return null;
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

    // Rate limiting: 100 geocoding requests per hour per user
    const identifier = getRateLimitIdentifier(req, userId);
    const rateLimit = await checkRateLimit(identifier, {
      maxRequests: 100,
      windowSeconds: 3600, // 1 hour
      operation: "geocode-address",
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
            "X-RateLimit-Limit": "100",
            "X-RateLimit-Remaining": String(rateLimit.remaining),
            "X-RateLimit-Reset": rateLimit.resetAt.toISOString(),
          },
        }
      );
    }

    const locationIqKey = Deno.env.get("LOCATIONIQ_API_KEY");
    if (!locationIqKey) {
      console.warn("LOCATIONIQ_API_KEY not set; using Nominatim only");
    }

    const { addresses } = await req.json();

    if (!addresses || !Array.isArray(addresses)) {
      return new Response(JSON.stringify({ error: "addresses array is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: Array<{ id: string; lat: number; lng: number }> = [];

    for (let i = 0; i < addresses.length; i++) {
      const item = addresses[i];
      const id = item?.id;
      const rawAddress = item?.address;
      const q = normalizeQuery(rawAddress);

      if (typeof id !== "string" || !id) {
        console.warn("Skipping geocode item with invalid id:", item);
        continue;
      }
      if (!q) {
        console.warn(`Skipping geocode item ${id} with empty address`);
        continue;
      }

      // Respect rate limits: 2 requests/sec for LocationIQ free tier
      if (i > 0) await sleep(600);

      console.log(`Geocoding [${i + 1}/${addresses.length}] id=${id} q="${q}"`);

      const geo = await geocodeAddress(q, locationIqKey);
      if (geo) {
        results.push({ id, lat: geo.lat, lng: geo.lng });
      } else {
        console.warn(`No geocode result for id=${id} q="${q}"`);
      }
    }

    console.log(`Geocode completed: ${results.length}/${addresses.length} results`);

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Geocode error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
