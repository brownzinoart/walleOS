import { Router } from 'express';
import { checkOllamaHealth } from '../services/ollama.js';
import config from '../config/env.js';
import type { HealthCheckResponse } from '../types/index.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const ollamaStatus = await checkOllamaHealth();

    const response: HealthCheckResponse = {
      status: ollamaStatus.healthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        ollama: {
          status: ollamaStatus.healthy ? 'up' : 'down',
          model: config.ollamaModel,
        },
      },
      requestId: res.locals.requestId,
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
});

export default router;
