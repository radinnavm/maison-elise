import type { PaymentStatus, Prisma } from '@prisma/client';

import { prisma } from '../config/prisma.js';

export const orderPaymentSelect = {
  id: true,
  userId: true,
  sequence: true,
  status: true,
  paymentStatus: true,
  stripePaymentIntentId: true,
  currency: true,
  total: true,
} satisfies Prisma.OrderSelect;

export type OrderPaymentRecord = Prisma.OrderGetPayload<{ select: typeof orderPaymentSelect }>;

export interface PaymentTransaction {
  claimEvent(stripeEventId: string, eventType: string): Promise<boolean>;
  findOrderByPaymentIntentId(paymentIntentId: string): Promise<OrderPaymentRecord | null>;
  updateOrderPayment(
    orderId: string,
    data: { paymentStatus?: PaymentStatus; status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED' },
  ): Promise<void>;
}

function createTransaction(tx: Prisma.TransactionClient): PaymentTransaction {
  return {
    async claimEvent(stripeEventId, eventType) {
      // skipDuplicates relies on the unique constraint, so concurrent deliveries
      // of the same event are claimed exactly once without aborting the transaction.
      const result = await tx.stripeWebhookEvent.createMany({
        data: [{ stripeEventId, eventType, processedAt: new Date() }],
        skipDuplicates: true,
      });

      return result.count === 1;
    },

    findOrderByPaymentIntentId(paymentIntentId) {
      return tx.order.findUnique({
        where: { stripePaymentIntentId: paymentIntentId },
        select: orderPaymentSelect,
      });
    },

    async updateOrderPayment(orderId, data) {
      await tx.order.update({ where: { id: orderId }, data });
    },
  };
}

export const paymentRepository = {
  findOrderForUser(orderId: string, userId: string): Promise<OrderPaymentRecord | null> {
    return prisma.order.findFirst({ where: { id: orderId, userId }, select: orderPaymentSelect });
  },

  async setPaymentIntent(
    orderId: string,
    paymentIntentId: string,
    paymentStatus: PaymentStatus,
  ): Promise<void> {
    await prisma.order.update({
      where: { id: orderId },
      data: { stripePaymentIntentId: paymentIntentId, paymentStatus },
    });
  },

  transaction<T>(fn: (tx: PaymentTransaction) => Promise<T>): Promise<T> {
    return prisma.$transaction((tx) => fn(createTransaction(tx)));
  },
};
