import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { checkRateLimit, getRateLimitIdentifier } from '../_shared/rateLimit.ts';

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
  county?: string; // Especially for California
  apn?: string; // California Assessor's Parcel Number
  melloroos?: boolean; // California Mello-Roos tax
  communityName?: string; // Subdivision/community name
  schoolDistrict?: string; // School district
  publicRemarks?: string;
  summary?: string;
  features?: string[];
}

const extractionPrompt = `You are an expert MLS document parser supporting ALL regional MLS formats (New Mexico, California, Texas, etc.). Your job is to extract ALL property listing data with high accuracy.

CRITICAL INSTRUCTIONS:
1. Look CAREFULLY at the entire document for each data point
2. Numbers like price, beds, baths, sqft are ALWAYS present - search thoroughly
3. PRICE variations by region:
   - Standard: "List Price:", "Asking Price:", "Price:"
   - California MLS: "List Price:", "LP:", "Listing Price:"
   - New Mexico MLS: "Price:", "List Price:"
4. BEDROOM/BATH variations:
   - "3 BR / 2 BA", "Beds: 3, Baths: 2", "3BD/2BA"
   - California: "Bedrooms:", "# Bedrooms:", "BR:"
   - Sometimes in property details grid or table
5. SQUARE FOOTAGE variations:
   - "Sq Ft", "Living Area", "SqFt", "Approx SqFt", "Total Sq Ft"
   - California: "Approx. Living Area", "Living Space", "Interior Sq Ft"
6. ADDRESS variations:
   - Full address may be in header, footer, or property details section
   - California often includes county name
7. If a value appears multiple times, use the most specific/detailed one

REGIONAL FORMAT SUPPORT:
- California MLS (CRMLS, MLSListings, etc.): Look for "Parcel Number", "APN", "Mello-Roos", "HOA", community names
- New Mexico MLS: Look for "MLS#", "DOM", standard fields
- All formats: Adapt to table layouts, grid formats, or narrative descriptions

Return a JSON array with one object per property. Use these EXACT field names:

REQUIRED FIELDS (search thoroughly, these should almost always be found):
- address: string (street address only, e.g., "123 Main Street NE")
- city: string (city name)
- state: string (2-letter abbreviation, e.g., "NM", "TX")
- zipCode: string (5-digit zip code)
- price: number (list price as integer, e.g., 499000 not "$499,000")
- beds: number (total bedrooms as integer)
- baths: number (total bathrooms, can be decimal like 2.5)
- sqft: number (living area square footage as integer)

ADDITIONAL FIELDS (extract if present, use null if not found):
- mlsNumber: string (MLS listing number/ID, may be labeled "MLS#", "Listing ID", "Matrix ID")
- propertySubType: string (e.g., "Single Family Residence", "Condo", "Townhouse", "SFR")
- daysOnMarket: number (DOM, CDOM, or "Days on Market" value)
- yearBuilt: number (4-digit year, e.g., 1985)
- pricePerSqft: number (price per square foot, may need to calculate)
- lotSizeAcres: number (lot size in acres, convert from sqft if needed: sqft/43560)
- garageSpaces: number (number of garage spaces, may be "attached" or "detached")
- roof: string (roof type/material)
- heating: string (heating type)
- cooling: string (cooling type, CA often lists "Central Air", "AC")
- taxAnnualAmount: number (annual tax amount, may be "Annual Taxes")
- hasHoa: boolean (true if HOA/Association mentioned)
- hoaFee: number (HOA fee amount if applicable)
- hoaFeeFrequency: string (e.g., "Monthly", "Quarterly", "Annually")
- hasPid: boolean (true if PID/Special assessment is present)
- county: string (county name, especially important for California MLS)
- apn: string (California: Assessor's Parcel Number / APN)
- melloroos: boolean (California: true if Mello-Roos tax mentioned)
- communityName: string (planned community, subdivision, or development name)
- schoolDistrict: string (school district name if mentioned)
- publicRemarks: string (full public remarks/description text)
- summary: string (generate 3-5 bullet points highlighting KEY selling features, format as "• Feature 1\\n• Feature 2\\n• Feature 3")
- features: string[] (array of notable features, e.g., ["Hardwood Floors", "Updated Kitchen", "Pool", "Mountain Views"])

IMPORTANT:
- Return ONLY a valid JSON array, no markdown code blocks or explanation
- Each property is a separate object in the array
- Use null for truly missing values, but try hard to find the required fields
- Clean numeric values: remove $ and commas (e.g., "$499,000" → 499000)`;

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

    // Validate file type based on actual content
    const validatedFileType = await validateFileType(fileData);
    if (!validatedFileType) {
      console.error('Invalid file type detected');
      await serviceSupabase
        .from('mls_parsing_jobs')
        .update({
          status: 'error',
          error: 'Invalid file type. Only PDF, CSV, and Excel files are supported.',
        })
        .eq('id', jobId);
      return;
    }

    // Use validated file type instead of client-provided one
    console.log(`File type validated: ${validatedFileType} (client provided: ${fileType})`);

    await serviceSupabase
      .from('mls_parsing_jobs')
      .update({ progress: 30 })
      .eq('id', jobId);

    let extractedProperties: PropertyData[] = [];

    if (validatedFileType === 'csv' || validatedFileType === 'excel') {
      const text = await fileData.text();
      extractedProperties = await parseCSVWithAI(text, lovableApiKey);
    } else if (validatedFileType === 'pdf') {
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

/**
 * Validate file type based on file content (magic bytes)
 * @param fileData - The file blob
 * @returns The detected file type or null if invalid
 */
async function validateFileType(fileData: Blob): Promise<'pdf' | 'csv' | 'excel' | null> {
  try {
    // Check MIME type first
    const mimeType = fileData.type;

    // Read first few bytes to check magic bytes
    const arrayBuffer = await fileData.slice(0, 10).arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // PDF magic bytes: %PDF (25 50 44 46)
    if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
      return 'pdf';
    }

    // Excel magic bytes (PK for .xlsx): 50 4B (ZIP format)
    if (bytes[0] === 0x50 && bytes[1] === 0x4B) {
      // Could be xlsx or other ZIP format
      if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
        return 'excel';
      }
    }

    // CSV is text-based, check if it starts with printable ASCII
    const isLikelyText = bytes.every(byte =>
      (byte >= 0x20 && byte <= 0x7E) || byte === 0x09 || byte === 0x0A || byte === 0x0D
    );

    if (isLikelyText && (mimeType.includes('csv') || mimeType.includes('text'))) {
      return 'csv';
    }

    // Fallback to MIME type check
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('csv')) return 'csv';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'excel';

    return null;
  } catch (error) {
    console.error('File type validation error:', error);
    return null;
  }
}

