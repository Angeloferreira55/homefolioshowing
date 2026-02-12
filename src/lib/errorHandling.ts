/**
 * Centralized error handling utilities
 * Provides consistent, user-friendly error messages across the app
 */

export interface AppError {
  message: string;
  userMessage: string;
  code?: string;
  retryable?: boolean;
}

/**
 * Maps common error scenarios to user-friendly messages
 */
export const ERROR_MESSAGES = {
  // Network errors
  NETWORK_ERROR: 'Unable to connect. Please check your internet connection and try again.',
  TIMEOUT: 'The request took too long. Please try again.',

  // Authentication errors
  UNAUTHORIZED: 'Please sign in to continue.',
  SESSION_EXPIRED: 'Your session has expired. Please sign in again.',

  // Geocoding errors
  GEOCODE_FAILED: 'Unable to find this address. Please check the address and try again.',
  GEOCODE_PARTIAL: 'Some addresses could not be located. Please verify the addresses.',
  GEOCODE_LIMIT: 'Too many addresses at once. Please try with fewer addresses.',

  // Route optimization errors
  ROUTE_NO_PROPERTIES: 'Need at least 2 properties to optimize route.',
  ROUTE_FAILED: 'Unable to optimize route. Please try again or check the addresses.',
  ROUTE_TIMEOUT: 'Route optimization is taking longer than expected. Please try again.',

  // Property errors
  PROPERTY_ADD_FAILED: 'Unable to add property. Please check the details and try again.',
  PROPERTY_DELETE_FAILED: 'Unable to delete property. Please try again.',
  PROPERTY_UPDATE_FAILED: 'Unable to update property. Please try again.',
  PROPERTY_DUPLICATE: 'This property already exists in the session.',

  // Session errors
  SESSION_NOT_FOUND: 'Session not found. It may have been deleted.',
  SESSION_LOAD_FAILED: 'Unable to load session. Please refresh the page.',
  SESSION_UPDATE_FAILED: 'Unable to save changes. Please try again.',
  SESSION_DELETE_FAILED: 'Unable to delete session. Please try again.',

  // Upload errors
  UPLOAD_FAILED: 'Upload failed. Please try again.',
  UPLOAD_TOO_LARGE: 'File is too large. Maximum size is 10MB.',
  UPLOAD_INVALID_TYPE: 'Invalid file type. Please upload an image (JPG, PNG, WebP).',

  // Subscription errors
  SUBSCRIPTION_REQUIRED: 'This feature requires a subscription. Please upgrade your plan.',
  SUBSCRIPTION_LIMIT: 'You\'ve reached your plan limit. Please upgrade or delete some items.',

  // Team errors
  TEAM_CAPACITY: 'Your team is at capacity. Please upgrade your plan to add more members.',
  TEAM_NOT_FOUND: 'Team not found. You must be a team leader to access this feature.',

  // Generic errors
  UNKNOWN_ERROR: 'Something went wrong. Please try again.',
  VALIDATION_ERROR: 'Please check your input and try again.',
} as const;

/**
 * Determines if an error is retryable
 */
export function isRetryable(error: any): boolean {
  if (!error) return false;

  // Network errors are usually retryable
  if (error.message?.includes('fetch') ||
      error.message?.includes('network') ||
      error.message?.includes('timeout')) {
    return true;
  }

  // Certain HTTP status codes are retryable
  const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
  if (error.status && retryableStatusCodes.includes(error.status)) {
    return true;
  }

  return false;
}

/**
 * Extracts a user-friendly error message from various error types
 */
