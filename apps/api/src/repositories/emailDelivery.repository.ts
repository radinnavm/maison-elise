import type { EmailDelivery, EmailType } from '@prisma/client';

import { prisma } from '../config/prisma.js';

export interface CreateEmailDeliveryInput {
  dedupeKey: string;
  type: EmailType;
  userId?: string | null;
  orderId?: string | null;
}

export interface EmailSendOutcome {
  provider: string;
  providerMessageId: string | null;
}

export const emailDeliveryRepository = {
  create(input: CreateEmailDeliveryInput): Promise<EmailDelivery> {
    return prisma.emailDelivery.create({
      data: {
        dedupeKey: input.dedupeKey,
        type: input.type,
        userId: input.userId ?? null,
        orderId: input.orderId ?? null,
      },
    });
  },

  markSent(id: string, outcome: EmailSendOutcome): Promise<EmailDelivery> {
    return prisma.emailDelivery.update({
      where: { id },
      data: {
        status: 'SENT',
        provider: outcome.provider,
        providerMessageId: outcome.providerMessageId,
      },
    });
  },

  markFailed(id: string): Promise<EmailDelivery> {
    return prisma.emailDelivery.update({ where: { id }, data: { status: 'FAILED' } });
  },

  /**
   * Delivery records still PENDING after `olderThan`. These are candidates for
   * recovery after an interrupted process (see notificationService.recoverPending).
   */
  findStalePending(olderThan: Date, limit: number): Promise<EmailDelivery[]> {
    return prisma.emailDelivery.findMany({
      where: { status: 'PENDING', createdAt: { lt: olderThan } },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
  },
};
