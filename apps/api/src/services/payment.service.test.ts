import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';

import type Stripe from 'stripe';

import type { OrderPaymentRecord, PaymentTransaction } from '../repositories/payment.repository.js';
import type { StripePaymentIntent } from './stripe.gateway.js';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ??= 'postgresql://postgres:postgres@localhost:5432/maison_elise_test';
process.env.JWT_SECRET ??= 'test-secret';

const { paymentService } = await import('./payment.service.js');
const { paymentRepository } = await import('../repositories/payment.repository.js');
const { stripeGateway } = await import('./stripe.gateway.js');
const { notificationService } = await import('./notification.service.js');

interface OrderOverrides {
  id?: string;
  userId?: string;
  sequence?: number;
  status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  paymentStatus?: 'UNPAID' | 'PROCESSING' | 'PAID' | 'FAILED' | 'CANCELLED';
  stripePaymentIntentId?: string | null;
  currency?: string;
  total?: number;
}

function makeOrder(overrides: OrderOverrides = {}): OrderPaymentRecord {
  return {
    id: 'order-1',
    userId: 'user-a',
    sequence: 1,
    status: 'PENDING',
    paymentStatus: 'UNPAID',
    stripePaymentIntentId: null,
    currency: 'EUR',
    total: 300,
    ...overrides,
  } as unknown as OrderPaymentRecord;
}

let order: OrderPaymentRecord | null;
let updatedPayment: { paymentStatus?: string; status?: string } | null;
let setPaymentIntentArgs: {
  orderId: string;
  paymentIntentId: string;
  paymentStatus: string;
} | null;
let webhookOrder: OrderPaymentRecord | null;
let claimResult: boolean;

function makeTransaction(): PaymentTransaction {
  return {
    async claimEvent() {
      return claimResult;
    },
    async findOrderByPaymentIntentId() {
      return webhookOrder;
    },
    async updateOrderPayment(_orderId, data) {
      updatedPayment = data;
    },
  };
}

function fakeEvent(id: string, type: string, objectId: string): Stripe.Event {
  return {
    id,
    type,
    data: { object: { id: objectId } },
  } as unknown as Stripe.Event;
}

beforeEach(() => {
  order = makeOrder();
  updatedPayment = null;
  setPaymentIntentArgs = null;
  webhookOrder = makeOrder({ stripePaymentIntentId: 'pi_1' });
  claimResult = true;

  mock.method(notificationService, 'sendPaymentSuccess', async () => undefined);
  mock.method(notificationService, 'sendPaymentFailed', async () => undefined);

  mock.method(paymentRepository, 'findOrderForUser', async () => order);
  mock.method(
    paymentRepository,
    'setPaymentIntent',
    async (orderId: string, paymentIntentId: string, paymentStatus: string) => {
      setPaymentIntentArgs = { orderId, paymentIntentId, paymentStatus };
    },
  );
  mock.method(
    paymentRepository,
    'transaction',
    async (fn: (tx: PaymentTransaction) => Promise<unknown>) => fn(makeTransaction()),
  );
});

afterEach(() => {
  mock.restoreAll();
});

