import type express from 'express';
import rateLimit from 'express-rate-limit';
import type { Options as RateLimitOptions } from 'express-rate-limit';
import config from '../config/env.js';
import { serverLogger } from './logger.js';

const rateLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  standardHeaders: true,
  legacyHeaders: true,
  message: 'Too many requests, please try again in a few minutes.',
  skip: (req: express.Request) => req.path === '/api/health',
  handler: (req: express.Request, res: express.Response, _next: express.NextFunction, options: RateLimitOptions) => {
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
