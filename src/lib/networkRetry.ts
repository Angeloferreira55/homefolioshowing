/**
 * Network retry utilities with exponential backoff.
 * Provides consistent retry behavior across the application.
 */

import { logNetworkError } from './errorLogger';

export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  timeoutMs?: number;
  shouldRetry?: (error: Error, attempt: number) => boolean;
  onRetry?: (error: Error, attempt: number) => void;
  context?: {
    component?: string;
    action?: string;
  };
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry' | 'context' | 'shouldRetry'>> = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  timeoutMs: 30000,
};

/**
 * Check if an error is retryable
 */
export const isRetryableError = (error: Error): boolean => {
  const message = error.message.toLowerCase();
  
  // Network errors
  if (message.includes('network') || message.includes('fetch')) return true;
  if (message.includes('timeout') || message.includes('timed out')) return true;
  if (message.includes('failed to fetch')) return true;
  if (message.includes('load failed')) return true;
  
  // Server errors (5xx)
  if (message.includes('500') || message.includes('502') || 
      message.includes('503') || message.includes('504')) return true;
  
  // Rate limiting
  if (message.includes('429') || message.includes('too many requests')) return true;
  
  // Don't retry auth errors or client errors
  if (message.includes('401') || message.includes('403')) return false;
  if (message.includes('404') || message.includes('400')) return false;
  if (message.includes('sign in') || message.includes('authenticated')) return false;
  
  return false;
};

/**
 * Calculate delay with exponential backoff and jitter
 */
export const calculateBackoff = (
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number
): number => {
  // Exponential backoff: base * 2^attempt
  const exponentialDelay = baseDelayMs * Math.pow(2, attempt);
  // Add jitter (±25%)
  const jitter = exponentialDelay * 0.25 * (Math.random() * 2 - 1);
  const delay = exponentialDelay + jitter;
  // Cap at max delay
  return Math.min(delay, maxDelayMs);
};

/**
 * Sleep for a specified duration
 */
export const sleep = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Wrap a promise with a timeout
 */
export const withTimeout = <T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage = 'Operation timed out'
): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);

    promise
      .then(result => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch(error => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
};

/**
 * Execute an async function with retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = DEFAULT_OPTIONS.maxAttempts,
    baseDelayMs = DEFAULT_OPTIONS.baseDelayMs,
    maxDelayMs = DEFAULT_OPTIONS.maxDelayMs,
    timeoutMs = DEFAULT_OPTIONS.timeoutMs,
    shouldRetry = isRetryableError,
    onRetry,
    context,
  } = options;

  let lastError: Error = new Error('Unknown error');

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      // Wrap with timeout
      const result = await withTimeout(fn(), timeoutMs, 'Request timed out');
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      const isLastAttempt = attempt === maxAttempts - 1;
      const willRetry = !isLastAttempt && shouldRetry(lastError, attempt);

      // Log the error
      logNetworkError(lastError, {
        attempt: attempt + 1,
        maxAttempts,
        willRetry,
        component: context?.component,
        action: context?.action,
      });

      if (!willRetry) {
        throw lastError;
      }

      // Call retry callback
      onRetry?.(lastError, attempt + 1);

      // Wait before retry
      const delay = calculateBackoff(attempt, baseDelayMs, maxDelayMs);
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Create a retryable fetch wrapper
 */
export function createRetryableFetch(defaultOptions: RetryOptions = {}) {
  return async function retryableFetch(
    input: RequestInfo | URL,
    init?: RequestInit,
    options?: RetryOptions
  ): Promise<Response> {
    const mergedOptions = { ...defaultOptions, ...options };
    
    return withRetry(async () => {
      const response = await fetch(input, init);
      
      // Throw on server errors to trigger retry
      if (response.status >= 500) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      return response;
    }, mergedOptions);
  };
}

/**
 * Supabase-specific retry wrapper
 */
export async function withSupabaseRetry<T>(
  operation: () => Promise<{ data: T | null; error: Error | null }>,
  options: RetryOptions = {}
): Promise<{ data: T; error: null } | { data: null; error: Error }> {
  try {
    const result = await withRetry(async () => {
      const { data, error } = await operation();
      if (error) {
        throw error;
      }
      return data;
    }, options);
    
    return { data: result as T, error: null };
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error(String(error)) 
    };
  }
}
