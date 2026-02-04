import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface PropertyData {
  mlsNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  price?: number;
  propertySubType?: string;
  daysOnMarket?: number;
  beds?: number;
  baths?: number;
  sqft?: number;
  yearBuilt?: number;
  pricePerSqft?: number;
  lotSizeAcres?: number;
  garageSpaces?: number;
  roof?: string;
  heating?: string;
  cooling?: string;
  taxAnnualAmount?: number;
  hasHoa?: boolean;
  hoaFee?: number;
  hoaFeeFrequency?: string;
  hasPid?: boolean;
  publicRemarks?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey);

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
      const text = await fileData.text();
      extractedProperties = await parseCSVWithAI(text, lovableApiKey);
    } else if (fileType === 'pdf') {
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

const extractionPrompt = `You are an MLS document parser. Extract property listing data from the provided document.

Return a JSON array with one object per property. Each object should have these fields (use null for missing values):

- mlsNumber: string (MLS listing number/ID)
- address: string (street address only, no city/state/zip)
- city: string
- state: string (2-letter abbreviation)
- zipCode: string
- price: number (list price, just the number)
- propertySubType: string (e.g., "Single Family Residence", "Condo", "Townhouse")
- daysOnMarket: number (DOM or CDOM value)
- beds: number (total bedrooms)
- baths: number (total bathrooms)
- sqft: number (living area square footage)
- yearBuilt: number (year the property was built)
- pricePerSqft: number (price per square foot)
- lotSizeAcres: number (lot size in acres)
- garageSpaces: number (number of garage spaces)
- roof: string (roof type/material)
- heating: string (heating type)
- cooling: string (cooling type)
- taxAnnualAmount: number (annual tax amount)
- hasHoa: boolean (true if there's an HOA/Association)
- hoaFee: number (HOA fee amount if applicable)
- hoaFeeFrequency: string (e.g., "Monthly", "Quarterly", "Annually")
- hasPid: boolean (true if PID is present/listed)
- publicRemarks: string (public remarks/description)

Return ONLY valid JSON array, no markdown or explanation.`;

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
        { role: 'system', content: extractionPrompt },
        { role: 'user', content: `Extract property data from this CSV:\n\n${csvContent.substring(0, 15000)}` }
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
    const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(cleanContent);
  } catch {
    console.error('Failed to parse AI response:', content);
    return [];
  }
}

async function parsePDFWithAI(base64Content: string, apiKey: string): Promise<PropertyData[]> {
  console.log('Parsing PDF with AI...');
  
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: extractionPrompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Extract all property listings from this MLS document:' },
            { type: 'image_url', image_url: { url: `data:application/pdf;base64,${base64Content.substring(0, 500000)}` } }
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