describe('paymentService.createPaymentIntent', () => {
  it('rejects an order that does not belong to the user', async () => {
    order = null;

    await assert.rejects(
      paymentService.createPaymentIntent('user-a', 'order-1'),
      (error: unknown) => {
        assert.equal((error as { code?: string }).code, 'ORDER_NOT_FOUND');
        return true;
      },
    );
  });

  it('rejects a cancelled order', async () => {
    order = makeOrder({ status: 'CANCELLED' });

    await assert.rejects(
      paymentService.createPaymentIntent('user-a', 'order-1'),
      (error: unknown) => {
        assert.equal((error as { code?: string }).code, 'ORDER_CANCELLED');
        return true;
      },
    );
  });

  it('rejects an already paid order', async () => {
    order = makeOrder({ paymentStatus: 'PAID' });

    await assert.rejects(
      paymentService.createPaymentIntent('user-a', 'order-1'),
      (error: unknown) => {
        assert.equal((error as { code?: string }).code, 'PAYMENT_ALREADY_PAID');
        return true;
      },
    );
  });

  it('creates a PaymentIntent using the server-side amount and currency', async () => {
    const createMock = mock.method(
      stripeGateway,
      'createPaymentIntent',
      async (): Promise<StripePaymentIntent> => ({
        id: 'pi_new',
        clientSecret: 'cs_new',
        status: 'requires_payment_method',
      }),
    );

    const result = await paymentService.createPaymentIntent('user-a', 'order-1');

    const [params, key] = createMock.mock.calls[0]?.arguments ?? [];
    assert.equal(params?.amount, 30000);
    assert.equal(params?.currency, 'eur');
    assert.equal(params?.metadata.orderId, 'order-1');
    assert.equal(key, 'order:order-1:payment-intent');
    assert.equal(result.clientSecret, 'cs_new');
    assert.equal(result.paymentStatus, 'PROCESSING');
    assert.deepEqual(setPaymentIntentArgs, {
      orderId: 'order-1',
      paymentIntentId: 'pi_new',
      paymentStatus: 'PROCESSING',
    });
  });

  it('reuses an existing PaymentIntent instead of creating another (idempotent)', async () => {
    order = makeOrder({ stripePaymentIntentId: 'pi_existing', paymentStatus: 'UNPAID' });

    const retrieveMock = mock.method(
      stripeGateway,
      'retrievePaymentIntent',
      async (): Promise<StripePaymentIntent> => ({
        id: 'pi_existing',
        clientSecret: 'cs_existing',
        status: 'requires_confirmation',
      }),
    );
    const createMock = mock.method(stripeGateway, 'createPaymentIntent', async () => {
      throw new Error('should not create');
    });

    const result = await paymentService.createPaymentIntent('user-a', 'order-1');

    assert.equal(retrieveMock.mock.calls.length, 1);
    assert.equal(createMock.mock.calls.length, 0);
    assert.equal(result.clientSecret, 'cs_existing');
  });

  it('reports a succeeded PaymentIntent without creating a new one', async () => {
    order = makeOrder({ stripePaymentIntentId: 'pi_existing', paymentStatus: 'PROCESSING' });
    const createMock = mock.method(stripeGateway, 'createPaymentIntent', async () => {
      throw new Error('should not create');
    });
    mock.method(stripeGateway, 'retrievePaymentIntent', async (): Promise<StripePaymentIntent> => ({
      id: 'pi_existing',
      clientSecret: null,
      status: 'succeeded',
    }));

    const result = await paymentService.createPaymentIntent('user-a', 'order-1');

    assert.equal(result.paymentStatus, 'PAID');
    assert.equal(result.orderStatus, 'CONFIRMED');
    assert.equal(createMock.mock.calls.length, 0);
  });

  it('creates a replacement PaymentIntent when the previous one was cancelled', async () => {
    order = makeOrder({ stripePaymentIntentId: 'pi_cancelled', paymentStatus: 'CANCELLED' });
    mock.method(stripeGateway, 'retrievePaymentIntent', async (): Promise<StripePaymentIntent> => ({
      id: 'pi_cancelled',
      clientSecret: null,
      status: 'canceled',
    }));
    const createMock = mock.method(
      stripeGateway,
      'createPaymentIntent',
      async (): Promise<StripePaymentIntent> => ({
        id: 'pi_retry',
        clientSecret: 'cs_retry',
        status: 'requires_payment_method',
      }),
    );

    const result = await paymentService.createPaymentIntent('user-a', 'order-1');

    const [, key] = createMock.mock.calls[0]?.arguments ?? [];
    assert.equal(key, 'order:order-1:payment-intent:pi_cancelled');
    assert.equal(result.clientSecret, 'cs_retry');
  });
});

describe('paymentService.handleWebhookEvent', () => {
  it('marks the payment PAID and the order CONFIRMED on success', async () => {
    await paymentService.handleWebhookEvent(fakeEvent('evt_1', 'payment_intent.succeeded', 'pi_1'));

    assert.deepEqual(updatedPayment, { paymentStatus: 'PAID', status: 'CONFIRMED' });
  });

  it('marks the payment FAILED and leaves the order PENDING on failure', async () => {
    await paymentService.handleWebhookEvent(
      fakeEvent('evt_2', 'payment_intent.payment_failed', 'pi_1'),
    );

    assert.deepEqual(updatedPayment, { paymentStatus: 'FAILED' });
  });

  it('marks the payment CANCELLED on cancellation', async () => {
    await paymentService.handleWebhookEvent(fakeEvent('evt_3', 'payment_intent.canceled', 'pi_1'));

    assert.deepEqual(updatedPayment, { paymentStatus: 'CANCELLED' });
  });

  it('does not repeat a transition for a duplicate event', async () => {
    claimResult = false;

    await paymentService.handleWebhookEvent(fakeEvent('evt_1', 'payment_intent.succeeded', 'pi_1'));

    assert.equal(updatedPayment, null);
  });

  it('ignores a PaymentIntent that does not match any order', async () => {
    webhookOrder = null;

    await paymentService.handleWebhookEvent(
      fakeEvent('evt_4', 'payment_intent.succeeded', 'pi_unknown'),
    );

    assert.equal(updatedPayment, null);
  });

  it('ignores events that are not payment intents', async () => {
    await paymentService.handleWebhookEvent(fakeEvent('evt_5', 'charge.succeeded', 'ch_1'));

    assert.equal(updatedPayment, null);
  });
});