export function getErrorMessage(error: any): string {
  if (!error) return ERROR_MESSAGES.UNKNOWN_ERROR;

  // Check if error has a user-friendly message
  if (error.userMessage) return error.userMessage;

  // Handle Supabase errors
  if (error.message) {
    const msg = error.message.toLowerCase();

    // Network errors
    if (msg.includes('fetch') || msg.includes('network')) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }

    // Auth errors
    if (msg.includes('jwt') || msg.includes('unauthorized') || msg.includes('not authenticated')) {
      return ERROR_MESSAGES.UNAUTHORIZED;
    }

    if (msg.includes('expired')) {
      return ERROR_MESSAGES.SESSION_EXPIRED;
    }

    // Return the original message if it's somewhat user-friendly
    if (error.message.length < 100 && !msg.includes('error:')) {
      return error.message;
    }
  }

  // Handle HTTP status codes
  if (error.status) {
    switch (error.status) {
      case 401:
        return ERROR_MESSAGES.UNAUTHORIZED;
      case 403:
        return 'You don\'t have permission to do this.';
      case 404:
        return 'Not found. This item may have been deleted.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
      case 502:
      case 503:
        return 'Server error. Please try again in a moment.';
      default:
        return ERROR_MESSAGES.UNKNOWN_ERROR;
    }
  }

  return ERROR_MESSAGES.UNKNOWN_ERROR;
}

/**
 * Creates an AppError with consistent structure
 */
export function createAppError(
  message: string,
  userMessage: string,
  code?: string,
  retryable?: boolean
): AppError {
  return {
    message,
    userMessage,
    code,
    retryable: retryable ?? isRetryable({ message }),
  };
}

/**
 * Retry a failed operation with exponential backoff
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    onRetry?: (attempt: number, error: any) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    onRetry,
  } = options;

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Don't retry if it's not a retryable error
      if (!isRetryable(error)) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        initialDelay * Math.pow(2, attempt),
        maxDelay
      );

      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(attempt + 1, error);
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Validates if a string is a valid address
 */
export function validateAddress(address: string): { valid: boolean; message?: string } {
  if (!address || address.trim().length === 0) {
    return { valid: false, message: 'Address is required' };
  }

  if (address.trim().length < 5) {
    return { valid: false, message: 'Address is too short' };
  }

  // Check for at least one number (street number)
  if (!/\d/.test(address)) {
    return { valid: false, message: 'Address should include a street number' };
  }

  return { valid: true };
}

/**
 * Validates property data before adding to session
 */
export function validateProperty(data: {
  address?: string;
  price?: number;
  beds?: number;
  baths?: number;
  sqft?: number;
}): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  // Address validation
  if (!data.address || data.address.trim().length === 0) {
    errors.address = 'Address is required';
  } else {
    const addressValidation = validateAddress(data.address);
    if (!addressValidation.valid) {
      errors.address = addressValidation.message!;
    }
  }

  // Price validation (optional but must be positive if provided)
  if (data.price !== undefined && data.price !== null) {
    if (data.price < 0) {
      errors.price = 'Price must be a positive number';
    }
    if (data.price > 1000000000) {
      errors.price = 'Price seems unrealistic';
    }
  }

  // Beds validation
  if (data.beds !== undefined && data.beds !== null) {
    if (data.beds < 0 || data.beds > 50) {
      errors.beds = 'Bedrooms must be between 0 and 50';
    }
  }

  // Baths validation
  if (data.baths !== undefined && data.baths !== null) {
    if (data.baths < 0 || data.baths > 50) {
      errors.baths = 'Bathrooms must be between 0 and 50';
    }
  }

  // Sqft validation
  if (data.sqft !== undefined && data.sqft !== null) {
    if (data.sqft < 0 || data.sqft > 100000) {
      errors.sqft = 'Square footage must be between 0 and 100,000';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Logs errors to console in development, could be extended to send to error tracking service
 */
export function logError(error: any, context?: Record<string, any>) {
  if (import.meta.env.DEV) {
    console.error('Error:', error, context);
  }

  // In production, you could send to Sentry, LogRocket, etc.
  // Example:
  // if (import.meta.env.PROD) {
  //   Sentry.captureException(error, { extra: context });
  // }
}
