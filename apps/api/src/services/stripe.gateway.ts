import type Stripe from 'stripe';

import { getStripe } from '../config/stripe.js';

export interface StripePaymentIntent {
  id: string;
  clientSecret: string | null;
  status: string;
}

export interface CreatePaymentIntentParams {
  amount: number;
  currency: string;
  metadata: Record<string, string>;
}

/**
 * Thin abstraction over the Stripe SDK so services depend on an interface that
 * can be substituted in tests without network access.
 */
export interface StripeGateway {
  createPaymentIntent(
    params: CreatePaymentIntentParams,
    idempotencyKey: string,
  ): Promise<StripePaymentIntent>;
  retrievePaymentIntent(id: string): Promise<StripePaymentIntent>;
  constructEvent(payload: Buffer, signature: string, secret: string): Stripe.Event;
}

function toPaymentIntent(intent: Stripe.PaymentIntent): StripePaymentIntent {
  return { id: intent.id, clientSecret: intent.client_secret, status: intent.status };
}

export const stripeGateway: StripeGateway = {
  async createPaymentIntent(params, idempotencyKey) {
    const intent = await getStripe().paymentIntents.create(
      {
        amount: params.amount,
        currency: params.currency,
        metadata: params.metadata,
        automatic_payment_methods: { enabled: true },
      },
      { idempotencyKey },
    );

    return toPaymentIntent(intent);
  },

  async retrievePaymentIntent(id) {
    return toPaymentIntent(await getStripe().paymentIntents.retrieve(id));
  },

  constructEvent(payload, signature, secret) {
    return getStripe().webhooks.constructEvent(payload, signature, secret);
  },
};
