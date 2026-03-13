import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
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

const extractionPrompt = `You are an expert MLS document parser supporting ALL regional MLS formats (California CRMLS/Skyslope, New Mexico, Texas, etc.). Your job is to extract ALL property listing data with MAXIMUM accuracy.

CRITICAL INSTRUCTIONS:
1. Look CAREFULLY at the ENTIRE document for each data point - check ALL pages
2. Numbers like price, beds, baths, sqft are ALWAYS present - search thoroughly
3. Read field labels EXACTLY - do not guess or assume values
4. If a field is present but BLANK/EMPTY (e.g., "HEATING:  " with nothing after it), return null - do NOT guess or invent a value
5. For heating/cooling, copy the EXACT text from the document

══════════════════════════════════════════════════
CALIFORNIA CRMLS / SKYSLOPE FORMAT (most common)
══════════════════════════════════════════════════

ADDRESS — In CRMLS the address is ONLY in the page header as:
  "702 Diamond, Laguna Beach 92651"  →  street="702 Diamond", city="Laguna Beach", zip="92651", state="CA"
  "2621 Victoria Dr, Laguna Beach 92651"  →  street="2621 Victoria Dr", city="Laguna Beach", zip="92651", state="CA"
  The state is NEVER written explicitly — infer "CA" from the California city names.

BEDS / BATHS — CRMLS uses this exact format:
  "BED / BATH: 3/2,0,1,0"
  Parse as: beds=3, then baths = full + (half × 0.5) + (¾ × 0.75)
  The four numbers after the "/" are: full, three-quarter, half, quarter baths
  Examples:
    3/2,0,1,0  →  beds=3, baths=2.5  (2 full + 1 half)
    3/3,0,1,0  →  beds=3, baths=3.5  (3 full + 1 half)
    4/3,1,0,0  →  beds=4, baths=3.75 (3 full + 1 three-quarter)
    2/2,0,0,0  →  beds=2, baths=2.0  (2 full only)

SQUARE FOOTAGE — CRMLS format: "SQFT(src): 1,740 (AP)"
  Strip the source code in parentheses: (AP), (E), (ASR), (A), (B), (T), etc.
  Extract only the number: 1740

YEAR BUILT — CRMLS format: "YEAR BUILT(src): 1941 (ASR)"
  Strip source code, extract year: 1941

LOT SIZE — CRMLS format: "LOT(src): 2,400/0.0551 (A)"
  Format is: sqft/acres (source). Extract acres = 0.0551
  If only sqft shown, convert: lotSizeAcres = sqft / 43560

DAYS ON MARKET — CRMLS calls it "DAM / CDAM: 28/28"
  Use the first number (DAM) as daysOnMarket

LISTING ID — CRMLS calls it "LISTING ID: NP25279099" (not "MLS#")
  Also accept: "MLS#", "Matrix ID", "Listing Number"

PARCEL NUMBER — CRMLS calls it "PARCEL #: 65615125" (not "APN")
  Use this as the apn field

PRICE — Always in header: "LIST PRICE: $4,395,000" or top-right of page
  Remove $ and commas: 4395000

GARAGE — CRMLS format: "GARAGE: 2/Attached" or "GARAGE: 3/Detached"
  Extract number before "/" as garageSpaces

HOA — CRMLS: "HOA FEE: $0" means no HOA (hasHoa=false, hoaFee=null)
  Only set hasHoa=true if fee > 0 or HOA name is present

COOLING/HEATING — Copy EXACTLY as written after the label.
  If field label exists but value is blank/empty, return null.
  "COOLING: Central Air" → "Central Air"
  "HEATING: Forced Air" → "Forced Air"
  "COOLING: None" → "None"
  "HEATING:  " (blank) → null

═══════════════════════════════════
OTHER REGIONAL FORMATS
═══════════════════════════════════

PRICE variations:
   - "List Price:", "Asking Price:", "Price:", "LP:", "Listing Price:"
   - New Mexico MLS: "Price:", "List Price:"

BEDROOM/BATH variations (non-CRMLS):
   - "3 BR / 2 BA", "Beds: 3, Baths: 2", "3BD/2BA", "Bedrooms: 3"
   - Full baths + half baths = total (e.g., 2 full + 1 half = 2.5)

HEATING & COOLING (non-CRMLS):
   - "Central Heat", "Forced Air", "Gas Heat", "Heat Pump", "Electric", "Radiant", "Baseboard", "Wall Heater", "None"
   - "Central Air", "AC", "Air Conditioning", "Evaporative Cooler", "Swamp Cooler", "Window Unit", "None"
   - If multiple values listed, include all (e.g., "Forced Air, Heat Pump")

═══════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════

Return a JSON array with one object per property. Use these EXACT field names:

REQUIRED FIELDS:
- address: string (street address only, no city/state/zip)
- city: string
- state: string (2-letter, e.g., "CA", "NM", "TX")
- zipCode: string (5-digit)
- price: number (integer, no $ or commas)
- beds: number (integer)
- baths: number (decimal, e.g., 2.5)
- sqft: number (living area only, integer)

ADDITIONAL FIELDS (null if not found):
- mlsNumber: string (LISTING ID, MLS#, Matrix ID, Listing Number)
- propertySubType: string (e.g., "Single Family Residence", "Condo", "Townhouse")
- daysOnMarket: number (DAM, DOM, CDOM, or Days on Market)
- yearBuilt: number (4-digit year)
- pricePerSqft: number
- lotSizeAcres: number (in acres, convert if needed)
- garageSpaces: number
- roof: string
- heating: string (EXACT text, null if blank/missing)
- cooling: string (EXACT text, null if blank/missing)
- taxAnnualAmount: number
- hasHoa: boolean (true only if fee > 0 or named HOA exists)
- hoaFee: number (null if $0)
- hoaFeeFrequency: string
- hasPid: boolean
- county: string
- apn: string (PARCEL # or APN)
- melloroos: boolean
- communityName: string (SUBDIVISION field in CRMLS)
- schoolDistrict: string (HIGH SCHOOL DISTRICT field in CRMLS)
- publicRemarks: string (DESCRIPTION section full text)
- summary: string (3-5 bullet points of KEY selling features: "• Feature 1\\n• Feature 2\\n• Feature 3")
- features: string[] (notable features array)

RULES:
- Return ONLY a valid JSON array, no markdown, no explanation
- Each property is a separate object
- null for missing/blank values — never invent data
- Strip all $ and commas from numbers`;

