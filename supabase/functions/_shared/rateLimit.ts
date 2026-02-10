import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed in the time window
   */
  maxRequests: number;
  /**
   * Time window in seconds
   */
  windowSeconds: number;
  /**
   * Name of the operation being rate limited (for logging)
   */
  operation: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  error?: string;
}

/**
 * Simple in-memory rate limiter using a Map
 * For production, consider using Redis or a dedicated rate limiting service
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Rate limit a request based on user ID or IP address
 * @param identifier - User ID or IP address
 * @param config - Rate limit configuration
 * @returns Rate limit result with allowed status and metadata
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const key = `${config.operation}:${identifier}`;
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;

  // Get or create rate limit entry
  let entry = rateLimitStore.get(key);

  // Reset if window has expired
  if (!entry || entry.resetAt <= now) {
    entry = {
      count: 0,
      resetAt: now + windowMs,
    };
  }

  // Increment request count
  entry.count++;
  rateLimitStore.set(key, entry);

  // Clean up old entries periodically (every 1000 requests)
  if (Math.random() < 0.001) {
    cleanupExpiredEntries();
  }

  const allowed = entry.count <= config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - entry.count);

  return {
    allowed,
    remaining,
    resetAt: new Date(entry.resetAt),
    error: allowed ? undefined : `Rate limit exceeded. Try again after ${new Date(entry.resetAt).toISOString()}`,
  };
}

/**
 * Clean up expired rate limit entries from memory
 */
function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Persistent rate limiter using Supabase database
 * More reliable for distributed systems but slower
 */
export async function checkRateLimitPersistent(
  supabase: SupabaseClient,
  userId: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - config.windowSeconds * 1000);

  try {
    // Count requests in the current window
    const { count, error: countError } = await supabase
      .from('rate_limit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('operation', config.operation)
      .gte('created_at', windowStart.toISOString());

    if (countError) {
      console.error('Rate limit check error:', countError);
      // Fail open - allow request if we can't check rate limit
      return {
        allowed: true,
        remaining: config.maxRequests,
        resetAt: new Date(now.getTime() + config.windowSeconds * 1000),
      };
    }

    const requestCount = count || 0;
    const allowed = requestCount < config.maxRequests;

    if (allowed) {
      // Log this request
      await supabase.from('rate_limit_logs').insert({
        user_id: userId,
        operation: config.operation,
      });
    }

    const resetAt = new Date(now.getTime() + config.windowSeconds * 1000);

    return {
      allowed,
      remaining: Math.max(0, config.maxRequests - requestCount - 1),
      resetAt,
      error: allowed
        ? undefined
        : `Rate limit exceeded for ${config.operation}. Maximum ${config.maxRequests} requests per ${config.windowSeconds} seconds. Try again after ${resetAt.toISOString()}`,
    };
  } catch (error) {
    console.error('Rate limit error:', error);
    // Fail open - allow request if rate limiting fails
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: new Date(now.getTime() + config.windowSeconds * 1000),
    };
  }
}

/**
 * Extract user identifier from request for rate limiting
 * Tries to get authenticated user ID, falls back to IP address
 */
export function getRateLimitIdentifier(req: Request, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }

  // Fallback to IP address
  const forwardedFor = req.headers.get('x-forwarded-for');
  const ip = forwardedFor?.split(',')[0] || req.headers.get('x-real-ip') || 'unknown';
  return `ip:${ip}`;
}
