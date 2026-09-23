import express, { Router } from 'express';

import { paymentController } from '../controllers/payment.controller.js';
import { webhookRateLimiter } from '../middleware/rateLimit.js';

export const webhookRouter = Router();

// express.raw preserves the raw request body required for Stripe signature verification.
webhookRouter.post(
  '/stripe',
  webhookRateLimiter,
  express.raw({ type: 'application/json' }),
  paymentController.stripeWebhook,
);
