import Stripe from 'stripe';

import { env } from './env.js';
import { AppError } from '../utils/errors.js';

let client: Stripe | null = null;

export function isStripeConfigured(): boolean {
  return Boolean(env.stripeSecretKey);
}

export function getStripe(): Stripe {
  if (!env.stripeSecretKey) {
    throw new AppError(503, 'PAYMENTS_NOT_CONFIGURED', 'Payments are not configured.');
  }

  client ??= new Stripe(env.stripeSecretKey);

  return client;
}

export function getStripeWebhookSecret(): string {
  if (!env.stripeWebhookSecret) {
    throw new AppError(503, 'PAYMENTS_NOT_CONFIGURED', 'Payments are not configured.');
  }

  return env.stripeWebhookSecret;
}
