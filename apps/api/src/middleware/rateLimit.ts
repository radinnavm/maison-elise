import type { Request, RequestHandler, Response } from 'express';
import { rateLimit } from 'express-rate-limit';

import { env } from '../config/env.js';

function tooManyRequests(_req: Request, res: Response): void {
  res.status(429).json({
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests. Please try again later.',
    },
  });
}

function createRateLimiter(max: number, windowMs: number): RequestHandler {
  return rateLimit({
    windowMs,
    limit: max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    // Rate limiting is disabled for the automated test environment unless
    // explicitly enabled, so test runs stay deterministic.
    skip: () => !env.rateLimitEnabled,
    handler: tooManyRequests,
  });
}

/** Credential endpoints (login/register) — brute-force protection. */
export const authRateLimiter = createRateLimiter(
  env.rateLimits.authMax,
  env.rateLimits.authWindowMs,
);

/** Payment intent creation — expensive, third-party-backed. */
export const paymentRateLimiter = createRateLimiter(
  env.rateLimits.paymentMax,
  env.rateLimits.paymentWindowMs,
);

/** Stripe webhook receiver. */
export const webhookRateLimiter = createRateLimiter(
  env.rateLimits.webhookMax,
  env.rateLimits.webhookWindowMs,
);

/** Authenticated admin API. */
export const adminRateLimiter = createRateLimiter(
  env.rateLimits.adminMax,
  env.rateLimits.adminWindowMs,
);
