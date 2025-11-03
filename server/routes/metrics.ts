import { Router } from 'express';
import type express from 'express';
import { getMetricsSnapshot } from '../utils/metrics.js';

const router = Router();

router.get('/', (_req: express.Request, res: express.Response) => {
  res.setHeader('Content-Type', 'text/plain; version=0.0.4');
  res.send(getMetricsSnapshot());
});

export default router;
