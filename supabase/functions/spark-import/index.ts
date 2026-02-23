import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import md5 from 'https://esm.sh/md5@2.3.0'

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

// Create a Spark API session using MD5 signature-based auth
async function createSparkSession(apiKey: string, apiSecret: string): Promise<string> {
  console.log('Creating Spark API session...');

  // ApiSig for session creation = MD5(secret + "ApiKey" + key)
  const sigInput = `${apiSecret}ApiKey${apiKey}`;
  const apiSig = md5(sigInput);

  const url = `https://sparkapi.com/v1/session?ApiKey=${encodeURIComponent(apiKey)}&ApiSig=${apiSig}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: '',
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Spark session creation failed:', response.status, errorText);
    throw new Error(`Spark authentication failed (${response.status}). Please contact support.`);
  }

  const data = await response.json();
  const token = data?.D?.Results?.[0]?.AuthToken;

  if (!token) {
    console.error('No AuthToken in Spark response:', JSON.stringify(data));
    throw new Error('Failed to get Spark session token');
  }

  console.log('Spark session created successfully');
  return token;
}

// Compute ApiSig for an authenticated Spark API request
function computeApiSig(apiSecret: string, apiKey: string, servicePath: string, authToken: string, params: Record<string, string> = {}): string {
  // Format: [secret]ApiKey[key]ServicePath[path]AuthToken[token]param1[value1]...paramN[valueN]
  let sigInput = `${apiSecret}ApiKey${apiKey}ServicePath${servicePath}AuthToken${authToken}`;

  // Sort params alphabetically by name, then append name+value
  const sortedKeys = Object.keys(params).sort();
  for (const key of sortedKeys) {
    sigInput += `${key}${params[key]}`;
  }

  return md5(sigInput);
}

// Make an authenticated GET request to Spark API
async function sparkGet(apiKey: string, apiSecret: string, authToken: string, servicePath: string, params: Record<string, string> = {}): Promise<any> {
  const apiSig = computeApiSig(apiSecret, apiKey, servicePath, authToken, params);

  const queryParams = new URLSearchParams({
    ...params,
    AuthToken: authToken,
    ApiSig: apiSig,
  });

  const url = `https://sparkapi.com${servicePath}?${queryParams.toString()}`;

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Spark API error (${servicePath}):`, response.status, errorText);
    throw new Error(`Spark API error: ${response.status}`);
  }

  return response.json();
}

// Search listings by MLS number
async function searchByMlsNumber(apiKey: string, apiSecret: string, authToken: string, mlsNumber: string): Promise<SparkListing | null> {
  console.log(`Searching for MLS# ${mlsNumber}...`);

  const data = await sparkGet(apiKey, apiSecret, authToken, '/v1/listings', {
    _filter: `ListingId Eq '${mlsNumber}'`,
    _expand: 'Media,Documents',
  });

  const listings = data.D?.Results || [];

  if (listings.length === 0) {
    console.log('No listing found for MLS#', mlsNumber);
    return null;
  }

  console.log('Found listing:', listings[0].Id);
  return listings[0];
}

// Search listings by address
async function searchByAddress(apiKey: string, apiSecret: string, authToken: string, address: string): Promise<SparkListing[]> {
  console.log(`Searching for address: ${address}...`);

  const data = await sparkGet(apiKey, apiSecret, authToken, '/v1/listings', {
    _filter: `UnparsedAddress Eq '${address}'`,
    _expand: 'Media,Documents',
    _limit: '10',
  });

  const listings = data.D?.Results || [];
  console.log(`Found ${listings.length} listings for address`);
  return listings;
}

// Get listing photos
async function getListingPhotos(apiKey: string, apiSecret: string, authToken: string, listingId: string): Promise<SparkPhoto[]> {
  console.log(`Fetching photos for listing ${listingId}...`);

  try {
    const data = await sparkGet(apiKey, apiSecret, authToken, `/v1/listings/${listingId}/media`, {});
    const photos = data.D?.Results || [];
    console.log(`Found ${photos.length} photos`);
    return photos.filter((p: SparkPhoto) => p.MediaType === 'Photo');
  } catch {
    console.warn('Failed to fetch photos for listing', listingId);
    return [];
  }
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

    console.log('Authenticated user:', claims.user.id);

    // Parse request body
    const { action, mls_number, address } = await req.json();

    if (!action) {
      return new Response(
        JSON.stringify({ error: 'Action is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get HomeFolio's Spark API credentials from environment secrets
    const apiKey = Deno.env.get('SPARK_API_KEY');
    const apiSecret = Deno.env.get('SPARK_API_SECRET');

    if (!apiKey || !apiSecret) {
      console.error('SPARK_API_KEY or SPARK_API_SECRET not configured');
      return new Response(
        JSON.stringify({ error: 'MLS integration is not configured. Please contact support.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Spark API session
    const sparkToken = await createSparkSession(apiKey, apiSecret);

    let result;

    switch (action) {
      case 'search_mls': {
        if (!mls_number) {
          return new Response(
            JSON.stringify({ error: 'MLS number is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const listing = await searchByMlsNumber(apiKey, apiSecret, sparkToken, mls_number);

        if (!listing) {
          return new Response(
            JSON.stringify({ error: `No listing found for MLS# ${mls_number}` }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const photos = await getListingPhotos(apiKey, apiSecret, sparkToken, listing.Id);
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

        const listings = await searchByAddress(apiKey, apiSecret, sparkToken, address);

        // Transform all listings with their photos
        result = await Promise.all(
          listings.map(async (listing) => {
            const photos = await getListingPhotos(apiKey, apiSecret, sparkToken, listing.Id);
            return transformListing(listing, photos);
          })
        );
        break;
      }

      case 'test_connection': {
        // Session was already created above — if we got here, credentials work
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
