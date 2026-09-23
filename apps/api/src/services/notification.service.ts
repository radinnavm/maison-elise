import type { EmailDelivery, EmailType } from '@prisma/client';

import { env } from '../config/env.js';
import {
  renderOrderConfirmation,
  renderOrderStatusChanged,
  renderPaymentFailed,
  renderPaymentSuccess,
  renderWelcome,
  type RenderedEmail,
} from '../email/templates.js';
import { toOrderDto } from '../mappers/order.mapper.js';
import { emailDeliveryRepository } from '../repositories/emailDelivery.repository.js';
import { orderRepository } from '../repositories/order.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { logger, serializeError } from '../utils/logger.js';
import { emailService } from './email.service.js';

function isUniqueConstraint(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'P2002'
  );
}

function logEmailFailure(
  type: EmailType,
  error: unknown,
  context: { orderId?: string; userId?: string },
): void {
  logger.warn('email delivery failed', {
    type,
    orderId: context.orderId,
    userId: context.userId,
    ...serializeError(error),
  });
}

interface EmailContext {
  to: string;
  email: RenderedEmail;
  userId: string;
  orderId?: string;
}

interface BuildContextParams {
  type: EmailType;
  orderId?: string;
  userId?: string;
  status?: 'CONFIRMED' | 'CANCELLED';
}

/**
 * Builds the email payload for a delivery from server-authoritative data. The
 * recipient always comes from the stored user record, never from client input.
 * Returns null when the referenced user/order no longer exists (nothing to send).
 */
async function buildEmailContext(params: BuildContextParams): Promise<EmailContext | null> {
  if (params.type === 'WELCOME') {
    if (!params.userId) {
      return null;
    }

    const user = await userRepository.findById(params.userId);

    if (!user) {
      return null;
    }

    return {
      to: user.email,
      userId: user.id,
      email: renderWelcome({
        firstName: user.firstName,
        accountUrl: `${env.appUrl}/account`,
      }),
    };
  }

  if (!params.orderId) {
    return null;
  }

  const order = await orderRepository.findById(params.orderId);

  if (!order) {
    return null;
  }

  const user = await userRepository.findById(order.userId);

  if (!user) {
    return null;
  }

  const dto = toOrderDto(order);
  const orderUrl = `${env.appUrl}/order/${params.orderId}`;
  const base = { to: user.email, userId: user.id, orderId: params.orderId };

  switch (params.type) {
    case 'ORDER_CONFIRMATION':
      return {
        ...base,
        email: renderOrderConfirmation({ firstName: user.firstName, order: dto, orderUrl }),
      };
    case 'PAYMENT_SUCCESS':
      return {
        ...base,
        email: renderPaymentSuccess({ firstName: user.firstName, order: dto, orderUrl }),
      };
    case 'PAYMENT_FAILED':
      return {
        ...base,
        email: renderPaymentFailed({ firstName: user.firstName, order: dto, orderUrl }),
      };
    case 'ORDER_STATUS_CHANGED': {
      const status = params.status ?? (order.status as 'CONFIRMED' | 'CANCELLED');

      if (status !== 'CONFIRMED' && status !== 'CANCELLED') {
        return null;
      }

      return {
        ...base,
        email: renderOrderStatusChanged({
          firstName: user.firstName,
          order: dto,
          status,
          orderUrl,
        }),
      };
    }
    default:
      return null;
  }
}

interface DeliverParams {
  dedupeKey: string;
  type: EmailType;
  userId?: string;
  orderId?: string;
  build: () => Promise<{ to: string; email: RenderedEmail }>;
}

/**
 * Persists a delivery record (unique by dedupeKey for idempotency), then sends.
 * Never throws: email is a secondary side effect and must not break business flows.
 */
async function deliver(params: DeliverParams): Promise<void> {
  let recordId: string;

  try {
    const record = await emailDeliveryRepository.create({
      dedupeKey: params.dedupeKey,
      type: params.type,
      userId: params.userId ?? null,
      orderId: params.orderId ?? null,
    });
    recordId = record.id;
  } catch (error) {
    if (isUniqueConstraint(error)) {
      return; // Already delivered or in progress — idempotent no-op.
    }

    logEmailFailure(params.type, error, { orderId: params.orderId, userId: params.userId });
    return;
  }

  await sendAndRecord(recordId, params.build, params.type, {
    orderId: params.orderId,
    userId: params.userId,
  });
}