async function processInBackground(
  jobId: string,
  filePath: string,
  fileType: string,
  serviceSupabase: SupabaseClient,
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
  // Common heating/cooling values for validation
  const validHeatingTypes = ['central heat', 'forced air', 'gas heat', 'heat pump', 'electric', 'radiant', 'baseboard', 'wall heater', 'none', 'natural gas', 'propane', 'oil', 'wood'];
  const validCoolingTypes = ['central air', 'ac', 'air conditioning', 'evaporative cooler', 'swamp cooler', 'window unit', 'none', 'ceiling fan'];

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

    // Validate heating type
    if (normalized.heating && typeof normalized.heating === 'string') {
      const heatingLower = normalized.heating.toLowerCase();
      const isValid = validHeatingTypes.some(valid => heatingLower.includes(valid));
      if (!isValid) {
        console.warn(`Property ${index + 1}: Unusual heating type "${normalized.heating}" - verify accuracy`);
      }
    }

    // Validate cooling type
    if (normalized.cooling && typeof normalized.cooling === 'string') {
      const coolingLower = normalized.cooling.toLowerCase();
      const isValid = validCoolingTypes.some(valid => coolingLower.includes(valid));
      if (!isValid) {
        console.warn(`Property ${index + 1}: Unusual cooling type "${normalized.cooling}" - verify accuracy`);
      }
    }

    // Log successful extraction
    const extractedCount = Object.values(normalized).filter(v => v !== null && v !== undefined).length;
    console.log(`Property ${index + 1}: Extracted ${extractedCount} fields - ${normalized.address || 'No address'}, $${normalized.price || 'N/A'}, ${normalized.beds || '?'}bd/${normalized.baths || '?'}ba, ${normalized.sqft || '?'}sqft, Heat: ${normalized.heating || 'N/A'}, Cool: ${normalized.cooling || 'N/A'}`);

    return normalized;
  });
}

async function extractPdfWithVisionApi(fileData: Blob, apiKey: string): Promise<PropertyData[]> {
  console.log('Processing PDF with OpenAI Responses API...');

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

    // Use OpenAI Responses API which supports PDF file inputs
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        instructions: extractionPrompt,
        input: [
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: 'Extract ALL property data from this MLS document. This may be a California CRMLS/Skyslope sheet or another regional format.\n\nCRITICAL for CRMLS/California sheets:\n1. ADDRESS is ONLY in the page header (e.g., "702 Diamond, Laguna Beach 92651") — parse street, city, zip from there. State = "CA" (never written explicitly).\n2. BED/BATH format "3/2,0,1,0" means beds=3, baths=2+0.5=2.5 (full,¾,half,¼). Calculate total baths correctly.\n3. SQFT(src), YEAR BUILT(src), LOT(src) — strip the source code in parentheses like (AP), (E), (ASR).\n4. LOT(src): "2400/0.0551 (A)" — acres are after the slash: 0.0551.\n5. LISTING ID is the mlsNumber. PARCEL # is the apn.\n6. DAM in "DAM / CDAM" is Days on Market.\n7. HEATING or COOLING field that is blank/empty after the colon → return null, do NOT guess.\n8. HOA FEE $0 → hasHoa=false, hoaFee=null.\n9. GARAGE "2/Attached" → garageSpaces=2.\n\nFor ALL formats: price is always near the top. Read every page carefully.'
              },
              {
                type: 'input_file',
                filename: 'mls-sheet.pdf',
                file_data: `data:application/pdf;base64,${base64Pdf}`
              }
            ]
          }
        ],
        temperature: 0,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI Responses API error:', errorText);
      return [];
    }

    const data = await response.json();
    // Responses API returns output array with output_text content
    const content = data.output?.find((o: any) => o.type === 'message')
      ?.content?.find((c: any) => c.type === 'output_text')?.text || '[]';

    console.log('OpenAI response received, parsing...');
    console.log('Raw AI response preview:', content.substring(0, 500));

    try {
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      const rawProperties = JSON.parse(cleanContent);

      // Validate and normalize the extracted properties
      return await validateAndNormalizeProperties(rawProperties);
    } catch {
      console.error('Failed to parse OpenAI response:', content.substring(0, 500));
      return [];
    }
  } catch (error) {
    console.error('Error in PDF extraction:', error);
    return [];
  }
}

