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
  photoUrl?: string;
}

const extractionPrompt = `You are an expert MLS document parser. Your job is to extract ALL property listing data from MLS sheets with high accuracy.

CRITICAL INSTRUCTIONS:
1. Look CAREFULLY at the entire document for each data point
2. Numbers like price, beds, baths, sqft are ALWAYS present - search thoroughly
3. Price is usually prominent (e.g., "$499,000" or "List Price: 499000")
4. Bedrooms/Baths often shown as "3 BR / 2 BA" or "Beds: 3, Baths: 2" or in a grid
5. Square footage may be labeled "Sq Ft", "Living Area", "SqFt", "Approx SqFt"
6. If a value appears multiple times, use the most specific/detailed one

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
- mlsNumber: string (MLS listing number/ID)
- propertySubType: string (e.g., "Single Family Residence", "Condo", "Townhouse")
- daysOnMarket: number (DOM or CDOM value)
- yearBuilt: number (4-digit year, e.g., 1985)
- pricePerSqft: number (price per square foot)
- lotSizeAcres: number (lot size in acres, convert from sqft if needed: sqft/43560)
- garageSpaces: number (number of garage spaces)
- roof: string (roof type/material)
- heating: string (heating type)
- cooling: string (cooling type)
- taxAnnualAmount: number (annual tax amount)
- hasHoa: boolean (true if HOA/Association mentioned)
- hoaFee: number (HOA fee amount if applicable)
- hoaFeeFrequency: string (e.g., "Monthly", "Quarterly", "Annually")
- hasPid: boolean (true if PID/Special assessment is present)
- publicRemarks: string (full public remarks/description text)
- summary: string (generate 3-5 bullet points highlighting KEY selling features, format as "• Feature 1\\n• Feature 2\\n• Feature 3")
- features: string[] (array of notable features, e.g., ["Hardwood Floors", "Updated Kitchen", "Pool"])

IMPORTANT:
- Return ONLY a valid JSON array, no markdown code blocks or explanation
- Each property is a separate object in the array
- Use null for truly missing values, but try hard to find the required fields
- Clean numeric values: remove $ and commas (e.g., "$499,000" → 499000)`;

const photoExtractionPrompt = `You are a photo extraction assistant. Look at this MLS document and find the MAIN PROPERTY PHOTO (the largest exterior or interior photo of the home, NOT agent photos, logos, or map images).

If you find a main property photo, describe what you see in the image (exterior view, interior room, etc.) and respond with:
{
  "hasPhoto": true,
  "description": "Brief description of the photo"
}

If there is NO property photo visible, respond with:
{
  "hasPhoto": false,
  "description": null
}

Return ONLY the JSON object, no additional text.`;

