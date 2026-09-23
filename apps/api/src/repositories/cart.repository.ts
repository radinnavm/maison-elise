import type { Prisma } from '@prisma/client';

import { prisma } from '../config/prisma.js';

export const cartInclude = {
  items: {
    orderBy: { createdAt: 'asc' },
    include: {
      product: { include: { images: { orderBy: { sortOrder: 'asc' } } } },
      variant: true,
    },
  },
} satisfies Prisma.CartInclude;

export type CartWithItems = Prisma.CartGetPayload<{ include: typeof cartInclude }>;

export type VariantWithProduct = Prisma.ProductVariantGetPayload<{ include: { product: true } }>;

export type CartItemWithVariant = Prisma.CartItemGetPayload<{ include: { variant: true } }>;

export interface CartTransaction {
  getOrCreateCart(userId: string): Promise<{ id: string }>;
  findItem(cartId: string, variantId: string): Promise<{ quantity: number } | null>;
  upsertItem(input: {
    cartId: string;
    productId: string;
    variantId: string;
    quantity: number;
  }): Promise<void>;
  findVariantWithProduct(variantId: string): Promise<VariantWithProduct | null>;
}

function createTransaction(tx: Prisma.TransactionClient): CartTransaction {
  return {
    getOrCreateCart(userId) {
      return tx.cart.upsert({ where: { userId }, update: {}, create: { userId } });
    },
    findItem(cartId, variantId) {
      return tx.cartItem.findUnique({
        where: { cartId_variantId: { cartId, variantId } },
        select: { quantity: true },
      });
    },
    async upsertItem(input) {
      await tx.cartItem.upsert({
        where: { cartId_variantId: { cartId: input.cartId, variantId: input.variantId } },
        update: { quantity: input.quantity },
        create: input,
      });
    },
    findVariantWithProduct(variantId) {
      return tx.productVariant.findUnique({
        where: { id: variantId },
        include: { product: true },
      });
    },
  };
}

export const cartRepository = {
  findByUserId(userId: string): Promise<CartWithItems | null> {
    return prisma.cart.findUnique({ where: { userId }, include: cartInclude });
  },

  findVariantWithProduct(variantId: string): Promise<VariantWithProduct | null> {
    return prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: true },
    });
  },

  findItemForUser(itemId: string, userId: string): Promise<CartItemWithVariant | null> {
    return prisma.cartItem.findFirst({
      where: { id: itemId, cart: { userId } },
      include: { variant: true },
    });
  },

  async updateItemQuantity(itemId: string, quantity: number): Promise<void> {
    await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
  },

  deleteItemForUser(itemId: string, userId: string): Promise<{ count: number }> {
    return prisma.cartItem.deleteMany({ where: { id: itemId, cart: { userId } } });
  },

  findCartIdByUser(userId: string): Promise<{ id: string } | null> {
    return prisma.cart.findUnique({ where: { userId }, select: { id: true } });
  },

  async clearItems(cartId: string): Promise<void> {
    await prisma.cartItem.deleteMany({ where: { cartId } });
  },

  transaction<T>(fn: (tx: CartTransaction) => Promise<T>): Promise<T> {
    return prisma.$transaction((tx) => fn(createTransaction(tx)));
  },
};
