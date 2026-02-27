import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit, getRateLimitIdentifier } from "../_shared/rateLimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const NOMINATIM_HEADERS = {
  "User-Agent": "HomeFolio/1.0 (Real Estate Showing App; support@homefolio.app)",
  Accept: "application/json",
};

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

interface AddressItem {
  id: string;
  address: string;
  city?: string;
  state?: string;
  zip_code?: string;
}

// ── Strategy 1: Google Maps Geocoding (most accurate, needs API key) ──

async function googleMapsGeocode(
  query: string,
  apiKey: string,
): Promise<GeoResult | null> {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`;
    const response = await fetch(url);

    if (response.ok) {
      const data = await response.json();
      if (data.status === "OK" && data.results?.length > 0) {
        const loc = data.results[0].geometry.location;
        return { lat: loc.lat, lng: loc.lng };
      }
      if (data.status === "REQUEST_DENIED" || data.status === "OVER_QUERY_LIMIT") {
        console.warn(`Google Maps Geocoding: ${data.status} — ${data.error_message || ""}`);
        return null;
      }
      // ZERO_RESULTS — address not found
      if (data.status === "ZERO_RESULTS") {
        console.warn(`Google Maps: no results for "${query}"`);
        return null;
      }
    }
  } catch (err) {
    console.warn("Google Maps geocoding error:", err);
  }
  return null;
}

// ── Strategy 2: US Census Bureau Geocoder (free, reliable for US) ──

async function censusGeocode(query: string): Promise<GeoResult | null> {
  try {
    const url = `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=${encodeURIComponent(query)}&benchmark=Public_AR_Current&format=json`;
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });

    if (response.ok) {
      const data = await response.json();
      const matches = data?.result?.addressMatches;
      if (Array.isArray(matches) && matches.length > 0) {
        const coords = matches[0].coordinates;
        if (coords?.y && coords?.x) {
          return { lat: coords.y, lng: coords.x };
        }
      }
    }
  } catch (err) {
    console.warn("Census geocoder error:", err);
  }
  return null;
}

// ── Strategy 3: Nominatim free-text ──

async function nominatimFreeText(query: string): Promise<GeoResult | null> {
  try {
    const url =
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}` +
      `&limit=1&countrycodes=us`;
    const response = await fetch(url, { headers: NOMINATIM_HEADERS });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0 && data[0]?.lat && data[0]?.lon) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
    } else {
      const body = await response.text();
      console.warn(`Nominatim free-text failed (${response.status}): ${body.slice(0, 200)}`);
    }
  } catch (err) {
    console.warn("Nominatim free-text error:", err);
  }
  return null;
}

// ── Strategy 4: Nominatim structured query ──

async function nominatimStructured(
  street: string,
  city?: string,
  state?: string,
  postalcode?: string,
): Promise<GeoResult | null> {
  try {
    const params = new URLSearchParams({
      format: "json",
      limit: "1",
      countrycodes: "us",
      street,
    });
    if (city) params.set("city", city);
    if (state) params.set("state", state);
    if (postalcode) params.set("postalcode", postalcode);

    const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
    const response = await fetch(url, { headers: NOMINATIM_HEADERS });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0 && data[0]?.lat && data[0]?.lon) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
    } else {
      const body = await response.text();
      console.warn(`Nominatim structured failed (${response.status}): ${body.slice(0, 200)}`);
    }
  } catch (err) {
    console.warn("Nominatim structured error:", err);
  }
  return null;
}

// ── Strategy 5: Zip/city fallback (approximate) ──

async function nominatimZipFallback(
  zip?: string,
  city?: string,
  state?: string,
): Promise<GeoResult | null> {
  if (!zip && !city) return null;

  try {
    const query = [zip, city, state, "USA"].filter(Boolean).join(", ");
    const url =
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}` +
      `&limit=1&countrycodes=us`;
    const response = await fetch(url, { headers: NOMINATIM_HEADERS });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0 && data[0]?.lat && data[0]?.lon) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
    }
  } catch (err) {
    console.warn("Nominatim zip fallback error:", err);
  }
  return null;
}

// ── LocationIQ (legacy, only used if Google Maps key is missing) ──

async function locationIQGeocode(
  query: string,
  apiKey: string,
): Promise<GeoResult | null> {
  try {
    const url = `https://us1.locationiq.com/v1/search?key=${apiKey}&q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=us`;
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0 && data[0]?.lat && data[0]?.lon) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
    } else {
      const body = await response.text();
      if (response.status === 401 || body.includes("Invalid key")) {
        console.warn("LocationIQ key is invalid — skipping");
        return null;
      }
      console.warn(`LocationIQ failed (${response.status}): ${body.slice(0, 200)}`);
    }
  } catch (err) {
    console.warn("LocationIQ error:", err);
  }
  return null;
}

