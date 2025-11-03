import { describe, expect, it, beforeEach } from 'vitest';
import { EventEmitter } from 'node:events';
import type express from 'express';

import { metricsMiddleware, getMetricsSnapshot, resetMetrics, recordHttpRequest } from '../utils/metrics.js';

describe('metrics utilities', () => {
  beforeEach(() => {
    resetMetrics();
  });

  it('records manual counter increments', () => {
    recordHttpRequest({ method: 'GET', path: '/api/test', status: 200 });
    const snapshot = getMetricsSnapshot();
    expect(snapshot).toMatch(/http_requests_total\{method="GET",status="200",path="\/api\/test"} 1/);
  });

  it('uses originalUrl when route path is unavailable and captures duration samples', async () => {
    const req = {
      method: 'POST',
      originalUrl: '/api/fallback?query=1',
    } as unknown as express.Request;

    const res = new EventEmitter() as express.Response & EventEmitter;
    res.statusCode = 502;

    await new Promise<void>((resolve) => metricsMiddleware(req, res, resolve));
    res.emit('finish');

    const snapshot = getMetricsSnapshot();
    expect(snapshot).toMatch(/http_requests_total\{method="POST",status="502",path="\/api\/fallback"} 1/);
    expect(snapshot).toMatch(/http_request_duration_milliseconds\{method="POST",status="502",path="\/api\/fallback"}/);
  });
});