const fastExtractionPrompt = `Extract property data from this MLS document. Return a JSON array of objects.

Required fields: address (street only), city, state (2-letter), zipCode, price (number), beds (number), baths (number), sqft (number).

Optional fields (null if missing): mlsNumber, propertySubType, daysOnMarket, yearBuilt, pricePerSqft, lotSizeAcres, garageSpaces, roof, heating (exact text), cooling (exact text), taxAnnualAmount, hasHoa, hoaFee, hoaFeeFrequency, hasPid, county, apn, melloroos, communityName, schoolDistrict, publicRemarks, features (string[]).

Rules: Clean numbers (remove $ and commas). Copy heating/cooling text exactly as written.`;

async function parseTextWithGroq(textContent: string, apiKey: string): Promise<PropertyData[] | null> {
  console.log('Parsing text with Groq (Llama 3.3 70B)...');

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: fastExtractionPrompt },
          { role: 'user', content: textContent.substring(0, 8000) }
        ],
        temperature: 0,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}';
    console.log('Groq response preview:', content.substring(0, 300));

    const parsed = JSON.parse(content);
    const properties = Array.isArray(parsed) ? parsed : (parsed.properties || parsed.data || [parsed]);
    return Array.isArray(properties) ? properties : [properties];
  } catch (error) {
    console.error('Groq parsing error:', error);
    return null;
  }
}

async function parseTextWithOpenAI(textContent: string, apiKey: string): Promise<PropertyData[]> {
  console.log('Parsing text with OpenAI...');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: fastExtractionPrompt },
        { role: 'user', content: textContent.substring(0, 8000) }
      ],
      temperature: 0,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    console.error('OpenAI API error:', await response.text());
    return [];
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '{}';

  try {
    const parsed = JSON.parse(content);
    const properties = Array.isArray(parsed) ? parsed : (parsed.properties || parsed.data || [parsed]);
    return Array.isArray(properties) ? properties : [properties];
  } catch {
    console.error('Failed to parse OpenAI response:', content.substring(0, 500));
    return [];
  }
}

async function parseCSVWithAI(csvContent: string, apiKey: string): Promise<PropertyData[]> {
  console.log('Parsing CSV with AI...');
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Use service role client for auth validation (more reliable in edge functions)
    const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await serviceSupabase.auth.getUser(token);
    if (userError || !user) {
      console.error('Auth error:', userError?.message);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
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

    const body = await req.json();
    const { filePath, fileType, fileData, mode } = body;

    const groqApiKey = Deno.env.get('GROQ_API_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!groqApiKey && !openaiApiKey) {
      console.error('No AI API key configured (GROQ_API_KEY or OPENAI_API_KEY)');
      return new Response(
        JSON.stringify({ success: false, error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── FAST SYNC MODE: client sends file data directly ──
    if (mode === 'sync' && fileData) {
      console.log('Processing in sync mode...');
      const detectedType = fileType || 'pdf';

      let properties: PropertyData[] = [];
      if (detectedType === 'pdf') {
        // Legacy: client sends base64 PDF binary
        const binaryStr = atob(fileData);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
        const blob = new Blob([bytes], { type: 'application/pdf' });
        properties = await extractPdfWithVisionApi(blob, openaiApiKey!);
      } else if (detectedType === 'text') {
        // Fast path: client already extracted text from PDF
        // Try Groq first (fastest), fall back to OpenAI
        if (groqApiKey) {
          properties = await parseTextWithGroq(fileData, groqApiKey) ?? [];
          if (properties.length === 0 && openaiApiKey) {
            console.log('Groq returned no results, falling back to OpenAI...');
            properties = await parseTextWithOpenAI(fileData, openaiApiKey);
          }
        } else if (openaiApiKey) {
          properties = await parseTextWithOpenAI(fileData, openaiApiKey);
        }
      } else {
        // CSV: fileData is plain text
        properties = await parseCSVWithAI(fileData, openaiApiKey!);
      }

      return new Response(
        JSON.stringify({ success: true, properties }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── ASYNC JOB MODE: existing flow for bulk imports ──
    if (!filePath) {
      return new Response(
        JSON.stringify({ success: false, error: 'File path or file data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
    (globalThis as any).EdgeRuntime?.waitUntil?.(
      processInBackground(job.id, filePath, fileType, serviceSupabase, openaiApiKey)
    ) ?? processInBackground(job.id, filePath, fileType, serviceSupabase, openaiApiKey);

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
