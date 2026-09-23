import { readStorage, writeStorage } from '@/lib/storage';
import type { WishlistItem } from '@/types/wishlist';

const WISHLIST_KEY = 'wishlist';

function isWishlistItem(value: unknown): value is WishlistItem {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<WishlistItem>;

  return (
    typeof candidate.productId === 'string' &&
    typeof candidate.slug === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.price === 'number'
  );
}

export function loadWishlistItems(): WishlistItem[] {
  const stored = readStorage<unknown>(WISHLIST_KEY, []);
  return Array.isArray(stored) ? stored.filter(isWishlistItem) : [];
}

export function saveWishlistItems(items: WishlistItem[]): void {
  writeStorage(WISHLIST_KEY, items);
}
