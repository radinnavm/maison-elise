import type { OrderStatus, PaymentStatus, ProductStatus } from './types/api.js';

export function formatPrice(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const dateFormatter = new Intl.DateTimeFormat('en-IE', {
  dateStyle: 'long',
  timeStyle: 'short',
});

export function formatDateTime(value: string): string {
  return dateFormatter.format(new Date(value));
}

export function formatOrderStatus(status: OrderStatus): string {
  switch (status) {
    case 'PENDING':
      return 'Awaiting payment';
    case 'CONFIRMED':
      return 'Confirmed';
    case 'CANCELLED':
      return 'Cancelled';
    default:
      return status;
  }
}

export function formatPaymentStatus(status: PaymentStatus): string {
  switch (status) {
    case 'UNPAID':
      return 'Not paid';
    case 'PROCESSING':
      return 'Processing';
    case 'PAID':
      return 'Paid';
    case 'FAILED':
      return 'Payment failed';
    case 'CANCELLED':
      return 'Payment cancelled';
    default:
      return status;
  }
}

export function formatProductStatus(status: ProductStatus): string {
  switch (status) {
    case 'ACTIVE':
      return 'Active';
    case 'DRAFT':
      return 'Draft';
    case 'ARCHIVED':
      return 'Archived';
    default:
      return status;
  }
}
