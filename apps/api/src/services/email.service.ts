import type { EmailMessage } from '../email/provider.js';
import { emailProvider } from '../email/provider.js';

/**
 * Thin application-facing email service. Business code depends on this, never on
 * the provider SDK, so the provider can be swapped without touching services.
 */
export const emailService = {
  send(message: EmailMessage) {
    return emailProvider.send(message);
  },
};
