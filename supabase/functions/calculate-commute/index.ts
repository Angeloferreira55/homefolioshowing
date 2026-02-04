import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface CommuteRequest {
  origins: string[]; // Property addresses
  destination: string; // Work/school address
  mode?: 'driving' | 'walking' | 'transit';
}

interface CommuteResult {
  origin: string;
  destination: string;
  duration_text: string;
  duration_minutes: number;
  distance_text: string;
  distance_meters: number;
  mode: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { origins, destination, mode = 'driving' }: CommuteRequest = await req.json();

    if (!origins || !Array.isArray(origins) || origins.length === 0) {
      return new Response(
        JSON.stringify({ error: 'origins array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!destination) {
      return new Response(
        JSON.stringify({ error: 'destination is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Calculating commute for ${origins.length} origins to ${destination} via ${mode}`);

    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    
    // Use OpenRouteService (free tier) for distance matrix calculations
    // Fallback to estimated times if no API available
    const results: CommuteResult[] = [];

    for (const origin of origins) {
      // For now, use a simple estimation based on typical commute patterns
      // This can be upgraded to use Google Maps API, OpenRouteService, or MapBox
      const estimatedResult = await estimateCommute(origin, destination, mode);
      results.push(estimatedResult);
    }

    console.log(`Calculated ${results.length} commute results`);

    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Commute calculation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to calculate commute';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function estimateCommute(
  origin: string,
  destination: string,
  mode: string
): Promise<CommuteResult> {
  // Get coordinates for both addresses using geocoding
  const [originCoords, destCoords] = await Promise.all([
    geocodeAddress(origin),
    geocodeAddress(destination),
  ]);

  if (!originCoords || !destCoords) {
    // Return a placeholder if geocoding fails
    return {
      origin,
      destination,
      duration_text: 'Unable to calculate',
      duration_minutes: 0,
      distance_text: 'Unknown',
      distance_meters: 0,
      mode,
    };
  }

  // Calculate distance using Haversine formula
  const distanceKm = haversineDistance(
    originCoords.lat,
    originCoords.lon,
    destCoords.lat,
    destCoords.lon
  );

  const distanceMeters = Math.round(distanceKm * 1000);
  const distanceMiles = distanceKm * 0.621371;

  // Estimate time based on mode and typical speeds
  let speedKmh: number;
  switch (mode) {
    case 'walking':
      speedKmh = 5; // 5 km/h walking
      break;
    case 'transit':
      speedKmh = 25; // Average including wait times
      break;
    case 'driving':
    default:
      speedKmh = 40; // Urban driving average
      break;
  }

  const durationMinutes = Math.round((distanceKm / speedKmh) * 60);
  
  // Format duration text
  let durationText: string;
  if (durationMinutes < 60) {
    durationText = `${durationMinutes} min`;
  } else {
    const hours = Math.floor(durationMinutes / 60);
    const mins = durationMinutes % 60;
    durationText = mins > 0 ? `${hours} hr ${mins} min` : `${hours} hr`;
  }

  // Format distance text
  const distanceText = distanceMiles < 1 
    ? `${Math.round(distanceMiles * 5280)} ft`
    : `${distanceMiles.toFixed(1)} mi`;

  return {
    origin,
    destination,
    duration_text: durationText,
    duration_minutes: durationMinutes,
    distance_text: distanceText,
    distance_meters: distanceMeters,
    mode,
  };
}

interface Coordinates {
  lat: number;
  lon: number;
}

async function geocodeAddress(address: string): Promise<Coordinates | null> {
  try {
    // Use Nominatim (OpenStreetMap) free geocoding
    const encodedAddress = encodeURIComponent(address);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`,
      {
        headers: {
          'User-Agent': 'HomeFolio/1.0',
        },
      }
    );

    if (!response.ok) {
      console.error(`Geocoding failed for: ${address}`);
      return null;
    }

    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
      };
    }

    console.warn(`No geocoding results for: ${address}`);
    return null;
  } catch (error) {
    console.error(`Geocoding error for ${address}:`, error);
    return null;
  }
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
