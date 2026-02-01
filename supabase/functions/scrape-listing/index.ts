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
  photoUrl?: string;
  description?: string;
  summary?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format URL
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log('Scraping listing URL:', formattedUrl);

    // Use Firecrawl with extract format for structured property data
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ['markdown', 'extract'],
        extract: {
          schema: {
            type: 'object',
            properties: {
              address: { type: 'string', description: 'Street address of the property (without city, state, zip)' },
              city: { type: 'string', description: 'City name' },
              state: { type: 'string', description: 'State abbreviation (e.g. CA, TX, NY)' },
              zipCode: { type: 'string', description: 'ZIP code' },
              price: { type: 'number', description: 'Listing price in dollars (just the number, no symbols)' },
              beds: { type: 'number', description: 'Number of bedrooms' },
              baths: { type: 'number', description: 'Number of bathrooms' },
              sqft: { type: 'number', description: 'Square footage' },
              description: { type: 'string', description: 'Full property description or "About This Home" text. Clean text only, no links or branding.' },
              summary: { type: 'string', description: 'Property highlights or key features as a short summary (2-3 sentences max). Do not include any website branding or links.' },
            },
            required: ['address'],
          },
        },
        onlyMainContent: true,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Firecrawl API error:', data);
      return new Response(
        JSON.stringify({ success: false, error: data.error || `Request failed with status ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract property data from the response
    const extractedData = data.data?.extract || data.extract || {};
    const metadata = data.data?.metadata || data.metadata || {};
    
    // Try to get an image from metadata if available
    const photoUrl = metadata.ogImage || metadata.image || null;

    // Clean function to remove Redfin branding/links from text
    const cleanText = (text: string | undefined): string | undefined => {
      if (!text) return undefined;
      return text
        .replace(/redfin\.com/gi, '')
        .replace(/redfin/gi, '')
        .replace(/https?:\/\/[^\s]+/g, '')
        .replace(/\s+/g, ' ')
        .trim() || undefined;
    };

    const propertyData: PropertyData = {
      address: extractedData.address || undefined,
      city: extractedData.city || undefined,
      state: extractedData.state || undefined,
      zipCode: extractedData.zipCode || undefined,
      price: extractedData.price ? Number(extractedData.price) : undefined,
      beds: extractedData.beds ? Number(extractedData.beds) : undefined,
      baths: extractedData.baths ? Number(extractedData.baths) : undefined,
      sqft: extractedData.sqft ? Number(extractedData.sqft) : undefined,
      photoUrl: photoUrl || undefined,
      description: cleanText(extractedData.description),
      summary: cleanText(extractedData.summary),
    };

    console.log('Extracted property data:', propertyData);

    return new Response(
      JSON.stringify({ success: true, data: propertyData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error scraping listing:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to scrape listing';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
