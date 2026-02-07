import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

      try {
        // Respect Nominatim usage policy: 1 request/second
        if (i > 0) await sleep(1100);

        const url =
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}` +
          `&limit=1&countrycodes=us`;

        console.log(`Geocoding [${i + 1}/${addresses.length}] id=${id} q="${q}"`);

        const response = await fetch(url, {
          headers: {
            // IMPORTANT: include a descriptive UA; public Nominatim may reject vague UAs.
            "User-Agent": "HomeFolio/1.0 (Real Estate Showing App; support@homefolio.app)",
            Accept: "application/json",
          },
        });

        const bodyText = await response.text();

        if (!response.ok) {
          console.error(
            `Nominatim error for id=${id} status=${response.status} ${response.statusText}; body=${bodyText.slice(0, 300)}`,
          );
          continue;
        }

        let data: any;
        try {
          data = JSON.parse(bodyText);
        } catch (e) {
          console.error(`Failed to parse Nominatim JSON for id=${id}; body=${bodyText.slice(0, 300)}`);
          continue;
        }

        if (Array.isArray(data) && data.length > 0 && data[0]?.lat && data[0]?.lon) {
          results.push({
            id,
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
          });
        } else {
          console.warn(`No geocode result for id=${id} q="${q}"`);
        }
      } catch (err) {
        console.error(`Error geocoding id=${id} q="${q}":`, err);
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
