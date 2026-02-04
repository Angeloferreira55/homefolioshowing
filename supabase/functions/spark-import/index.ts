import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SparkListing {
  Id: string;
  ListingId: string;
  ListPrice: number;
  UnparsedAddress: string;
  City: string;
  StateOrProvince: string;
  PostalCode: string;
  BedroomsTotal: number;
  BathroomsTotalInteger: number;
  LivingArea: number;
  LotSizeAcres: number;
  YearBuilt: number;
  PropertyType: string;
  PublicRemarks: string;
  Heating: string[];
  Cooling: string[];
  GarageSpaces: number;
  AssociationFee: number;
  Media?: { MediaURL: string; Order: number }[];
  Documents?: { DocumentName: string; DocumentUrl: string; DocumentType: string }[];
}

interface SparkPhoto {
  MediaURL: string;
  Order: number;
  MediaType: string;
}

// Get OAuth token from Spark API
async function getSparkToken(apiKey: string, apiSecret: string): Promise<string> {
  console.log('Authenticating with Spark API...');
  
  const tokenUrl = 'https://sparkplatform.com/oauth2/token';
  const credentials = btoa(`${apiKey}:${apiSecret}`);
  
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Spark auth failed:', response.status, errorText);
    throw new Error(`Spark authentication failed: ${response.status}`);
  }
  
  const data = await response.json();
  console.log('Spark authentication successful');
  return data.access_token;
}

// Search listings by MLS number
async function searchByMlsNumber(token: string, mlsNumber: string): Promise<SparkListing | null> {
  console.log(`Searching for MLS# ${mlsNumber}...`);
  
  const url = `https://sparkapi.com/v1/listings?_filter=ListingId Eq '${mlsNumber}'&_expand=Media,Documents`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Spark search failed:', response.status, errorText);
    throw new Error(`Spark API error: ${response.status}`);
  }
  
  const data = await response.json();
  const listings = data.D?.Results || [];
  
  if (listings.length === 0) {
    console.log('No listing found for MLS#', mlsNumber);
    return null;
  }
  
  console.log('Found listing:', listings[0].Id);
  return listings[0];
}

// Search listings by address
async function searchByAddress(token: string, address: string): Promise<SparkListing[]> {
  console.log(`Searching for address: ${address}...`);
  
  // URL encode the address for the filter
  const encodedAddress = encodeURIComponent(address);
  const url = `https://sparkapi.com/v1/listings?_filter=UnparsedAddress Eq '${encodedAddress}'&_expand=Media,Documents&_limit=10`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Spark search failed:', response.status, errorText);
    throw new Error(`Spark API error: ${response.status}`);
  }
  
  const data = await response.json();
  const listings = data.D?.Results || [];
  
  console.log(`Found ${listings.length} listings for address`);
  return listings;
}

// Get listing photos
async function getListingPhotos(token: string, listingId: string): Promise<SparkPhoto[]> {
  console.log(`Fetching photos for listing ${listingId}...`);
  
  const url = `https://sparkapi.com/v1/listings/${listingId}/media`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });
  
  if (!response.ok) {
    console.warn('Failed to fetch photos:', response.status);
    return [];
  }
  
  const data = await response.json();
  const photos = data.D?.Results || [];
  
  console.log(`Found ${photos.length} photos`);
  return photos.filter((p: SparkPhoto) => p.MediaType === 'Photo');
}

// Transform Spark listing to our property format
function transformListing(listing: SparkListing, photos: SparkPhoto[]) {
  // Get primary photo (lowest order number)
  const sortedPhotos = [...photos].sort((a, b) => (a.Order || 0) - (b.Order || 0));
  const primaryPhoto = sortedPhotos[0]?.MediaURL || null;
  
  // Extract features from various fields
  const features: string[] = [];
  if (listing.Heating?.length) features.push(`Heating: ${listing.Heating.join(', ')}`);
  if (listing.Cooling?.length) features.push(`Cooling: ${listing.Cooling.join(', ')}`);
  if (listing.GarageSpaces) features.push(`${listing.GarageSpaces} Car Garage`);
  
  return {
    mls_number: listing.ListingId,
    address: listing.UnparsedAddress,
    city: listing.City,
    state: listing.StateOrProvince,
    zip_code: listing.PostalCode,
    price: listing.ListPrice,
    beds: listing.BedroomsTotal,
    baths: listing.BathroomsTotalInteger,
    sqft: listing.LivingArea,
    lot_size: listing.LotSizeAcres ? `${listing.LotSizeAcres} acres` : null,
    year_built: listing.YearBuilt,
    property_type: listing.PropertyType,
    description: listing.PublicRemarks,
    heating: listing.Heating?.join(', ') || null,
    cooling: listing.Cooling?.join(', ') || null,
    garage: listing.GarageSpaces ? `${listing.GarageSpaces} Car` : null,
    hoa_fee: listing.AssociationFee || null,
    features,
    photo_url: primaryPhoto,
    photos: sortedPhotos.map(p => p.MediaURL),
    documents: listing.Documents?.map(d => ({
      name: d.DocumentName,
      url: d.DocumentUrl,
      type: d.DocumentType,
    })) || [],
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !claims?.user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claims.user.id;
    console.log('Authenticated user:', userId);

    // Parse request body
    const { action, mls_number, address } = await req.json();
    
    if (!action) {
      return new Response(
        JSON.stringify({ error: 'Action is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's MLS credentials from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('mls_api_key, mls_api_secret, mls_board_id, mls_provider')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Profile error:', profileError);
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!profile.mls_api_key || !profile.mls_api_secret) {
      return new Response(
        JSON.stringify({ error: 'MLS credentials not configured. Please add your Spark API credentials in your profile settings.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Spark OAuth token
    const sparkToken = await getSparkToken(profile.mls_api_key, profile.mls_api_secret);

    let result;

    switch (action) {
      case 'search_mls': {
        if (!mls_number) {
          return new Response(
            JSON.stringify({ error: 'MLS number is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const listing = await searchByMlsNumber(sparkToken, mls_number);
        
        if (!listing) {
          return new Response(
            JSON.stringify({ error: `No listing found for MLS# ${mls_number}` }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const photos = await getListingPhotos(sparkToken, listing.Id);
        result = transformListing(listing, photos);
        break;
      }

      case 'search_address': {
        if (!address) {
          return new Response(
            JSON.stringify({ error: 'Address is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const listings = await searchByAddress(sparkToken, address);
        
        // Transform all listings with their photos
        result = await Promise.all(
          listings.map(async (listing) => {
            const photos = await getListingPhotos(sparkToken, listing.Id);
            return transformListing(listing, photos);
          })
        );
        break;
      }

      case 'test_connection': {
        // Just verify credentials work
        result = { success: true, message: 'MLS connection successful!' };
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    console.log('Spark import completed successfully');
    
    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Spark import error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