/**
 * Multi-strategy geocoding with priority order:
 * 1. Google Maps Geocoding (most accurate, fastest)
 * 2. US Census Bureau Geocoder (free, reliable for US)
 * 3. Nominatim free-text
 * 4. Nominatim structured query
 * 5. Zip/city fallback (approximate — last resort)
 *
 * Google Maps and Census can be called without rate-limit delays.
 * Nominatim requires 1 req/sec.
 */
async function geocodeWithFallbacks(
  fullQuery: string,
  street?: string,
  city?: string,
  state?: string,
  zip?: string,
  googleMapsKey?: string,
  googleMapsValid?: boolean,
  locationIqKey?: string,
  locationIqValid?: boolean,
): Promise<{
  result: GeoResult | null;
  approximate: boolean;
  attempts: number;
  googleMapsWorked?: boolean;
  locationIqWorked?: boolean;
}> {
  let attempts = 0;

  // 1. Google Maps Geocoding (skip if key known invalid)
  if (googleMapsKey && googleMapsValid !== false) {
    const result = await googleMapsGeocode(fullQuery, googleMapsKey);
    attempts++;
    if (result) {
      return { result, approximate: false, attempts, googleMapsWorked: true };
    }
  }

  // 2. US Census Bureau Geocoder (free, no rate limit)
  const censusResult = await censusGeocode(fullQuery);
  attempts++;
  if (censusResult) {
    console.log(`  -> Census Geocoder success`);
    return { result: censusResult, approximate: false, attempts };
  }

  // 3. LocationIQ (skip if key known invalid or Google Maps is working)
  if (locationIqKey && locationIqValid !== false && !googleMapsKey) {
    const result = await locationIQGeocode(fullQuery, locationIqKey);
    attempts++;
    if (result) {
      return { result, approximate: false, attempts, locationIqWorked: true };
    }
  }

  // 4. Nominatim free-text (requires 1 req/sec rate limit)
  await sleep(1100);
  const freeResult = await nominatimFreeText(fullQuery);
  attempts++;
  if (freeResult) {
    console.log(`  -> Nominatim free-text success`);
    return { result: freeResult, approximate: false, attempts };
  }

  // 5. Nominatim structured query
  if (street && (city || state)) {
    await sleep(1100);
    const structResult = await nominatimStructured(street, city, state, zip);
    attempts++;
    if (structResult) {
      console.log(`  -> Nominatim structured success`);
      return { result: structResult, approximate: false, attempts };
    }
  }

  // 6. Zip/city fallback (approximate — within the same area)
  if (zip || city) {
    await sleep(1100);
    const zipResult = await nominatimZipFallback(zip, city, state);
    attempts++;
    if (zipResult) {
      console.log(`  -> Zip/city fallback success (approximate)`);
      return { result: zipResult, approximate: true, attempts };
    }
  }

  return { result: null, approximate: false, attempts };
}

/**
 * Extract street, city, state, zip from a full address string.
 * Handles formats like "123 Main St, Albuquerque, NM, 87111"
 */
