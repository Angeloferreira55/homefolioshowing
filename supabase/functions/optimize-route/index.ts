import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PropertyInput {
  id: string;
  address: string;
  city: string | null;
  state: string | null;
  zip_code: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claims?.claims) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claims.claims.sub;
    console.log('Authenticated user:', userId);

    const { properties, startingPoint } = await req.json();
    
    if (!properties || properties.length < 2) {
      return new Response(
        JSON.stringify({ optimizedOrder: properties?.map((p: PropertyInput) => p.id) || [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Format addresses for the AI
    const addressList = properties.map((p: PropertyInput, i: number) => {
      const fullAddress = [p.address, p.city, p.state, p.zip_code]
        .filter(Boolean)
        .join(", ");
      return `${i + 1}. ID: ${p.id} - ${fullAddress}`;
    }).join("\n");

    const systemPrompt = `You are a route optimization assistant that minimizes total driving distance using the Traveling Salesman Problem approach.

RULES:
1. Analyze the geographical locations of all addresses
2. Calculate the optimal route that minimizes TOTAL TRAVEL DISTANCE
3. Use nearest-neighbor heuristic: from each location, go to the closest unvisited location
4. Consider the starting point if provided, otherwise start from the first property
5. Account for actual road geography (cities in same area should be grouped)

CRITICAL: You must be DETERMINISTIC. Given the same addresses, ALWAYS return the EXACT same order.

Respond with ONLY a JSON array of property IDs in optimal order. No explanation.`;

    const userPrompt = `Optimize this driving route to minimize total distance${startingPoint ? `. Starting from: ${startingPoint}` : ''}:

${addressList}

Apply nearest-neighbor algorithm: from each stop, visit the closest unvisited property next.
Return ONLY a JSON array of property IDs in the optimal order.`;

    console.log('Optimizing route for properties:', addressList);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        temperature: 0,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to optimize route");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    // Parse the JSON array from the response
    let optimizedOrder: string[];
    try {
      // Extract JSON array from response (handle potential markdown code blocks)
      const jsonMatch = content.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        optimizedOrder = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON array found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      // Fallback to original order
      optimizedOrder = properties.map((p: PropertyInput) => p.id);
    }

    // Validate that all IDs are present
    const inputIds = new Set(properties.map((p: PropertyInput) => p.id));
    const validOrder = optimizedOrder.filter(id => inputIds.has(id));
    
    // Add any missing IDs at the end
    for (const p of properties) {
      if (!validOrder.includes(p.id)) {
        validOrder.push(p.id);
      }
    }

    return new Response(
      JSON.stringify({ optimizedOrder: validOrder }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Route optimization error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
