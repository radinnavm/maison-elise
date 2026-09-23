import { LOW_STOCK_THRESHOLD } from '@maison-elise/shared';
import type { Prisma } from '@prisma/client';

import { prisma } from '../config/prisma.js';
import { orderInclude } from './order.repository.js';

export const adminOrderInclude = {
  items: { orderBy: { createdAt: 'asc' } },
  shippingAddress: true,
  user: { select: { id: true, firstName: true, lastName: true, email: true } },
} satisfies Prisma.OrderInclude;

export type AdminOrderWithUser = Prisma.OrderGetPayload<{ include: typeof adminOrderInclude }>;

export const adminProductSelect = {
  id: true,
  name: true,
  slug: true,
  status: true,
  basePrice: true,
  currency: true,
  createdAt: true,
  category: true,
  images: { orderBy: { sortOrder: 'asc' }, take: 1 },
  _count: { select: { variants: true } },
} satisfies Prisma.ProductSelect;

export type AdminProductRecord = Prisma.ProductGetPayload<{ select: typeof adminProductSelect }>;

export const adminInventorySelect = {
  id: true,
  sku: true,
  size: true,
  color: true,
  stockQuantity: true,
  price: true,
  productId: true,
  product: { select: { name: true, slug: true } },
} satisfies Prisma.ProductVariantSelect;

export type AdminInventoryRecord = Prisma.ProductVariantGetPayload<{
  select: typeof adminInventorySelect;
}>;

export const adminCustomerSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  role: true,
  createdAt: true,
  _count: { select: { orders: true } },
} satisfies Prisma.UserSelect;

export type AdminCustomerRecord = Prisma.UserGetPayload<{ select: typeof adminCustomerSelect }>;

export const adminRepository = {
  async dashboard() {
    const [
      total,
      pending,
      confirmed,
      cancelled,
      revenue,
      products,
      lowStockVariants,
      outOfStockVariants,
      customers,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.order.count({ where: { status: 'CONFIRMED' } }),
      prisma.order.count({ where: { status: 'CANCELLED' } }),
      prisma.order.aggregate({ _sum: { total: true }, where: { status: 'CONFIRMED' } }),
      prisma.product.count({ where: { status: 'ACTIVE' } }),
      prisma.productVariant.count({
        where: { stockQuantity: { gt: 0, lte: LOW_STOCK_THRESHOLD } },
      }),
      prisma.productVariant.count({ where: { stockQuantity: { lte: 0 } } }),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
    ]);

    return {
      total,
      pending,
      confirmed,
      cancelled,
      confirmedRevenue: Number(revenue._sum.total ?? 0),
      products,
      lowStockVariants,
      outOfStockVariants,
      customers,
    };
  },

  async findOrders(
    where: Prisma.OrderWhereInput,
    skip: number,
    take: number,
  ): Promise<{ items: AdminOrderWithUser[]; total: number }> {
    const [items, total] = await prisma.$transaction([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: adminOrderInclude,
      }),
      prisma.order.count({ where }),
    ]);

    return { items, total };
  },

  findOrder(orderId: string): Promise<AdminOrderWithUser | null> {
    return prisma.order.findUnique({ where: { id: orderId }, include: adminOrderInclude });
  },

  findEmailDeliveries(orderId: string) {
    return prisma.emailDelivery.findMany({ where: { orderId }, orderBy: { createdAt: 'asc' } });
  },

  async findProducts(
    where: Prisma.ProductWhereInput,
    orderBy: Prisma.ProductOrderByWithRelationInput,
    skip: number,
    take: number,
  ): Promise<{ items: AdminProductRecord[]; total: number }> {
    const [items, total] = await prisma.$transaction([
      prisma.product.findMany({ where, orderBy, skip, take, select: adminProductSelect }),
      prisma.product.count({ where }),
    ]);

    return { items, total };
  },

  async findInventory(
    where: Prisma.ProductVariantWhereInput,
    skip: number,
    take: number,
  ): Promise<{ items: AdminInventoryRecord[]; total: number }> {
    const [items, total] = await prisma.$transaction([
      prisma.productVariant.findMany({
        where,
        orderBy: [{ product: { name: 'asc' } }, { size: 'asc' }, { color: 'asc' }],
        skip,
        take,
        select: adminInventorySelect,
      }),
      prisma.productVariant.count({ where }),
    ]);

    return { items, total };
  },

  findVariant(variantId: string) {
    return prisma.productVariant.findUnique({ where: { id: variantId } });
  },

  updateVariantStock(variantId: string, stockQuantity: number): Promise<AdminInventoryRecord> {
    return prisma.productVariant.update({
      where: { id: variantId },
      data: { stockQuantity },
      select: adminInventorySelect,
    });
  },

  async findCustomers(
    where: Prisma.UserWhereInput,
    skip: number,
    take: number,
  ): Promise<{ items: AdminCustomerRecord[]; total: number }> {
    const [items, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: adminCustomerSelect,
      }),
      prisma.user.count({ where }),
    ]);

    return { items, total };
  },

  findCustomer(userId: string): Promise<AdminCustomerRecord | null> {
    return prisma.user.findUnique({ where: { id: userId }, select: adminCustomerSelect });
  },

  async customerConfirmedSpend(userId: string): Promise<number> {
    const result = await prisma.order.aggregate({
      _sum: { total: true },
      where: { userId, status: 'CONFIRMED' },
    });

    return Number(result._sum.total ?? 0);
  },

  customerRecentOrders(userId: string, take: number) {
    return prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take,
      include: orderInclude,
    });
  },
};
