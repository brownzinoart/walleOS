import { describe, expect, it, vi } from 'vitest';
import { EventEmitter } from 'node:events';
import type express from 'express';
import app from '../app.js';
import securityHeaders from '../middleware/securityHeaders.js';
import { metricsMiddleware, getMetricsSnapshot } from '../utils/metrics.js';

describe('app hardening', () => {
  it('sets trust proxy for deployment behind reverse proxies', () => {
    expect(app.get('trust proxy')).toBe(1);
  });

  it('applies security headers on responses', () => {
    const setHeader = vi.fn();
    const res = {
      setHeader,
    } as unknown as express.Response;

    securityHeaders({} as express.Request, res, () => {
      /* noop */
    });

    expect(setHeader).toHaveBeenCalledWith('X-DNS-Prefetch-Control', 'off');
    expect(setHeader).toHaveBeenCalledWith('X-Frame-Options', 'SAMEORIGIN');
    expect(setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
  });

  it('records and exposes metrics in Prometheus format', async () => {
    const req = {
      method: 'GET',
      baseUrl: '/api',
      route: { path: '/health/ping' },
      originalUrl: '/api/health/ping',
    } as unknown as express.Request;

    const resEmitter = new EventEmitter() as express.Response & EventEmitter;
    resEmitter.statusCode = 200;

    await new Promise<void>((resolve) => {
      metricsMiddleware(req, resEmitter, () => resolve());
    });

    resEmitter.emit('finish');

    const snapshot = getMetricsSnapshot();
    expect(snapshot).toMatch(/# HELP http_requests_total/);
    expect(snapshot).toMatch(/http_requests_total\{method="GET",status="200",path="\/api\/health\/ping"}/);
  });
});
