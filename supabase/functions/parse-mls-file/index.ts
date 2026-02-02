import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface PropertyData {
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  price?: number;
  beds?: number;
  baths?: number;
  sqft?: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
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
        JSON.stringify({ success: false, error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claims.claims.sub;
    console.log('Authenticated user:', userId);

    const { filePath, fileType } = await req.json();

    if (!filePath) {
      return new Response(
        JSON.stringify({ success: false, error: 'File path is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role client for storage access
    const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey);

    // Download the file from storage
    console.log('Downloading file:', filePath);
    const { data: fileData, error: downloadError } = await serviceSupabase.storage
      .from('mls-uploads')
      .download(filePath);

    if (downloadError || !fileData) {
      console.error('Download error:', downloadError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to download file' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let extractedProperties: PropertyData[] = [];

    if (fileType === 'csv' || fileType === 'excel') {
      // Parse CSV content
      const text = await fileData.text();
      extractedProperties = await parseCSVWithAI(text, lovableApiKey);
    } else if (fileType === 'pdf') {
      // For PDF, we'll extract text and use AI to parse it
      // Note: Full PDF parsing would require a dedicated library
      // For now, we'll use AI on base64 content
      const arrayBuffer = await fileData.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      extractedProperties = await parsePDFWithAI(base64, lovableApiKey);
    }

    console.log('Extracted properties:', extractedProperties);

    return new Response(
      JSON.stringify({ success: true, data: extractedProperties }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error parsing file:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to parse file';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function parseCSVWithAI(csvContent: string, apiKey: string): Promise<PropertyData[]> {
  console.log('Parsing CSV with AI...');
  
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'system',
          content: `You are a real estate data extractor. Extract property listings from the provided CSV data.
Return a JSON array of properties with these fields (use null for missing values):
- address: string (street address only)
- city: string
- state: string (2-letter abbreviation)
- zipCode: string
- price: number (just the number, no formatting)
- beds: number
- baths: number
- sqft: number

Return ONLY valid JSON array, no markdown or explanation.`
        },
        {
          role: 'user',
          content: `Extract property data from this CSV:\n\n${csvContent.substring(0, 15000)}`
        }
      ],
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    console.error('AI API error:', await response.text());
    return [];
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '[]';
  
  try {
    // Clean up the response - remove markdown code blocks if present
    const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(cleanContent);
  } catch {
    console.error('Failed to parse AI response:', content);
    return [];
  }
}

async function parsePDFWithAI(base64Content: string, apiKey: string): Promise<PropertyData[]> {
  console.log('Parsing PDF with AI...');
  
  // For PDFs, we use the multimodal capability to analyze the document
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'system',
          content: `You are a real estate MLS document parser. Extract property listing information from MLS PDF documents.
Return a JSON array of properties with these fields (use null for missing values):
- address: string (street address only)
- city: string
- state: string (2-letter abbreviation)
- zipCode: string
- price: number (listing price, just the number)
- beds: number (bedrooms)
- baths: number (bathrooms)
- sqft: number (square footage)

Return ONLY valid JSON array, no markdown or explanation. If you can't extract any properties, return an empty array [].`
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract all property listings from this MLS document:'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:application/pdf;base64,${base64Content.substring(0, 500000)}`
              }
            }
          ]
        }
      ],
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('AI API error:', errorText);
    return [];
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '[]';
  
  try {
    const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(cleanContent);
  } catch {
    console.error('Failed to parse AI response:', content);
    return [];
  }
}
