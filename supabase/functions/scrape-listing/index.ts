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
  yearBuilt?: number;
  lotSize?: string;
  propertyType?: string;
  hoaFee?: number;
  garage?: string;
  heating?: string;
  cooling?: string;
  features?: string[];
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
    // Include 'links' format to capture image URLs from the page
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ['markdown', 'links', 'extract'],
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
              baths: { type: 'number', description: 'Number of bathrooms (can be decimal like 2.5)' },
              sqft: { type: 'number', description: 'Square footage of living space' },
              description: { type: 'string', description: 'Full property description or "About This Home" text. Extract ALL paragraphs. Clean text only, no links or branding.' },
              summary: { type: 'string', description: 'Property highlights or key features as a short summary (2-3 sentences max). Do not include any website branding or links.' },
              yearBuilt: { type: 'number', description: 'Year the property was built (e.g. 1995, 2020)' },
              lotSize: { type: 'string', description: 'Lot size (e.g. "0.25 acres", "10,890 sqft")' },
              propertyType: { type: 'string', description: 'Type of property (e.g. Single Family, Condo, Townhouse, Multi-Family)' },
              hoaFee: { type: 'number', description: 'Monthly HOA fee in dollars (just the number)' },
              garage: { type: 'string', description: 'Garage information (e.g. "2-car attached", "1-car detached", "None")' },
              heating: { type: 'string', description: 'Heating type (e.g. "Forced Air", "Central", "Radiant")' },
              cooling: { type: 'string', description: 'Cooling/AC type (e.g. "Central AC", "Window Unit", "None")' },
              features: { 
                type: 'array', 
                items: { type: 'string' },
                description: 'List of property features and amenities (e.g. ["Pool", "Hardwood Floors", "Stainless Steel Appliances", "Fireplace", "Updated Kitchen"]). Extract key features mentioned in the listing.'
              },
              mainPhotoUrl: { type: 'string', description: 'URL of the main property photo or hero image. Look for the largest/primary listing photo.' },
            },
            required: ['address'],
          },
        },
        onlyMainContent: false, // Need full page to get images
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
    const links = data.data?.links || data.links || [];
    
    // Try multiple sources for the property photo
    // 1. AI-extracted main photo URL from the page
    // 2. Open Graph image from metadata
    // 3. Find a Zillow/Realtor photo from links
    let photoUrl = extractedData.mainPhotoUrl || metadata.ogImage || metadata.image || null;
    
    // If no photo found yet, search links for property images
    if (!photoUrl && Array.isArray(links)) {
      // Look for Zillow photo CDN URLs
      const zillowPhotoPattern = /photos\.zillowstatic\.com/i;
      const realtorPhotoPattern = /ar\.rdcpix\.com/i;
      const genericImagePattern = /\.(jpg|jpeg|png|webp)(\?|$)/i;
      
      for (const link of links) {
        if (typeof link === 'string') {
          if (zillowPhotoPattern.test(link) || realtorPhotoPattern.test(link)) {
            // Prefer high-res versions
            if (link.includes('1536') || link.includes('1024') || link.includes('uncropped')) {
              photoUrl = link;
              break;
            }
            if (!photoUrl) {
              photoUrl = link;
            }
          } else if (!photoUrl && genericImagePattern.test(link) && link.includes('http')) {
            // Fallback to any image link
            photoUrl = link;
          }
        }
      }
    }
    
    console.log('Photo URL found:', photoUrl);

    // Clean function to remove Redfin branding/links from text
    const cleanText = (text: string | undefined): string | undefined => {
      if (!text) return undefined;
      return text
        .replace(/redfin\.com/gi, '')
        .replace(/redfin/gi, '')
        .replace(/zillow\.com/gi, '')
        .replace(/zillow/gi, '')
        .replace(/realtor\.com/gi, '')
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
      yearBuilt: extractedData.yearBuilt ? Number(extractedData.yearBuilt) : undefined,
      lotSize: extractedData.lotSize || undefined,
      propertyType: extractedData.propertyType || undefined,
      hoaFee: extractedData.hoaFee ? Number(extractedData.hoaFee) : undefined,
      garage: extractedData.garage || undefined,
      heating: extractedData.heating || undefined,
      cooling: extractedData.cooling || undefined,
      features: Array.isArray(extractedData.features) ? extractedData.features.filter(Boolean) : undefined,
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
