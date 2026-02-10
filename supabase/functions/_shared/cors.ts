/**
 * CORS configuration for Supabase Edge Functions
 * Set ALLOWED_ORIGINS environment variable for production to restrict CORS
 */

/**
 * Get CORS headers based on environment configuration
 * @param origin - The origin from the request headers
 * @returns CORS headers object
 */
export function getCorsHeaders(origin?: string | null): Record<string, string> {
  // Get allowed origins from environment variable
  // Format: comma-separated list, e.g., "https://homefolioshowing.lovable.app,https://www.homefolioshowing.com"
  const allowedOriginsEnv = Deno.env.get('ALLOWED_ORIGINS');

  // Default to allow all origins if not configured (development)
  if (!allowedOriginsEnv) {
    return {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers':
        'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
      'Access-Control-Max-Age': '86400',
    };
  }

  // Parse allowed origins
  const allowedOrigins = allowedOriginsEnv.split(',').map(o => o.trim());

  // Check if request origin is allowed
  if (origin && allowedOrigins.includes(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Headers':
        'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
      'Access-Control-Max-Age': '86400',
      'Access-Control-Allow-Credentials': 'true',
    };
  }

  // Origin not allowed - return restrictive headers
  return {
    'Access-Control-Allow-Origin': allowedOrigins[0] || 'null',
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * Example usage in an Edge Function:
 *
 * ```typescript
 * import { getCorsHeaders } from '../_shared/cors.ts';
 *
 * Deno.serve(async (req) => {
 *   const origin = req.headers.get('origin');
 *   const corsHeaders = getCorsHeaders(origin);
 *
 *   if (req.method === 'OPTIONS') {
 *     return new Response(null, { headers: corsHeaders });
 *   }
 *
 *   // Your handler logic...
 *
 *   return new Response(JSON.stringify(data), {
 *     headers: { ...corsHeaders, 'Content-Type': 'application/json' }
 *   });
 * });
 * ```
 *
 * To enable production CORS, set the ALLOWED_ORIGINS environment variable in Supabase:
 * ```bash
 * supabase secrets set ALLOWED_ORIGINS="https://homefolioshowing.lovable.app,https://www.homefolioshowing.com"
 * ```
 */
