import type { CartDto } from '@maison-elise/shared';

import { toCartDto } from '../mappers/cart.mapper.js';
import { cartRepository, type VariantWithProduct } from '../repositories/cart.repository.js';
import { AppError, ConflictError, NotFoundError } from '../utils/errors.js';

const MAX_QUANTITY = 99;

function assertQuantity(quantity: number): void {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
    throw new AppError(400, 'INVALID_QUANTITY', 'Quantity must be between 1 and 99.');
  }
}

function assertVariantAvailable(variant: VariantWithProduct): void {
  if (variant.product.status !== 'ACTIVE') {
    throw new ConflictError('This piece is no longer available.', 'PRODUCT_UNAVAILABLE');
  }

  if (variant.stockQuantity <= 0) {
    throw new ConflictError('This variant is out of stock.', 'INSUFFICIENT_STOCK');
  }
}

function assertStock(stockQuantity: number, quantity: number): void {
  if (quantity > stockQuantity) {
    throw new ConflictError(`Only ${stockQuantity} left in stock.`, 'INSUFFICIENT_STOCK');
  }
}

async function buildCart(userId: string): Promise<CartDto> {
  return toCartDto(await cartRepository.findByUserId(userId));
}

export const cartService = {
  getCart: buildCart,

  async addItem(userId: string, variantId: string, quantity: number): Promise<CartDto> {
    assertQuantity(quantity);

    const variant = await cartRepository.findVariantWithProduct(variantId);

    if (!variant) {
      throw new NotFoundError('This variant could not be found.', 'VARIANT_NOT_FOUND');
    }

    assertVariantAvailable(variant);

    await cartRepository.transaction(async (tx) => {
      const cart = await tx.getOrCreateCart(userId);
      const existing = await tx.findItem(cart.id, variantId);
      const nextQuantity = (existing?.quantity ?? 0) + quantity;

      assertStock(variant.stockQuantity, nextQuantity);

      await tx.upsertItem({
        cartId: cart.id,
        productId: variant.productId,
        variantId,
        quantity: nextQuantity,
      });
    });

    return buildCart(userId);
  },

  async updateItem(userId: string, itemId: string, quantity: number): Promise<CartDto> {
    assertQuantity(quantity);

    const item = await cartRepository.findItemForUser(itemId, userId);

    if (!item) {
      throw new NotFoundError('This item is no longer in your bag.', 'CART_ITEM_NOT_FOUND');
    }

    assertStock(item.variant.stockQuantity, quantity);

    await cartRepository.updateItemQuantity(itemId, quantity);

    return buildCart(userId);
  },

  async removeItem(userId: string, itemId: string): Promise<CartDto> {
    const result = await cartRepository.deleteItemForUser(itemId, userId);

    if (result.count === 0) {
      throw new NotFoundError('This item is no longer in your bag.', 'CART_ITEM_NOT_FOUND');
    }

    return buildCart(userId);
  },

  async clear(userId: string): Promise<CartDto> {
    const cart = await cartRepository.findCartIdByUser(userId);

    if (cart) {
      await cartRepository.clearItems(cart.id);
    }

    return buildCart(userId);
  },

  async merge(userId: string, items: { variantId: string; quantity: number }[]): Promise<CartDto> {
    const requested = new Map<string, number>();

    for (const item of items) {
      const quantity = Math.min(MAX_QUANTITY, Math.max(1, item.quantity));
      requested.set(
        item.variantId,
        Math.min(MAX_QUANTITY, (requested.get(item.variantId) ?? 0) + quantity),
      );
    }

    await cartRepository.transaction(async (tx) => {
      const cart = await tx.getOrCreateCart(userId);

      for (const [variantId, quantity] of requested) {
        const variant = await tx.findVariantWithProduct(variantId);

        // Silently skip variants that no longer exist, are inactive, or are out of stock.
        if (!variant || variant.product.status !== 'ACTIVE' || variant.stockQuantity <= 0) {
          continue;
        }

        const existing = await tx.findItem(cart.id, variantId);
        const merged = Math.min((existing?.quantity ?? 0) + quantity, variant.stockQuantity);

        await tx.upsertItem({
          cartId: cart.id,
          productId: variant.productId,
          variantId,
          quantity: merged,
        });
      }
    });

    return buildCart(userId);
  },
};
