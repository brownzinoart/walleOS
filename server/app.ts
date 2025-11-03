import express from 'express';
import corsMiddleware from './middleware/cors.js';
import { requestLogger } from './middleware/logger.js';
import rateLimiter from './middleware/rateLimiter.js';
import routes from './routes/index.js';
import errorHandler from './middleware/errorHandler.js';
import securityHeaders from './middleware/securityHeaders.js';
import { metricsMiddleware } from './utils/metrics.js';
import metricsRouter from './routes/metrics.js';

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(corsMiddleware);
app.use(securityHeaders);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);
app.use(metricsMiddleware);
app.use(rateLimiter);

app.use('/api/metrics', metricsRouter);
app.use('/api', routes);

app.use(errorHandler);

export default app;
