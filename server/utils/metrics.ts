import type express from 'express';

interface MetricLabels {
  method: string;
  path: string;
  status: number;
}

const counter: Map<string, number> = new Map();
const histogram: Array<{ method: string; path: string; status: number; durationMs: number }> = [];

export const resetMetrics = (): void => {
  counter.clear();
  histogram.length = 0;
};

const makeKey = ({ method, path, status }: MetricLabels): string => {
  return `${method}|${path}|${status}`;
};

export const recordHttpRequest = (labels: MetricLabels): void => {
  const key = makeKey(labels);
  const current = counter.get(key) ?? 0;
  counter.set(key, current + 1);
};

export const metricsMiddleware: express.RequestHandler = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const routePath = resolveRoutePath(req);
    recordHttpRequest({
      method: req.method,
      path: routePath,
      status: res.statusCode,
    });
    const duration = Date.now() - start;
    recordHistogramSample(routePath, req.method, res.statusCode, duration);
  });

  next();
};

const recordHistogramSample = (path: string, method: string, status: number, durationMs: number) => {
  histogram.push({ method, path, status, durationMs });
  if (histogram.length > 1000) {
    histogram.splice(0, histogram.length - 1000);
  }
};

export const getMetricsSnapshot = (): string => {
  let output = '# HELP http_requests_total Total HTTP requests.\n';
  output += '# TYPE http_requests_total counter\n';

  for (const [key, value] of counter.entries()) {
    const [method, path, status] = key.split('|');
    output += `http_requests_total{method="${method}",status="${status}",path="${path}"} ${value}\n`;
  }

  output += '\n# HELP http_request_duration_milliseconds HTTP request durations in milliseconds.\n';
  output += '# TYPE http_request_duration_milliseconds summary\n';

  for (const sample of histogram) {
    output += `http_request_duration_milliseconds{method="${sample.method}",status="${sample.status}",path="${sample.path}"} ${sample.durationMs}\n`;
  }

  return output;
};

const resolveRoutePath = (req: express.Request): string => {
  if (req.route?.path) {
    const base = req.baseUrl || '';
    const path = typeof req.route.path === 'string' ? req.route.path : req.route.path.toString();
    return `${base}${path}`;
  }

  const original = req.originalUrl || req.url;
  return (original || '/unknown').split('?')[0] ?? '/unknown';
};
