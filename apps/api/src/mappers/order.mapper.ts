import type { OrderDto, OrderItemDto } from '@maison-elise/shared';

import type { OrderWithItems } from '../repositories/order.repository.js';

export function toOrderItemDto(item: OrderWithItems['items'][number]): OrderItemDto {
  return {
    id: item.id,
    productId: item.productId,
    variantId: item.variantId,
    productName: item.productName,
    size: item.size,
    color: item.color,
    unitPrice: Number(item.unitPrice),
    quantity: item.quantity,
    lineTotal: Number(item.lineTotal),
  };
}

function formatOrderNumber(sequence: number, createdAt: Date): string {
  return `ME-${createdAt.getFullYear()}-${String(sequence).padStart(4, '0')}`;
}

export function toOrderDto(order: OrderWithItems): OrderDto {
  const items = order.items.map(toOrderItemDto);

  return {
    id: order.id,
    orderNumber: formatOrderNumber(order.sequence, order.createdAt),
    status: order.status,
    paymentStatus: order.paymentStatus,
    currency: order.currency,
    subtotal: Number(order.subtotal),
    shippingAmount: Number(order.shippingAmount),
    total: Number(order.total),
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
    items,
    shippingAddress: order.shippingAddress
      ? {
          firstName: order.shippingAddress.firstName,
          lastName: order.shippingAddress.lastName,
          phone: order.shippingAddress.phone,
          addressLine1: order.shippingAddress.addressLine1,
          addressLine2: order.shippingAddress.addressLine2 ?? undefined,
          city: order.shippingAddress.city,
          postalCode: order.shippingAddress.postalCode,
          countryCode: order.shippingAddress.countryCode,
        }
      : null,
    createdAt: order.createdAt.toISOString(),
  };
}
