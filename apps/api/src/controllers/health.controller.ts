import { APP_NAME, API_VERSION } from '@maison-elise/shared';
import type { Request, Response } from 'express';

import { healthService } from '../services/health.service.js';
import { logger, serializeError } from '../utils/logger.js';

/**
 * Liveness: the process is up and able to serve requests. Deliberately does not
 * touch the database so an unhealthy dependency does not restart a healthy app.
 */
export function getHealth(_req: Request, res: Response): void {
  res.status(200).json({
    status: 'ok',
    name: APP_NAME,
    version: API_VERSION,
  });
}

/**
 * Readiness: verifies required dependencies. Uses a trivial query so it stays
 * cheap and safe to poll. Never exposes connection details.
 */
export async function getReadiness(_req: Request, res: Response): Promise<void> {
  try {
    await healthService.checkDatabase();
    res.status(200).json({ status: 'ok', database: 'up' });
  } catch (error) {
    logger.error('readiness check failed', serializeError(error));
    res.status(503).json({ status: 'unavailable', database: 'down' });
  }
}
