import http from 'node:http';
import app from './app.js';
import config from './config/env.js';
import { serverLogger } from './middleware/logger.js';

const port = config.serverPort;

const server = http.createServer(app);

server.listen(port, () => {
  serverLogger.info(`Backend server listening on port ${port}`);
});

server.on('error', error => {
  serverLogger.error('Uncaught server error', error instanceof Error ? error : new Error(String(error)));
});

const shutdown = (signal: NodeJS.Signals) => {
  serverLogger.info(`Received ${signal}, shutting down gracefully`);
  server.close(err => {
    if (err) {
      serverLogger.error('Error during graceful shutdown', err instanceof Error ? err : new Error(String(err)));
      process.exit(1);
    }

    serverLogger.info('HTTP server closed');
    process.exit(0);
  });

  setTimeout(() => {
    serverLogger.warn('Forcing shutdown after timeout');
    process.exit(1);
  }, 10_000).unref();
};

['SIGINT', 'SIGTERM'].forEach(signal => {
  process.on(signal as NodeJS.Signals, () => shutdown(signal as NodeJS.Signals));
});
