export interface WishlistItem {
  productId: string;
  slug: string;
  name: string;
  price: number;
  addedAt: string;
}

export type WishlistItemInput = Omit<WishlistItem, 'addedAt'>;
