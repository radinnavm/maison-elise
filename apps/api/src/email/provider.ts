import { Resend } from 'resend';

import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export interface EmailSendResult {
  provider: string;
  messageId: string | null;
}

export interface EmailProviderAdapter {
  readonly name: string;
  send(message: EmailMessage): Promise<EmailSendResult>;
}

class ResendEmailProvider implements EmailProviderAdapter {
  readonly name = 'resend';

  private readonly client: Resend;

  constructor(apiKey: string) {
    this.client = new Resend(apiKey);
  }

  async send(message: EmailMessage): Promise<EmailSendResult> {
    const replyTo = message.replyTo ?? env.emailReplyTo;

    const response = await this.client.emails.send({
      from: env.emailFrom,
      to: message.to,
      subject: message.subject,
      html: message.html,
      ...(message.text ? { text: message.text } : {}),
      ...(replyTo ? { replyTo } : {}),
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    return { provider: this.name, messageId: response.data?.id ?? null };
  }
}

class LoggingEmailProvider implements EmailProviderAdapter {
  readonly name = 'log';

  async send(message: EmailMessage): Promise<EmailSendResult> {
    // Development fallback: no provider configured, so record instead of sending.
    logger.info('email not sent (no provider configured)', {
      to: message.to,
      subject: message.subject,
    });
    return { provider: this.name, messageId: null };
  }
}

export function createEmailProvider(): EmailProviderAdapter {
  return env.emailApiKey ? new ResendEmailProvider(env.emailApiKey) : new LoggingEmailProvider();
}

export const emailProvider: EmailProviderAdapter = createEmailProvider();
