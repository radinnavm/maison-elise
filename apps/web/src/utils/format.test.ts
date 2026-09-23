import { describe, expect, it } from 'vitest';

import {
  formatOrderStatus,
  formatPaymentStatus,
  formatPrice,
  formatProductStatus,
} from '@/utils/format';

describe('format utilities', () => {
  it('formats prices in EUR', () => {
    expect(formatPrice(189, 'EUR')).toContain('189');
  });

  it('maps order statuses to readable labels', () => {
    expect(formatOrderStatus('PENDING')).toBe('Awaiting payment');
    expect(formatOrderStatus('CONFIRMED')).toBe('Confirmed');
    expect(formatOrderStatus('CANCELLED')).toBe('Cancelled');
  });

  it('maps payment statuses to readable labels', () => {
    expect(formatPaymentStatus('PAID')).toBe('Paid');
    expect(formatPaymentStatus('FAILED')).toBe('Payment failed');
    expect(formatPaymentStatus('UNPAID')).toBe('Not paid');
  });

  it('maps product statuses to readable labels', () => {
    expect(formatProductStatus('ACTIVE')).toBe('Active');
    expect(formatProductStatus('ARCHIVED')).toBe('Archived');
  });
});
