import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { API_PREFIX } from '@maison-elise/shared';
import cookieParser from 'cookie-parser';
import cors, { type CorsOptions } from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';

import { env } from './config/env.js';
import { csrfProtection } from './middleware/csrfProtection.js';
import { errorHandler } from './middleware/error.middleware.js';
import { notFoundHandler } from './middleware/not-found.middleware.js';
import { requestContext } from './middleware/requestContext.js';
import { requestLogger } from './middleware/requestLogger.js';
import { apiRouter } from './routes/index.js';
import { webhookRouter } from './routes/webhook.routes.js';
import { configuredOrigins } from './utils/origins.js';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const publicDirectory = path.resolve(currentDirectory, '..', 'public');

function corsOptions(): CorsOptions {
  const origins = configuredOrigins();

  return {
    origin(origin, callback) {
      // Allow same-origin/non-browser requests (no Origin header) and any
      // explicitly configured storefront/admin origin. Anything else gets no
      // CORS headers, so browsers block the response.
      callback(null, !origin || origins.includes(origin));
    },
    credentials: true,
  };
}

export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', env.trustProxy);

  // Correlation id first so every response and log line can be traced.
  app.use(requestContext);

  app.use(
    helmet({
      // The API serves JSON and static images only (no HTML documents), so CSP
      // is applied by the frontend hosts rather than here.
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      referrerPolicy: { policy: 'no-referrer' },
      // HSTS only in production (HTTPS); never over local HTTP.
      hsts: env.isProduction
        ? { maxAge: 15552000, includeSubDomains: true, preload: false }
        : false,
    }),
  );
  app.use(cors(corsOptions()));

  // Stripe webhooks must receive the raw request body for signature verification,
  // so they are mounted before the JSON body parser.
  app.use(`${API_PREFIX}/webhooks`, webhookRouter);

  app.use(express.json({ limit: env.jsonBodyLimit }));
  app.use(express.urlencoded({ extended: false, limit: '100kb' }));
  app.use(cookieParser());
  app.use(requestLogger);

  // Origin/Referer validation for cookie-authenticated state-changing requests.
  app.use(csrfProtection);

  app.use('/static', express.static(publicDirectory, { maxAge: '1h' }));

  app.use(API_PREFIX, apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