function parseAddressParts(fullAddress: string): {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
} {
  const parts = fullAddress.split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.length === 0) return {};

  const result: { street?: string; city?: string; state?: string; zip?: string } = {};

  // Last part might be zip
  const lastPart = parts[parts.length - 1];
  if (/^\d{5}(-\d{4})?$/.test(lastPart)) {
    result.zip = lastPart;
    parts.pop();
  }

  // Check for state abbreviation
  if (parts.length > 0) {
    const maybeLast = parts[parts.length - 1];
    if (/^[A-Z]{2}$/i.test(maybeLast)) {
      result.state = maybeLast.toUpperCase();
      parts.pop();
    }
  }

  // First part is street, remaining is city
  if (parts.length > 0) {
    result.street = parts[0];
  }
  if (parts.length > 1) {
    result.city = parts[1];
  }

  return result;
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
      windowSeconds: 3600,
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

    const googleMapsKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
    const locationIqKey = Deno.env.get("LOCATIONIQ_API_KEY");

    if (googleMapsKey) {
      console.log("Using Google Maps Geocoding as primary strategy");
    } else if (locationIqKey) {
      console.warn("GOOGLE_MAPS_API_KEY not set; using LocationIQ + Nominatim");
    } else {
      console.warn("No geocoding API keys set; using Census + Nominatim only");
    }

    const { addresses } = await req.json();

    if (!addresses || !Array.isArray(addresses)) {
      return new Response(JSON.stringify({ error: "addresses array is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: Array<{ id: string; lat: number; lng: number; approximate?: boolean }> = [];
    const failed: Array<{ id: string; address: string }> = [];
    let googleMapsValid: boolean | undefined = undefined;
    let locationIqValid: boolean | undefined = undefined;

    for (let i = 0; i < addresses.length; i++) {
      const item = addresses[i] as AddressItem;
      const id = item?.id;
      const rawAddress = item?.address;
      const q = normalizeQuery(rawAddress);

      if (typeof id !== "string" || !id) {
        console.warn("Skipping geocode item with invalid id:", item);
        continue;
      }
      if (!q) {
        console.warn(`Skipping geocode item ${id} with empty address`);
        failed.push({ id, address: String(rawAddress) });
        continue;
      }

      // Skip PO Boxes — can't be geocoded
      if (/\bp\.?\s*o\.?\s*box\b/i.test(q)) {
        console.warn(`Skipping PO Box address: ${q}`);
        failed.push({ id, address: q });
        continue;
      }

      // Parse address components for structured/fallback queries
      const parsed = parseAddressParts(q);
      const street = parsed.street || undefined;
      const city = item.city || parsed.city || undefined;
      const state = item.state || parsed.state || undefined;
      const zip = item.zip_code || parsed.zip || undefined;

      console.log(`Geocoding [${i + 1}/${addresses.length}] id=${id} q="${q}"`);

      const { result: geo, approximate, attempts, googleMapsWorked, locationIqWorked } =
        await geocodeWithFallbacks(
          q,
          street,
          city,
          state,
          zip,
          googleMapsKey,
          googleMapsValid,
          locationIqKey,
          locationIqValid,
        );

      // Track Google Maps validity
      if (googleMapsKey && googleMapsValid === undefined) {
        if (googleMapsWorked) {
          googleMapsValid = true;
        }
        // Don't mark Google as invalid on first failure — address might just not exist
        // Only mark invalid if we get REQUEST_DENIED (handled inside googleMapsGeocode)
      }

      // Track LocationIQ validity
      if (locationIqKey && locationIqValid === undefined) {
        if (locationIqWorked) {
          locationIqValid = true;
        } else if (!googleMapsKey) {
          locationIqValid = false;
          console.warn("LocationIQ failed on first attempt — skipping for remaining addresses");
        }
      }

      if (geo) {
        const strategy = googleMapsWorked
          ? "google"
          : attempts <= 2
            ? "census"
            : "nominatim";
        console.log(
          `  -> Success via ${strategy}: lat=${geo.lat.toFixed(5)}, lng=${geo.lng.toFixed(5)}${approximate ? " (approximate)" : ""}`,
        );
        results.push({ id, lat: geo.lat, lng: geo.lng, ...(approximate ? { approximate: true } : {}) });
      } else {
        console.warn(`FAILED to geocode id=${id} q="${q}" after ${attempts} attempts`);
        failed.push({ id, address: q });
      }
    }

    console.log(
      `Geocode completed: ${results.length}/${addresses.length} success` +
        (failed.length > 0 ? `, ${failed.length} failed: ${failed.map((f) => f.address).join(" | ")}` : ""),
    );

    return new Response(JSON.stringify({ results, failed }), {
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
