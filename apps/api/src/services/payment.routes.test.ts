import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { after, before, describe, it, mock } from 'node:test';

import Stripe from 'stripe';

import type { OrderPaymentRecord, PaymentTransaction } from '../repositories/payment.repository.js';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ??= 'postgresql://postgres:postgres@localhost:5432/maison_elise_test';
process.env.JWT_SECRET ??= 'test-secret';
process.env.STRIPE_SECRET_KEY ??= 'sk_test_dummy';
process.env.STRIPE_WEBHOOK_SECRET ??= 'whsec_test';

const { createApp } = await import('../app.js');
const { paymentRepository } = await import('../repositories/payment.repository.js');
const { notificationService } = await import('./notification.service.js');

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const signatureGenerator = new Stripe('sk_test_dummy');

let server: Server;
let baseUrl: string;
let updatedPayment: { paymentStatus?: string; status?: string } | null;
let processedEvents: Set<string>;
let notifiedOrders: string[];

const webhookOrder = {
  id: 'order-1',
  userId: 'user-a',
  sequence: 1,
  status: 'PENDING',
  paymentStatus: 'PROCESSING',
  stripePaymentIntentId: 'pi_1',
  currency: 'EUR',
  total: 300,
} as unknown as OrderPaymentRecord;

function makeTransaction(): PaymentTransaction {
  return {
    async claimEvent(stripeEventId) {
      if (processedEvents.has(stripeEventId)) {
        return false;
      }
      processedEvents.add(stripeEventId);
      return true;
    },
    async findOrderByPaymentIntentId() {
      return webhookOrder;
    },
    async updateOrderPayment(_orderId, data) {
      updatedPayment = data;
    },
  };
}

before(async () => {
  processedEvents = new Set();
  updatedPayment = null;
  notifiedOrders = [];

  // Email is a fire-and-forget side effect: mock it so the route test never
  // reaches a real provider or writes an EmailDelivery row.
  mock.method(notificationService, 'sendPaymentSuccess', async (orderId: string) => {
    notifiedOrders.push(`success:${orderId}`);
  });
  mock.method(notificationService, 'sendPaymentFailed', async (orderId: string) => {
    notifiedOrders.push(`failed:${orderId}`);
  });

  mock.method(
    paymentRepository,
    'transaction',
    async (fn: (tx: PaymentTransaction) => Promise<unknown>) => fn(makeTransaction()),
  );

  const app = createApp();
  server = app.listen(0);

  await new Promise<void>((resolve) => {
    server.once('listening', () => resolve());
  });

  const address = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}/api/v1`;
});

after(async () => {
  mock.restoreAll();
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

function eventPayload(id: string, type: string, objectId: string): string {
  return JSON.stringify({ id, type, data: { object: { id: objectId } } });
}

async function postWebhook(payload: string, signature: string): Promise<Response> {
  return fetch(`${baseUrl}/webhooks/stripe`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'stripe-signature': signature },
    body: payload,
  });
}

describe('stripe webhook', () => {
  it('rejects a request without a valid signature', async () => {
    const payload = eventPayload('evt_bad', 'payment_intent.succeeded', 'pi_1');
    const response = await postWebhook(payload, 't=1,v1=deadbeef');

    assert.equal(response.status, 400);
    assert.equal(updatedPayment, null);
  });

  it('accepts a signed succeeded event and confirms the order', async () => {
    const payload = eventPayload('evt_ok', 'payment_intent.succeeded', 'pi_1');
    const signature = signatureGenerator.webhooks.generateTestHeaderString({
      payload,
      secret: WEBHOOK_SECRET,
    });

    const response = await postWebhook(payload, signature);

    assert.equal(response.status, 200);
    assert.deepEqual(updatedPayment, { paymentStatus: 'PAID', status: 'CONFIRMED' });
    assert.deepEqual(notifiedOrders, ['success:order-1']);
  });

  it('does not repeat the transition when the same event is delivered twice', async () => {
    const payload = eventPayload('evt_dup', 'payment_intent.succeeded', 'pi_1');
    const signature = signatureGenerator.webhooks.generateTestHeaderString({
      payload,
      secret: WEBHOOK_SECRET,
    });

    const first = await postWebhook(payload, signature);
    const afterFirst = updatedPayment;
    const second = await postWebhook(payload, signature);

    assert.equal(first.status, 200);
    assert.equal(second.status, 200);
    assert.deepEqual(updatedPayment, afterFirst);
  });
});

describe('payment route authentication', () => {
  it('rejects creating a payment intent without a session', async () => {
    const response = await fetch(`${baseUrl}/orders/order-1/payment`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    });

    assert.equal(response.status, 401);
  });
});
