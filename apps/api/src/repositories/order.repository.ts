import type { Prisma } from '@prisma/client';

import { prisma } from '../config/prisma.js';

export const orderInclude = {
  items: { orderBy: { createdAt: 'asc' } },
  shippingAddress: true,
} satisfies Prisma.OrderInclude;

export type OrderWithItems = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

export type CartForCheckout = Prisma.CartGetPayload<{
  include: { items: { include: { product: true; variant: true } } };
}>;

export type OrderItemSnapshot = Omit<Prisma.OrderItemCreateManyInput, 'orderId'>;

export type OrderShippingSnapshot = Omit<Prisma.OrderShippingAddressCreateManyInput, 'orderId'>;

export interface OrderTransaction {
  findCartWithItems(userId: string): Promise<CartForCheckout | null>;
  decrementStock(variantId: string, quantity: number): Promise<number>;
  createOrder(data: Prisma.OrderUncheckedCreateInput): Promise<{ id: string }>;
  createOrderItems(orderId: string, items: OrderItemSnapshot[]): Promise<void>;
  createShippingAddress(orderId: string, data: OrderShippingSnapshot): Promise<void>;
  clearCart(cartId: string): Promise<void>;
  findOrderWithItems(orderId: string): Promise<OrderWithItems>;
  /**
   * Conditionally updates the status only when the current status matches
   * `expectedStatus`, returning the number of rows changed. This guards against
   * concurrent transitions (e.g. two cancellations) restoring stock twice.
   */
  updateOrderStatus(
    orderId: string,
    status: 'PENDING' | 'CONFIRMED' | 'CANCELLED',
    expectedStatus: 'PENDING' | 'CONFIRMED' | 'CANCELLED',
  ): Promise<number>;
  incrementStock(variantId: string, quantity: number): Promise<void>;
}

function createTransaction(tx: Prisma.TransactionClient): OrderTransaction {
  return {
    findCartWithItems(userId) {
      return tx.cart.findUnique({
        where: { userId },
        include: { items: { include: { product: true, variant: true } } },
      });
    },

    async decrementStock(variantId, quantity) {
      // Conditional update: only decrements when enough stock remains, which
      // prevents concurrent checkouts from overselling the last unit.
      const result = await tx.productVariant.updateMany({
        where: { id: variantId, stockQuantity: { gte: quantity } },
        data: { stockQuantity: { decrement: quantity } },
      });

      return result.count;
    },

    createOrder(data) {
      return tx.order.create({ data, select: { id: true } });
    },

    async createOrderItems(orderId, items) {
      await tx.orderItem.createMany({
        data: items.map((item) => ({ ...item, orderId })),
      });
    },

    async createShippingAddress(orderId, data) {
      await tx.orderShippingAddress.create({ data: { ...data, orderId } });
    },

    async clearCart(cartId) {
      await tx.cartItem.deleteMany({ where: { cartId } });
    },

    findOrderWithItems(orderId) {
      return tx.order.findUniqueOrThrow({ where: { id: orderId }, include: orderInclude });
    },

    async updateOrderStatus(orderId, status, expectedStatus) {
      const result = await tx.order.updateMany({
        where: { id: orderId, status: expectedStatus },
        data: { status },
      });

      return result.count;
    },

    async incrementStock(variantId, quantity) {
      // updateMany is a safe no-op if the variant no longer exists.
      await tx.productVariant.updateMany({
        where: { id: variantId },
        data: { stockQuantity: { increment: quantity } },
      });
    },
  };
}

export const orderRepository = {
  async findManyByUser(
    userId: string,
    skip: number,
    take: number,
  ): Promise<{ items: OrderWithItems[]; total: number }> {
    const [items, total] = await prisma.$transaction([
      prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: orderInclude,
      }),
      prisma.order.count({ where: { userId } }),
    ]);

    return { items, total };
  },

  findByIdForUser(orderId: string, userId: string): Promise<OrderWithItems | null> {
    return prisma.order.findFirst({ where: { id: orderId, userId }, include: orderInclude });
  },

  findById(orderId: string): Promise<OrderWithItems | null> {
    return prisma.order.findUnique({ where: { id: orderId }, include: orderInclude });
  },

  transaction<T>(fn: (tx: OrderTransaction) => Promise<T>): Promise<T> {
    return prisma.$transaction((tx) => fn(createTransaction(tx)));
  },
};
