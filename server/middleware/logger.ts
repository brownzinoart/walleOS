import type { NextFunction, Request, Response } from 'express';
import { performance } from 'node:perf_hooks';
import { randomUUID } from 'node:crypto';
import config from '../config/env.js';

export enum ServerLogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

type LogPayload = Record<string, unknown>;

class ServerLogger {
  private currentLevel: ServerLogLevel;

  constructor(level: ServerLogLevel) {
    this.currentLevel = level;
  }

  setLevel(level: ServerLogLevel): void {
    this.currentLevel = level;
  }

  debug(message: string, context?: LogPayload): void {
    this.log(ServerLogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogPayload): void {
    this.log(ServerLogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogPayload): void {
    this.log(ServerLogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: LogPayload): void {
    const payload = {
      ...context,
      error: error?.message,
      stack: error?.stack,
    };
    this.log(ServerLogLevel.ERROR, message, payload);
  }

  private log(level: ServerLogLevel, message: string, context?: LogPayload): void {
    if (level < this.currentLevel) return;

    const timestamp = new Date().toISOString();
    const base = `[${timestamp}] [${ServerLogLevel[level]}] ${message}`;

    const logFn =
      level === ServerLogLevel.ERROR
        ? console.error
        : level === ServerLogLevel.WARN
        ? console.warn
        : level === ServerLogLevel.DEBUG
        ? console.debug
        : console.info;

    if (context) {
      logFn(base, context);
    } else {
      logFn(base);
    }
  }
}

const levelFromEnv = (() => {
  switch (config.logLevel) {
    case 'debug':
      return ServerLogLevel.DEBUG;
    case 'warn':
      return ServerLogLevel.WARN;
    case 'error':
      return ServerLogLevel.ERROR;
    case 'info':
    default:
      return ServerLogLevel.INFO;
  }
})();

export const serverLogger = new ServerLogger(levelFromEnv);

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = performance.now();
  const requestId = randomUUID();
  res.locals.requestId = requestId;

  serverLogger.info('Incoming request', {
    requestId,
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('user-agent'),
  });

  res.on('finish', () => {
    const durationMs = performance.now() - start;
    serverLogger.info('Request completed', {
      requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
    });
  });

  next();
};
