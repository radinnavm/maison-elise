import { readStorage, writeStorage } from '@/lib/storage';
import type { CartItem } from '@/types/cart';

const CART_KEY = 'cart';

function isCartItem(value: unknown): value is CartItem {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<CartItem>;

  return (
    typeof candidate.variantId === 'string' &&
    typeof candidate.productId === 'string' &&
    typeof candidate.slug === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.size === 'string' &&
    typeof candidate.color === 'string' &&
    typeof candidate.unitPrice === 'number' &&
    typeof candidate.quantity === 'number'
  );
}

export function loadCartItems(): CartItem[] {
  const stored = readStorage<unknown>(CART_KEY, []);
  return Array.isArray(stored) ? stored.filter(isCartItem) : [];
}

export function saveCartItems(items: CartItem[]): void {
  writeStorage(CART_KEY, items);
}