async function sendAndRecord(
  recordId: string,
  build: () => Promise<{ to: string; email: RenderedEmail }>,
  type: EmailType,
  context: { orderId?: string; userId?: string },
): Promise<void> {
  try {
    const { to, email } = await build();
    const result = await emailService.send({
      to,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });

    await emailDeliveryRepository.markSent(recordId, {
      provider: result.provider,
      providerMessageId: result.messageId,
    });
  } catch (error) {
    await emailDeliveryRepository.markFailed(recordId).catch(() => undefined);

    logEmailFailure(type, error, context);
  }
}

async function sendTyped(params: BuildContextParams & { dedupeKey: string }): Promise<void> {
  try {
    const context = await buildEmailContext(params);

    if (!context) {
      return;
    }

    await deliver({
      dedupeKey: params.dedupeKey,
      type: params.type,
      userId: context.userId,
      orderId: context.orderId,
      build: async () => ({ to: context.to, email: context.email }),
    });
  } catch (error) {
    logEmailFailure(params.type, error, { orderId: params.orderId, userId: params.userId });
  }
}

export interface PendingRecoveryResult {
  recovered: number;
  failed: number;
  skipped: number;
}

export const notificationService = {
  sendWelcome(userId: string): Promise<void> {
    return sendTyped({ type: 'WELCOME', userId, dedupeKey: `WELCOME:${userId}` });
  },

  sendOrderConfirmation(orderId: string): Promise<void> {
    return sendTyped({
      type: 'ORDER_CONFIRMATION',
      orderId,
      dedupeKey: `ORDER_CONFIRMATION:${orderId}`,
    });
  },

  sendPaymentSuccess(orderId: string): Promise<void> {
    return sendTyped({ type: 'PAYMENT_SUCCESS', orderId, dedupeKey: `PAYMENT_SUCCESS:${orderId}` });
  },

  sendPaymentFailed(orderId: string): Promise<void> {
    return sendTyped({ type: 'PAYMENT_FAILED', orderId, dedupeKey: `PAYMENT_FAILED:${orderId}` });
  },

  sendOrderStatusChanged(orderId: string, status: 'CONFIRMED' | 'CANCELLED'): Promise<void> {
    return sendTyped({
      type: 'ORDER_STATUS_CHANGED',
      orderId,
      status,
      dedupeKey: `ORDER_STATUS_CHANGED:${orderId}:${status}`,
    });
  },

  /**
   * Re-sends delivery records that have been stuck in PENDING (e.g. the process
   * was interrupted between recording and sending). Sends to the existing record
   * — it never creates a new dedupe row — so normal idempotency is unaffected.
   *
   * Delivery is at-least-once: a send that succeeded but was not marked before a
   * crash may be retried. Run via `pnpm --filter @maison-elise/api email:recover`.
   */
  async recoverPendingDeliveries(options?: {
    olderThanMs?: number;
    limit?: number;
  }): Promise<PendingRecoveryResult> {
    const olderThan = new Date(Date.now() - (options?.olderThanMs ?? env.emailPendingRecoveryMs));
    const records = await emailDeliveryRepository.findStalePending(olderThan, options?.limit ?? 50);

    const result: PendingRecoveryResult = { recovered: 0, failed: 0, skipped: 0 };

    for (const record of records) {
      await recoverRecord(record, result);
    }

    return result;
  },
};

async function recoverRecord(record: EmailDelivery, result: PendingRecoveryResult): Promise<void> {
  const context = await buildEmailContext({
    type: record.type,
    orderId: record.orderId ?? undefined,
    userId: record.userId ?? undefined,
  }).catch((error: unknown) => {
    logEmailFailure(record.type, error, {
      orderId: record.orderId ?? undefined,
      userId: record.userId ?? undefined,
    });
    return null;
  });

  if (!context) {
    result.skipped += 1;
    return;
  }

  try {
    const sent = await emailService.send({
      to: context.to,
      subject: context.email.subject,
      html: context.email.html,
      text: context.email.text,
    });

    await emailDeliveryRepository.markSent(record.id, {
      provider: sent.provider,
      providerMessageId: sent.messageId,
    });
    result.recovered += 1;
  } catch (error) {
    await emailDeliveryRepository.markFailed(record.id).catch(() => undefined);
    result.failed += 1;
    logEmailFailure(record.type, error, {
      orderId: record.orderId ?? undefined,
      userId: record.userId ?? undefined,
    });
  }
}