async function validateAndNormalizeProperties(properties: PropertyData[]): Promise<PropertyData[]> {
  return properties.map((prop, index) => {
    const normalized = { ...prop };
    
    // Log extraction completeness for debugging
    const requiredFields = ['address', 'price', 'beds', 'baths', 'sqft'];
    const missingRequired = requiredFields.filter(field => 
      normalized[field as keyof PropertyData] === null || 
      normalized[field as keyof PropertyData] === undefined
    );
    
    if (missingRequired.length > 0) {
      console.warn(`Property ${index + 1} (${normalized.address || 'unknown'}): Missing required fields: ${missingRequired.join(', ')}`);
    }
    
    // Normalize price - ensure it's a clean number
    if (typeof normalized.price === 'string') {
      normalized.price = parseInt(String(normalized.price).replace(/[$,]/g, ''), 10) || undefined;
    }
    
    // Normalize beds/baths - ensure they're numbers
    if (typeof normalized.beds === 'string') {
      normalized.beds = parseInt(normalized.beds, 10) || undefined;
    }
    if (typeof normalized.baths === 'string') {
      normalized.baths = parseFloat(normalized.baths) || undefined;
    }
    
    // Normalize sqft
    if (typeof normalized.sqft === 'string') {
      normalized.sqft = parseInt(String(normalized.sqft).replace(/,/g, ''), 10) || undefined;
    }
    
    // Normalize yearBuilt
    if (typeof normalized.yearBuilt === 'string') {
      normalized.yearBuilt = parseInt(normalized.yearBuilt, 10) || undefined;
    }
    
    // Log successful extraction
    const extractedCount = Object.values(normalized).filter(v => v !== null && v !== undefined).length;
    console.log(`Property ${index + 1}: Extracted ${extractedCount} fields - ${normalized.address || 'No address'}, $${normalized.price || 'N/A'}, ${normalized.beds || '?'}bd/${normalized.baths || '?'}ba, ${normalized.sqft || '?'}sqft`);
    
    return normalized;
  });
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
                text: 'Extract ALL property data from this MLS document (could be from California, New Mexico, Texas, or any US state). Pay special attention to: PRICE (list price), BEDROOMS, BATHROOMS, and SQUARE FOOTAGE. These fields are critical and almost always present in MLS sheets. Look for labels like "List Price:", "LP:", "BR/BA:", "Sq Ft:", "Living Area:", "Approx. Living Area:", etc. For California MLS, also look for APN, county, Mello-Roos, and community names. Use OCR if this is a scanned document.'
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
    console.log('Raw AI response preview:', content.substring(0, 500));
    
    try {
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      const rawProperties = JSON.parse(cleanContent);
      
      // Validate and normalize the extracted properties
      return await validateAndNormalizeProperties(rawProperties);
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

    // Rate limiting: 10 MLS parsing requests per hour per user
    const identifier = getRateLimitIdentifier(req, userId);
    const rateLimit = await checkRateLimit(identifier, {
      maxRequests: 10,
      windowSeconds: 3600, // 1 hour
      operation: 'parse-mls-file',
    });

    if (!rateLimit.allowed) {
      console.warn(`Rate limit exceeded for ${identifier}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: rateLimit.error,
          retryAfter: Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': String(Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000)),
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': String(rateLimit.remaining),
            'X-RateLimit-Reset': rateLimit.resetAt.toISOString(),
          },
        }
      );
    }

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
