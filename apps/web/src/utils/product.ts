import type { Product } from '@/types/product';

export function isInStock(product: Product): boolean {
  return product.stock > 0;
}

export function isOnSale(product: Product): boolean {
  return product.compareAtPrice !== undefined && product.compareAtPrice > product.price;
}
