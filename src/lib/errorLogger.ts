/**
 * Centralized error logging with structured context.
 * Captures errors for debugging and optional external reporting.
 */

type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

interface LoggedError {
  message: string;
  severity: ErrorSeverity;
  context: ErrorContext;
  timestamp: string;
  stack?: string;
  originalError?: unknown;
}

class ErrorLogger {
  private static instance: ErrorLogger;
  private errors: LoggedError[] = [];
  private maxStoredErrors = 50;

  private constructor() {}

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  /**
   * Log an error with context
   */
  log(
    error: Error | string,
    severity: ErrorSeverity = 'medium',
    context: ErrorContext = {}
  ): void {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    
    const loggedError: LoggedError = {
      message: errorObj.message,
      severity,
      context,
      timestamp: new Date().toISOString(),
      stack: errorObj.stack,
      originalError: error,
    };

    // Always log to console in development
    this.logToConsole(loggedError);

    // Store for potential reporting
    this.errors.push(loggedError);
    if (this.errors.length > this.maxStoredErrors) {
      this.errors.shift();
    }
  }

  /**
   * Log network-specific errors with retry context
   */
  logNetworkError(
    error: Error | string,
    options: {
      url?: string;
      method?: string;
      attempt?: number;
      maxAttempts?: number;
      willRetry?: boolean;
    } & ErrorContext
  ): void {
    const { url, method, attempt, maxAttempts, willRetry, ...context } = options;
    
    this.log(error, willRetry ? 'low' : 'medium', {
      ...context,
      metadata: {
        ...context.metadata,
        url,
        method,
        attempt,
        maxAttempts,
        willRetry,
        type: 'network',
      },
    });
  }

  /**
   * Log authentication errors
   */
  logAuthError(error: Error | string, context: ErrorContext = {}): void {
    this.log(error, 'high', {
      ...context,
      metadata: {
        ...context.metadata,
        type: 'auth',
      },
    });
  }

  /**
   * Log database/storage errors
   */
  logDatabaseError(
    error: Error | string,
    operation: string,
    context: ErrorContext = {}
  ): void {
    this.log(error, 'high', {
      ...context,
      action: operation,
      metadata: {
        ...context.metadata,
        type: 'database',
      },
    });
  }

  /**
   * Get recent errors for debugging
   */
  getRecentErrors(count = 10): LoggedError[] {
    return this.errors.slice(-count);
  }

  /**
   * Clear stored errors
   */
  clearErrors(): void {
    this.errors = [];
  }

  private logToConsole(error: LoggedError): void {
    const prefix = `[${error.severity.toUpperCase()}]`;
    const contextStr = error.context.component 
      ? `[${error.context.component}]` 
      : '';
    const actionStr = error.context.action 
      ? `(${error.context.action})` 
      : '';

    console.error(
      `${prefix}${contextStr}${actionStr} ${error.message}`,
      error.context.metadata || {}
    );

    if (error.stack && error.severity !== 'low') {
      console.debug('Stack trace:', error.stack);
    }
  }
}

export const errorLogger = ErrorLogger.getInstance();

// Convenience functions
export const logError = errorLogger.log.bind(errorLogger);
export const logNetworkError = errorLogger.logNetworkError.bind(errorLogger);
export const logAuthError = errorLogger.logAuthError.bind(errorLogger);
export const logDatabaseError = errorLogger.logDatabaseError.bind(errorLogger);
