import type { EmailDelivery } from '@prisma/client';
import type {
  AdminCustomerDetailDto,
  AdminCustomerListItem,
  AdminInventoryItem,
  AdminOrderDetailDto,
  AdminOrderDto,
  AdminProductListItem,
  EmailDeliveryDto,
} from '@maison-elise/shared';

import { toAbsoluteUrl } from './product.mapper.js';
import { toOrderDto } from './order.mapper.js';
import type {
  AdminCustomerRecord,
  AdminInventoryRecord,
  AdminOrderWithUser,
  AdminProductRecord,
} from '../repositories/admin.repository.js';
import type { OrderWithItems } from '../repositories/order.repository.js';

function fullName(firstName: string, lastName: string): string {
  return [firstName, lastName].filter(Boolean).join(' ').trim();
}

export function toAdminOrderDto(order: AdminOrderWithUser): AdminOrderDto {
  return {
    ...toOrderDto(order),
    customer: {
      id: order.user.id,
      firstName: order.user.firstName,
      lastName: order.user.lastName,
      name: fullName(order.user.firstName, order.user.lastName),
      email: order.user.email,
    },
  };
}

export function toEmailDeliveryDto(delivery: EmailDelivery): EmailDeliveryDto {
  return {
    id: delivery.id,
    type: delivery.type,
    status: delivery.status,
    providerMessageId: delivery.providerMessageId,
    createdAt: delivery.createdAt.toISOString(),
  };
}

export function toAdminOrderDetailDto(
  order: AdminOrderWithUser,
  emails: EmailDelivery[],
): AdminOrderDetailDto {
  return {
    ...toAdminOrderDto(order),
    emails: emails.map(toEmailDeliveryDto),
  };
}

export function toAdminProductListItem(product: AdminProductRecord): AdminProductListItem {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    status: product.status,
    category: {
      id: product.category.id,
      name: product.category.name,
      slug: product.category.slug,
    },
    basePrice: Number(product.basePrice),
    currency: product.currency,
    image: product.images[0] ? toAbsoluteUrl(product.images[0].url) : null,
    variantCount: product._count.variants,
    createdAt: product.createdAt.toISOString(),
  };
}

export function toAdminInventoryItem(variant: AdminInventoryRecord): AdminInventoryItem {
  return {
    id: variant.id,
    sku: variant.sku,
    size: variant.size,
    color: variant.color,
    stockQuantity: variant.stockQuantity,
    price: Number(variant.price),
    productId: variant.productId,
    productName: variant.product.name,
    productSlug: variant.product.slug,
  };
}

export function toAdminCustomerListItem(customer: AdminCustomerRecord): AdminCustomerListItem {
  return {
    id: customer.id,
    firstName: customer.firstName,
    lastName: customer.lastName,
    name: fullName(customer.firstName, customer.lastName),
    email: customer.email,
    role: customer.role,
    createdAt: customer.createdAt.toISOString(),
    orderCount: customer._count.orders,
  };
}

export function toAdminCustomerDetail(
  customer: AdminCustomerRecord,
  confirmedSpend: number,
  recentOrders: OrderWithItems[],
): AdminCustomerDetailDto {
  return {
    ...toAdminCustomerListItem(customer),
    confirmedSpend,
    recentOrders: recentOrders.map(toOrderDto),
  };
}
