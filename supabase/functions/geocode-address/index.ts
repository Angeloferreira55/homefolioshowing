import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { addresses } = await req.json();
    
    if (!addresses || !Array.isArray(addresses)) {
      return new Response(
        JSON.stringify({ error: "addresses array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results = [];
    
    for (const item of addresses) {
      const { id, address } = item;
      
      try {
        // Add delay between requests to respect rate limits
        if (results.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 1100));
        }
        
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
          {
            headers: {
              "User-Agent": "HomeFolio/1.0 (Real Estate Showing App)",
              "Accept": "application/json",
            },
          }
        );
        
        if (!response.ok) {
          console.error(`Geocoding failed for ${address}: ${response.status}`);
          continue;
        }
        
        const data = await response.json();
        
        if (data && data.length > 0) {
          results.push({
            id,
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
          });
        }
      } catch (err) {
        console.error(`Error geocoding ${address}:`, err);
      }
    }
    
    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Geocode error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