async function extractPhotoFromPdf(
  fileData: Blob,
  apiKey: string,
  userId: string,
  propertyAddress: string,
  serviceSupabase: ReturnType<typeof createClient>
): Promise<string | null> {
  console.log('Attempting to extract property photo from PDF...');
  
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
    
    // Use image generation model to extract the photo
    // First, check if there's a photo to extract
    const checkResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: photoExtractionPrompt },
          { 
            role: 'user', 
            content: [
              { type: 'text', text: 'Analyze this MLS document and determine if it contains a main property photo.' },
              {
                type: 'image_url',
                image_url: {
                  url: `data:application/pdf;base64,${base64Pdf}`
                }
              }
            ]
          }
        ],
        temperature: 0,
      }),
    });

    if (!checkResponse.ok) {
      console.error('Photo check API error:', await checkResponse.text());
      return null;
    }

    const checkData = await checkResponse.json();
    const checkContent = checkData.choices?.[0]?.message?.content || '{}';
    
    let photoInfo;
    try {
      const cleanContent = checkContent.replace(/```json\n?|\n?```/g, '').trim();
      photoInfo = JSON.parse(cleanContent);
    } catch {
      console.log('Could not parse photo check response:', checkContent);
      return null;
    }
    
    if (!photoInfo.hasPhoto) {
      console.log('No property photo found in PDF');
      return null;
    }
    
    console.log('Property photo detected:', photoInfo.description);
    
    // Now extract the actual image using Gemini's image generation capability
    // We'll use Google's image model to recreate/extract the property photo
    const extractResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-pro-image-preview',
        messages: [
          { 
            role: 'user', 
            content: [
              { 
                type: 'text', 
                text: 'Extract and output ONLY the main property photo from this MLS document. Output the property photo as an image. Do not include any text, logos, or other elements - just the property photo itself.' 
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
        temperature: 0,
      }),
    });

    if (!extractResponse.ok) {
      console.error('Photo extraction API error:', await extractResponse.text());
      return null;
    }

    const extractData = await extractResponse.json();
    const extractContent = extractData.choices?.[0]?.message?.content;
    
    // Check if the response contains an image
    if (!extractContent) {
      console.log('No image content returned from extraction');
      return null;
    }
    
    // If the model returned inline image data (base64), upload it to storage
    // The response format varies - check for inline_data or base64 content
    let imageBase64: string | null = null;
    let mimeType = 'image/jpeg';
    
    // Check if there's an array of content parts
    const messageParts = extractData.choices?.[0]?.message?.parts || [];
    for (const part of messageParts) {
      if (part.inline_data?.data) {
        imageBase64 = part.inline_data.data;
        mimeType = part.inline_data.mime_type || 'image/jpeg';
        break;
      }
    }
    
    // Also check for image data in the content itself
    if (!imageBase64 && typeof extractContent === 'object' && extractContent.inline_data) {
      imageBase64 = extractContent.inline_data.data;
      mimeType = extractContent.inline_data.mime_type || 'image/jpeg';
    }
    
    if (!imageBase64) {
      console.log('No base64 image data found in response');
      return null;
    }
    
    console.log('Image extracted, uploading to storage...');
    
    // Convert base64 to Uint8Array for upload
    const imageBytes = Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0));
    const imageBlob = new Blob([imageBytes], { type: mimeType });
    
    // Generate a unique filename
    const timestamp = Date.now();
    const sanitizedAddress = propertyAddress
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase()
      .substring(0, 50);
    const extension = mimeType.includes('png') ? 'png' : 'jpg';
    const fileName = `${userId}/${timestamp}-${sanitizedAddress}.${extension}`;
    
    // Upload to client-photos bucket (it's public)
    const { data: uploadData, error: uploadError } = await serviceSupabase.storage
      .from('client-photos')
      .upload(fileName, imageBlob, {
        contentType: mimeType,
        upsert: false,
      });
    
    if (uploadError) {
      console.error('Failed to upload extracted photo:', uploadError);
      return null;
    }
    
    // Get the public URL
    const { data: urlData } = serviceSupabase.storage
      .from('client-photos')
      .getPublicUrl(fileName);
    
    console.log('Photo uploaded successfully:', urlData.publicUrl);
    return urlData.publicUrl;
    
  } catch (error) {
    console.error('Error extracting photo from PDF:', error);
    return null;
  }
}

async function processInBackground(
  jobId: string,
  filePath: string,
  fileType: string,
  serviceSupabase: ReturnType<typeof createClient>,
  lovableApiKey: string,
  userId: string
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
      
      // Update progress before photo extraction
      await serviceSupabase
        .from('mls_parsing_jobs')
        .update({ progress: 70 })
        .eq('id', jobId);
      
      // Try to extract photo for each property (typically one per PDF)
      if (extractedProperties.length > 0) {
        console.log('Attempting to extract property photos...');
        
        // Clone fileData for photo extraction (since we already read it)
        const { data: photoFileData } = await serviceSupabase.storage
          .from('mls-uploads')
          .download(filePath);
        
        if (photoFileData) {
          for (let i = 0; i < extractedProperties.length; i++) {
            const property = extractedProperties[i];
            const photoUrl = await extractPhotoFromPdf(
              photoFileData,
              lovableApiKey,
              userId,
              property.address || `property-${i}`,
              serviceSupabase
            );
            
            if (photoUrl) {
              extractedProperties[i].photoUrl = photoUrl;
              console.log(`Photo extracted for property: ${property.address}`);
            }
          }
        }
      }
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
                text: 'Extract ALL property data from this MLS document. Pay special attention to: PRICE (list price), BEDROOMS, BATHROOMS, and SQUARE FOOTAGE. These fields are critical and almost always present in MLS sheets. Look for labels like "List Price:", "BR/BA:", "Sq Ft:", "Living Area:", etc. Use OCR if this is a scanned document.' 
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

    const userId = claims.claims.sub as string;
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
      processInBackground(job.id, filePath, fileType, serviceSupabase, lovableApiKey, userId)
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
