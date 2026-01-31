import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PropertyInput {
  id: string;
  address: string;
  city: string | null;
  state: string | null;
  zip_code: string | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const systemPrompt = `You are a route optimization assistant. Given a list of property addresses, determine the optimal driving order to minimize total travel distance and time. Consider geographical proximity and logical routing patterns.

You must respond with ONLY a JSON array of property IDs in the optimal visiting order. No explanation, no other text - just the JSON array.

Example response format: ["id1", "id2", "id3"]`;

    const userPrompt = `Optimize the driving route for visiting these properties${startingPoint ? ` starting from: ${startingPoint}` : ''}:

${addressList}

Return ONLY a JSON array of the property IDs in optimal visiting order.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
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
