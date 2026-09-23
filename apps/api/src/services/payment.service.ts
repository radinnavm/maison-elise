import type { OrderStatus, PaymentStatus } from '@prisma/client';
import type Stripe from 'stripe';

import { paymentRepository, type OrderPaymentRecord } from '../repositories/payment.repository.js';
import { ConflictError, NotFoundError } from '../utils/errors.js';
import { toMinorUnits } from '../utils/money.js';
import { stripeGateway, type StripePaymentIntent } from './stripe.gateway.js';
import { notificationService } from './notification.service.js';

export interface PaymentIntentResult {
  clientSecret: string | null;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
}

function buildMetadata(order: OrderPaymentRecord): Record<string, string> {
  return {
    orderId: order.id,
    orderReference: `ME-${order.sequence}`,
    userId: order.userId,
  };
}

function extractPaymentIntent(event: Stripe.Event): Stripe.PaymentIntent | null {
  const object = event.data.object as Partial<Stripe.PaymentIntent>;

  if (typeof object.id !== 'string' || !object.id.startsWith('pi_')) {
    return null;
  }

  return object as Stripe.PaymentIntent;
}

export const paymentService = {
  async createPaymentIntent(userId: string, orderId: string): Promise<PaymentIntentResult> {
    const order = await paymentRepository.findOrderForUser(orderId, userId);

    if (!order) {
      throw new NotFoundError('Order not found.', 'ORDER_NOT_FOUND');
    }

    if (order.status === 'CANCELLED') {
      throw new ConflictError('This order has been cancelled.', 'ORDER_CANCELLED');
    }

    if (order.paymentStatus === 'PAID') {
      throw new ConflictError('This order has already been paid.', 'PAYMENT_ALREADY_PAID');
    }

    const amount = toMinorUnits(Number(order.total));
    const currency = order.currency.toLowerCase();

    let intent: StripePaymentIntent;

    if (order.stripePaymentIntentId) {
      const existing = await stripeGateway.retrievePaymentIntent(order.stripePaymentIntentId);

      if (existing.status === 'succeeded') {
        // The webhook is the source of truth; report the expected terminal state.
        return { clientSecret: null, paymentStatus: 'PAID', orderStatus: 'CONFIRMED' };
      }

      if (existing.status === 'canceled') {
        // A cancelled intent cannot be reused — create a replacement with a key
        // chained to the previous intent so retries stay idempotent.
        intent = await stripeGateway.createPaymentIntent(
          { amount, currency, metadata: buildMetadata(order) },
          `order:${order.id}:payment-intent:${existing.id}`,
        );
      } else {
        intent = existing;
      }
    } else {
      intent = await stripeGateway.createPaymentIntent(
        { amount, currency, metadata: buildMetadata(order) },
        `order:${order.id}:payment-intent`,
      );
    }

    if (order.stripePaymentIntentId !== intent.id || order.paymentStatus !== 'PROCESSING') {
      await paymentRepository.setPaymentIntent(order.id, intent.id, 'PROCESSING');
    }

    return {
      clientSecret: intent.clientSecret,
      paymentStatus: 'PROCESSING',
      orderStatus: order.status,
    };
  },

  async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    const paymentIntent = extractPaymentIntent(event);

    if (!paymentIntent) {
      return;
    }

    const outcome = await paymentRepository.transaction(async (tx) => {
      // Claim the event first; if it was already processed, stop (idempotent).
      const claimed = await tx.claimEvent(event.id, event.type);

      if (!claimed) {
        return null;
      }

      // Resolve the order strictly by the PaymentIntent stored on the order,
      // so a mismatched or unknown intent is a safe no-op.
      const order = await tx.findOrderByPaymentIntentId(paymentIntent.id);

      if (!order) {
        return null;
      }

      switch (event.type) {
        case 'payment_intent.succeeded':
          await tx.updateOrderPayment(order.id, { paymentStatus: 'PAID', status: 'CONFIRMED' });
          return { orderId: order.id, kind: 'success' as const };
        case 'payment_intent.payment_failed':
          await tx.updateOrderPayment(order.id, { paymentStatus: 'FAILED' });
          return { orderId: order.id, kind: 'failed' as const };
        case 'payment_intent.canceled':
          await tx.updateOrderPayment(order.id, { paymentStatus: 'CANCELLED' });
          return null;
        default:
          return null;
      }
    });

    // Notifications run after the transaction commits and never throw.
    if (outcome?.kind === 'success') {
      void notificationService.sendPaymentSuccess(outcome.orderId).catch(() => undefined);
    } else if (outcome?.kind === 'failed') {
      void notificationService.sendPaymentFailed(outcome.orderId).catch(() => undefined);
    }
  },
};
