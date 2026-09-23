import type {
  EmailStatus,
  EmailType,
  OrderStatus,
  PaymentStatus,
  ProductStatus,
} from '@maison-elise/shared';

import type { BadgeTone } from '@/components/StatusBadge';

export {
  formatDateTime,
  formatOrderStatus,
  formatPaymentStatus,
  formatPrice,
  formatProductStatus,
} from '@maison-elise/shared';

export function orderStatusTone(status: OrderStatus): BadgeTone {
  switch (status) {
    case 'CONFIRMED':
      return 'positive';
    case 'CANCELLED':
      return 'negative';
    default:
      return 'warning';
  }
}

export function paymentStatusTone(status: PaymentStatus): BadgeTone {
  switch (status) {
    case 'PAID':
      return 'positive';
    case 'FAILED':
      return 'negative';
    case 'CANCELLED':
      return 'negative';
    case 'PROCESSING':
      return 'warning';
    default:
      return 'neutral';
  }
}

export function productStatusTone(status: ProductStatus): BadgeTone {
  switch (status) {
    case 'ACTIVE':
      return 'positive';
    case 'DRAFT':
      return 'warning';
    default:
      return 'neutral';
  }
}

export function formatEmailType(type: EmailType): string {
  switch (type) {
    case 'WELCOME':
      return 'Welcome';
    case 'ORDER_CONFIRMATION':
      return 'Order confirmation';
    case 'PAYMENT_SUCCESS':
      return 'Payment received';
    case 'PAYMENT_FAILED':
      return 'Payment failed';
    case 'ORDER_STATUS_CHANGED':
      return 'Order status update';
    default:
      return type;
  }
}

export function emailStatusTone(status: EmailStatus): BadgeTone {
  switch (status) {
    case 'SENT':
      return 'positive';
    case 'FAILED':
      return 'negative';
    default:
      return 'warning';
  }
}
