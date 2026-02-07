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
  summary?: string;
  features?: string[];
}

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
- publicRemarks: string (full public remarks/description)
- summary: string (generate 3-5 bullet points highlighting KEY selling features from the public remarks and property details, format as "• Feature 1\\n• Feature 2\\n• Feature 3")
- features: string[] (array of notable interior/exterior features mentioned, e.g., ["Hardwood Floors", "Gourmet Kitchen", "Pool"])

Return ONLY valid JSON array, no markdown or explanation.`;

async function processInBackground(
  jobId: string,
  filePath: string,
  fileType: string,
  serviceSupabase: ReturnType<typeof createClient>,
  lovableApiKey: string
) {
  console.log(`Background processing started for job ${jobId}`);
  
  try {
    // Download file
    console.log('Downloading file:', filePath);
    const { data: fileData, error: downloadError } = await serviceSupabase.storage
      .from('mls-uploads')
      .download(filePath);

    if (downloadError || !fileData) {
      console.error('Download error:', downloadError);
      await serviceSupabase
        .from('mls_parsing_jobs')
        .update({ status: 'error', error: 'Failed to download file' })
        .eq('id', jobId);
      return;
    }

    await serviceSupabase
      .from('mls_parsing_jobs')
      .update({ progress: 30 })
      .eq('id', jobId);

    let extractedProperties: PropertyData[] = [];

    if (fileType === 'csv' || fileType === 'excel') {
      const text = await fileData.text();
      extractedProperties = await parseCSVWithAI(text, lovableApiKey);
    } else if (fileType === 'pdf') {
      // Use Vision API for PDFs - handles both text and scanned/image-based PDFs
      extractedProperties = await extractPdfWithVisionApi(fileData, lovableApiKey);
    }

    await serviceSupabase
      .from('mls_parsing_jobs')
      .update({ progress: 90 })
      .eq('id', jobId);

    console.log('Extracted properties:', extractedProperties.length);

    // Update job with results
    await serviceSupabase
      .from('mls_parsing_jobs')
      .update({
        status: 'complete',
        progress: 100,
        result: extractedProperties,
      })
      .eq('id', jobId);

    console.log(`Job ${jobId} completed successfully`);
  } catch (error) {
    console.error('Background processing error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Processing failed';
    await serviceSupabase
      .from('mls_parsing_jobs')
      .update({ status: 'error', error: errorMessage })
      .eq('id', jobId);
  }
}

async function extractPdfWithVisionApi(fileData: Blob, apiKey: string): Promise<PropertyData[]> {
  console.log('Processing PDF with Vision API...');
  
  try {
    const arrayBuffer = await fileData.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    
    // Convert to base64
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode(...chunk);
    }
    const base64Pdf = btoa(binary);
    
    console.log(`PDF size: ${bytes.length} bytes, base64 length: ${base64Pdf.length}`);
    
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
              { 
                type: 'text', 
                text: 'Extract all property data from this MLS document. This may be a scanned PDF, so use OCR if needed to read all the text including prices, bedrooms, bathrooms, square footage, and all other property details.' 
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:application/pdf;base64,${base64Pdf}`
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
      console.error('Vision API error:', errorText);
      return [];
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '[]';
    
    console.log('Vision API response received, parsing...');
    
    try {
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanContent);
    } catch {
      console.error('Failed to parse Vision API response:', content.substring(0, 500));
      return [];
    }
  } catch (error) {
    console.error('Error in Vision API extraction:', error);
    return [];
  }
}

async function parseTextWithAI(textContent: string, apiKey: string): Promise<PropertyData[]> {
  console.log('Parsing text content with AI...');
  
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
        { role: 'user', content: `Extract property data from this MLS document text:\n\n${textContent.substring(0, 30000)}` }
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
    console.error('Failed to parse AI response:', content.substring(0, 500));
    return [];
  }
}

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

    // Create job record immediately
    const { data: job, error: jobError } = await serviceSupabase
      .from('mls_parsing_jobs')
      .insert({
        user_id: userId,
        file_path: filePath,
        file_type: fileType,
        status: 'processing',
        progress: 0,
      })
      .select()
      .single();

    if (jobError || !job) {
      console.error('Failed to create job:', jobError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create processing job' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Created job:', job.id);

    // Start background processing (non-blocking)
    EdgeRuntime.waitUntil(
      processInBackground(job.id, filePath, fileType, serviceSupabase, lovableApiKey)
    );

    // Return immediately with job ID
    return new Response(
      JSON.stringify({ success: true, jobId: job.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in parse-mls-file:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to start parsing';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
