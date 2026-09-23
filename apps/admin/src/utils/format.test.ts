import { describe, expect, it } from 'vitest';

import { orderStatusTone, paymentStatusTone, productStatusTone } from '@/utils/format';

describe('admin status tones', () => {
  it('maps order status tones', () => {
    expect(orderStatusTone('CONFIRMED')).toBe('positive');
    expect(orderStatusTone('CANCELLED')).toBe('negative');
    expect(orderStatusTone('PENDING')).toBe('warning');
  });

  it('maps payment status tones', () => {
    expect(paymentStatusTone('PAID')).toBe('positive');
    expect(paymentStatusTone('FAILED')).toBe('negative');
    expect(paymentStatusTone('PROCESSING')).toBe('warning');
    expect(paymentStatusTone('UNPAID')).toBe('neutral');
  });

  it('maps product status tones', () => {
    expect(productStatusTone('ACTIVE')).toBe('positive');
    expect(productStatusTone('DRAFT')).toBe('warning');
    expect(productStatusTone('ARCHIVED')).toBe('neutral');
  });
});
