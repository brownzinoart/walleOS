import cors, { type CorsOptions } from 'cors';
import config from '../config/env.js';

const allowedOrigins = new Set([config.frontendUrl, 'http://127.0.0.1:3000', 'http://localhost:3000']);

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    // Allow if in whitelist
    if (allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }

    // Allow any localhost/127.0.0.1 origin for development
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      callback(null, true);
      return;
    }

    // Allow local network IPs for development (e.g., http://192.168.x.x:3000)
    if (/^http:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+):\d+$/.test(origin)) {
      callback(null, true);
      return;
    }

    console.error(`[CORS] Blocked origin: "${origin}". Allowed origins:`, Array.from(allowedOrigins));
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

const corsMiddleware = cors(corsOptions);

export default corsMiddleware;
