import { createApp } from './app.js';
import { env } from './config/env.js';
import { disconnectPrisma } from './config/prisma.js';
import { logger, serializeError } from './utils/logger.js';

const SHUTDOWN_TIMEOUT_MS = 10_000;

const app = createApp();

const server = app.listen(env.port, () => {
  logger.info('api listening', { port: env.port, env: env.nodeEnv });

  for (const warning of env.configWarnings) {
    logger.warn('configuration warning', { message: warning });
  }
});

let isShuttingDown = false;

function closeServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

async function shutdown(signal: string, exitCode = 0): Promise<void> {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  logger.info('shutting down', { signal });

  // Never hang indefinitely: force-exit if in-flight work does not drain in time.
  const forceExit = setTimeout(() => {
    logger.error('forced shutdown after timeout', { timeoutMs: SHUTDOWN_TIMEOUT_MS });
    process.exit(exitCode === 0 ? 1 : exitCode);
  }, SHUTDOWN_TIMEOUT_MS);
  forceExit.unref();

  try {
    // Stop accepting new connections and drop keep-alive sockets that are idle.
    server.closeIdleConnections?.();
    await closeServer();
    await disconnectPrisma();
    clearTimeout(forceExit);
    logger.info('shutdown complete');
    process.exit(exitCode);
  } catch (error) {
    logger.error('error during shutdown', serializeError(error));
    clearTimeout(forceExit);
    process.exit(1);
  }
}

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});

process.on('uncaughtException', (error) => {
  logger.error('uncaught exception', serializeError(error));
  void shutdown('uncaughtException', 1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('unhandled rejection', serializeError(reason));
  void shutdown('unhandledRejection', 1);
});
