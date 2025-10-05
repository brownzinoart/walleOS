/**
 * Comprehensive logging and error handling system for A+ code quality
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

export interface LogContext {
  component?: string;
  action?: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, unknown> | undefined;
  error?: Error | undefined;
  stack?: string | undefined;
  timestamp?: number;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  timestamp: number;
}

class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private observers: Array<(entry: LogEntry) => void> = [];
  private maxLogsSize = 5000;
  private currentLevel: LogLevel = LogLevel.INFO;

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setLevel(level: LogLevel): void {
    this.currentLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.currentLevel;
  }

  private createLogEntry(level: LogLevel, message: string, context?: LogContext): LogEntry {
    return {
      level,
      message,
      context: {
        ...context,
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
    };
  }

  private processLog(entry: LogEntry): void {
    this.logs.push(entry);

    // Keep only the latest logs to prevent memory leaks
    if (this.logs.length > this.maxLogsSize) {
      this.logs = this.logs.slice(-this.maxLogsSize);
    }

    // Notify observers
    this.observers.forEach(observer => observer(entry));
  }

  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;

    const entry = this.createLogEntry(LogLevel.DEBUG, message, context);
    this.processLog(entry);

    if (typeof console !== 'undefined') {
      console.debug(`🐛 [DEBUG] ${message}`, context);
    }
  }

  info(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.INFO)) return;

    const entry = this.createLogEntry(LogLevel.INFO, message, context);
    this.processLog(entry);

    if (typeof console !== 'undefined') {
      console.info(`ℹ️ [INFO] ${message}`, context);
    }
  }

  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.WARN)) return;

    const entry = this.createLogEntry(LogLevel.WARN, message, context);
    this.processLog(entry);

    if (typeof console !== 'undefined') {
      console.warn(`⚠️ [WARN] ${message}`, context);
    }
  }

  error(message: string, error?: Error, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;

    const errorContext = {
      ...context,
      error,
      stack: error?.stack,
    };

    const entry = this.createLogEntry(LogLevel.ERROR, message, errorContext);
    this.processLog(entry);

    if (typeof console !== 'undefined') {
      console.error(`❌ [ERROR] ${message}`, error, context);
    }
  }

  fatal(message: string, error?: Error, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.FATAL)) return;

    const errorContext = {
      ...context,
      error,
      stack: error?.stack,
    };

    const entry = this.createLogEntry(LogLevel.FATAL, message, errorContext);
    this.processLog(entry);

    if (typeof console !== 'undefined') {
      console.error(`💀 [FATAL] ${message}`, error, context);
    }

    // In production, you might want to send this to an error reporting service
    this.reportFatalError(entry);
  }

  private reportFatalError(entry: LogEntry): void {
    // This would integrate with error reporting services like Sentry
    if (typeof window !== 'undefined') {
      type SentryGlobal = {
        captureException: (error: unknown, context?: { level?: string; extra?: unknown }) => void;
      };

      const sentryWindow = window as Window & { Sentry?: SentryGlobal };
      const sentry = sentryWindow.Sentry;

      if (sentry) {
        sentry.captureException(entry.context?.error || new Error(entry.message), {
          level: 'fatal',
          extra: entry.context,
        });
      }
    }
  }

  subscribe(observer: (entry: LogEntry) => void): () => void {
    this.observers.push(observer);
    return () => {
      const index = this.observers.indexOf(observer);
      if (index > -1) {
        this.observers.splice(index, 1);
      }
    };
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  clearLogs(): void {
    this.logs = [];
  }
}

export const logger = Logger.getInstance();

// Error boundary and recovery utilities
export class ErrorBoundary {
  private errorHandlers: Array<(error: Error, context?: LogContext) => void> = [];
  private recoveryStrategies: Map<string, () => void> = new Map();

  registerErrorHandler(handler: (error: Error, context?: LogContext) => void): () => void {
    this.errorHandlers.push(handler);
    return () => {
      const index = this.errorHandlers.indexOf(handler);
      if (index > -1) {
        this.errorHandlers.splice(index, 1);
      }
    };
  }

  registerRecoveryStrategy(key: string, strategy: () => void): void {
    this.recoveryStrategies.set(key, strategy);
  }

  async executeWithErrorBoundary<T>(
    operation: () => Promise<T> | T,
    context?: LogContext,
    fallback?: () => T
  ): Promise<T> {
    try {
      const result = await operation();
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Operation failed in error boundary', err, context);

      // Notify error handlers
      this.errorHandlers.forEach(handler => {
        try {
          handler(err, context);
        } catch (handlerError) {
          logger.error('Error handler failed', handlerError as Error);
        }
      });

      // Try recovery if available
      if (context?.action && this.recoveryStrategies.has(context.action)) {
        try {
          this.recoveryStrategies.get(context.action)!();
          logger.info(`Recovered from error in ${context.action}`);
        } catch (recoveryError) {
          logger.error('Recovery strategy failed', recoveryError as Error);
        }
      }

      // Return fallback value or rethrow
      if (fallback) {
        return fallback();
      }

      throw err;
    }
  }
}

export const errorBoundary = new ErrorBoundary();

// Utility functions for common error scenarios
export const withErrorHandling = <T extends unknown[], R>(
  fn: (...args: T) => R | Promise<R>,
  context?: LogContext
) => {
  return async (...args: T): Promise<R> => {
    return errorBoundary.executeWithErrorBoundary(
      () => Promise.resolve(fn(...args)),
      context
    );
  };
};

// Input validation and sanitization utilities
export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public value?: unknown,
    public rule?: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const createValidator = <T extends Record<string, unknown>>(schema: {
  [K in keyof T]?: (value: T[K]) => boolean | string;
}) => {
  return (data: unknown): T => {
    if (!data || typeof data !== 'object') {
      throw new ValidationError('Invalid data: must be an object');
    }

    const result: Partial<T> = {};
    const obj = data as Record<string, unknown>;

    for (const [key, validator] of Object.entries(schema) as [keyof T, (value: T[keyof T]) => boolean | string][]) {
      const typedKey = key;
      const value = obj[String(typedKey)] as T[keyof T];

      if (validator) {
        const validationResult = validator(value);
        if (validationResult !== true) {
          throw new ValidationError(
            typeof validationResult === 'string' ? validationResult : `Invalid value for ${String(key)}`,
            String(key),
            value,
            typeof validationResult === 'string' ? validationResult : 'custom'
          );
        }
      }

      result[typedKey] = value;
    }

    return result as T;
  };
};

// Common validators
export const validators = {
  required: (value: unknown): boolean | string => {
    return value != null && value !== '' || 'This field is required';
  },

  minLength: (min: number) => (value: string): boolean | string => {
    return (typeof value === 'string' && value.length >= min) ||
           `Must be at least ${min} characters`;
  },

  maxLength: (max: number) => (value: string): boolean | string => {
    return (typeof value === 'string' && value.length <= max) ||
           `Must be no more than ${max} characters`;
  },

  email: (value: string): boolean | string => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) || 'Must be a valid email address';
  },

  url: (value: string): boolean | string => {
    try {
      new URL(value);
      return true;
    } catch {
      return 'Must be a valid URL';
    }
  },

  alphanumeric: (value: string): boolean | string => {
    return /^[a-zA-Z0-9]+$/.test(value) || 'Must contain only letters and numbers';
  },
};
