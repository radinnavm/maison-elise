import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';

import type { EmailDelivery, User } from '@prisma/client';

import type { OrderWithItems } from '../repositories/order.repository.js';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ??= 'postgresql://postgres:postgres@localhost:5432/maison_elise_test';
process.env.JWT_SECRET ??= 'test-secret';

const { notificationService } = await import('./notification.service.js');
const { emailService } = await import('./email.service.js');
const { emailDeliveryRepository } = await import('../repositories/emailDelivery.repository.js');
const { orderRepository } = await import('../repositories/order.repository.js');
const { userRepository } = await import('../repositories/user.repository.js');

let deliveries: { dedupeKey: string; type: string }[];
let sent: { id: string; provider: string; providerMessageId: string | null }[];
let failed: string[];
let emails: { to: string; subject: string }[];
let createShouldConflict: boolean;
let createShouldFail: boolean;
let sendShouldFail: boolean;
let orderExists: boolean;
let stalePending: EmailDelivery[];

function makeOrder(): OrderWithItems {
  return {
    id: 'order-1',
    sequence: 6,
    userId: 'user-1',
    status: 'PENDING',
    paymentStatus: 'UNPAID',
    stripePaymentIntentId: null,
    currency: 'EUR',
    subtotal: 150,
    shippingAmount: 0,
    total: 150,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    items: [
      {
        id: 'oi-1',
        orderId: 'order-1',
        productId: 'prod-1',
        variantId: 'var-1',
        productName: 'Louise Silk Scarf',
        size: 'One Size',
        color: 'Beige',
        unitPrice: 150,
        quantity: 1,
        lineTotal: 150,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ],
    shippingAddress: {
      id: 'osa-1',
      orderId: 'order-1',
      firstName: 'Camille',
      lastName: 'Laurent',
      phone: '+33123456789',
      addressLine1: '12 Rue Saint-Honoré',
      addressLine2: null,
      city: 'Paris',
      postalCode: '75001',
      countryCode: 'FR',
    },
  } as unknown as OrderWithItems;
}

function makeUser(): User {
  return {
    id: 'user-1',
    firstName: 'Camille',
    lastName: 'Laurent',
    email: 'camille@example.com',
    passwordHash: 'hash',
    role: 'CUSTOMER',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  } as unknown as User;
}

beforeEach(() => {
  deliveries = [];
  sent = [];
  failed = [];
  emails = [];
  createShouldConflict = false;
  createShouldFail = false;
  sendShouldFail = false;
  orderExists = true;
  stalePending = [];

  mock.method(emailDeliveryRepository, 'create', async (input: unknown) => {
    const { dedupeKey, type } = input as { dedupeKey: string; type: string };

    if (createShouldConflict) {
      throw Object.assign(new Error('unique constraint'), { code: 'P2002' });
    }

    if (createShouldFail) {
      throw new Error('database unavailable');
    }

    deliveries.push({ dedupeKey, type });
    return { id: 'delivery-1' } as unknown as EmailDelivery;
  });

  mock.method(emailDeliveryRepository, 'markSent', async (id: string, outcome: unknown) => {
    const { provider, providerMessageId } = outcome as {
      provider: string;
      providerMessageId: string | null;
    };
    sent.push({ id, provider, providerMessageId });
    return {} as unknown as EmailDelivery;
  });

  mock.method(emailDeliveryRepository, 'markFailed', async (id: string) => {
    failed.push(id);
    return {} as unknown as EmailDelivery;
  });

  mock.method(emailDeliveryRepository, 'findStalePending', async () => stalePending);

  mock.method(emailService, 'send', async (message: { to: string; subject: string }) => {
    if (sendShouldFail) {
      throw new Error('provider unavailable');
    }
    emails.push({ to: message.to, subject: message.subject });
    return { provider: 'test', messageId: 'msg-1' };
  });

  mock.method(orderRepository, 'findById', async () => (orderExists ? makeOrder() : null));
  mock.method(userRepository, 'findById', async () => makeUser());
});

afterEach(() => {
  mock.restoreAll();
});

describe('notificationService', () => {
  it('sends an order confirmation to the account email and records it', async () => {
    await notificationService.sendOrderConfirmation('order-1');

    assert.equal(deliveries[0]?.dedupeKey, 'ORDER_CONFIRMATION:order-1');
    assert.equal(deliveries[0]?.type, 'ORDER_CONFIRMATION');
    assert.equal(emails[0]?.to, 'camille@example.com');
    assert.match(emails[0]?.subject ?? '', /ME-2026-0006/);
    assert.deepEqual(sent[0], { id: 'delivery-1', provider: 'test', providerMessageId: 'msg-1' });
  });

  it('does not send twice for the same order (idempotent by dedupe key)', async () => {
    createShouldConflict = true;

    await notificationService.sendOrderConfirmation('order-1');

    assert.equal(emails.length, 0);
    assert.equal(sent.length, 0);
    assert.equal(failed.length, 0);
  });

  it('records a failure without throwing when the provider fails', async () => {
    sendShouldFail = true;

    await assert.doesNotReject(notificationService.sendOrderConfirmation('order-1'));

    assert.equal(emails.length, 0);
    assert.equal(sent.length, 0);
    assert.deepEqual(failed, ['delivery-1']);
  });

  it('does not throw when the delivery record cannot be created', async () => {
    createShouldFail = true;

    await assert.doesNotReject(notificationService.sendOrderConfirmation('order-1'));

    assert.equal(deliveries.length, 0);
  });

  it('sends a welcome email to the registered account email', async () => {
    await notificationService.sendWelcome('user-1');

    assert.equal(deliveries[0]?.dedupeKey, 'WELCOME:user-1');
    assert.equal(deliveries[0]?.type, 'WELCOME');
    assert.equal(emails[0]?.to, 'camille@example.com');
  });

  it('uses type-scoped dedupe keys for payment and status emails', async () => {
    await notificationService.sendPaymentSuccess('order-1');
    await notificationService.sendPaymentFailed('order-1');
    await notificationService.sendOrderStatusChanged('order-1', 'CANCELLED');

    assert.deepEqual(
      deliveries.map((delivery) => delivery.dedupeKey),
      [
        'PAYMENT_SUCCESS:order-1',
        'PAYMENT_FAILED:order-1',
        'ORDER_STATUS_CHANGED:order-1:CANCELLED',
      ],
    );
    assert.deepEqual(
      deliveries.map((delivery) => delivery.type),
      ['PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'ORDER_STATUS_CHANGED'],
    );
  });

  it('does nothing when the order or user no longer exists', async () => {
    orderExists = false;

    await assert.doesNotReject(notificationService.sendOrderConfirmation('missing'));

    assert.equal(deliveries.length, 0);
  });
});

function makePendingDelivery(overrides: Partial<EmailDelivery> = {}): EmailDelivery {
  return {
    id: 'delivery-9',
    userId: 'user-1',
    orderId: 'order-1',
    type: 'ORDER_CONFIRMATION',
    provider: null,
    providerMessageId: null,
    status: 'PENDING',
    dedupeKey: 'ORDER_CONFIRMATION:order-1',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  } as EmailDelivery;
}

describe('notificationService.recoverPendingDeliveries', () => {
  it('re-sends a stale PENDING delivery and marks it sent', async () => {
    stalePending = [makePendingDelivery()];

    const result = await notificationService.recoverPendingDeliveries();

    assert.deepEqual(result, { recovered: 1, failed: 0, skipped: 0 });
    assert.deepEqual(sent, [{ id: 'delivery-9', provider: 'test', providerMessageId: 'msg-1' }]);
    // Recovery never creates a new dedupe row.
    assert.equal(deliveries.length, 0);
  });

  it('marks a stale delivery FAILED when the provider fails', async () => {
    stalePending = [makePendingDelivery()];
    sendShouldFail = true;

    const result = await notificationService.recoverPendingDeliveries();

    assert.deepEqual(result, { recovered: 0, failed: 1, skipped: 0 });
    assert.deepEqual(failed, ['delivery-9']);
  });

  it('skips a stale delivery whose context no longer exists', async () => {
    stalePending = [makePendingDelivery()];
    orderExists = false;

    const result = await notificationService.recoverPendingDeliveries();

    assert.deepEqual(result, { recovered: 0, failed: 0, skipped: 1 });
    assert.equal(emails.length, 0);
  });

  it('does nothing when there are no stale deliveries', async () => {
    stalePending = [];

    const result = await notificationService.recoverPendingDeliveries();

    assert.deepEqual(result, { recovered: 0, failed: 0, skipped: 0 });
    assert.equal(sent.length, 0);
  });
});
