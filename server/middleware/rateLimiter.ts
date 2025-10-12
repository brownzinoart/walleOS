import type { NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import config from '../config/env.js';
import { serverLogger } from './logger.js';

const rateLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  standardHeaders: true,
  legacyHeaders: true,
  message: 'Too many requests, please try again in a few minutes.',
  skip: (req: Request) => req.path === '/api/health',
  handler: (req: Request, res: Response, _next: NextFunction, options) => {
    serverLogger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.originalUrl,
    });

    res.status(options.statusCode).json({
      error: {
        message: 'Too many requests, please try again in a few minutes.',
        code: 'RATE_LIMIT_EXCEEDED',
        requestId: res.locals.requestId,
      },
    });
  },
});

export default rateLimiter;
