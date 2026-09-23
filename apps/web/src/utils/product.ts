import type { Product } from '@/types/product';

export function isInStock(product: Product): boolean {
  return product.stock > 0;
}

export function isOnSale(product: Product): boolean {
  return product.compareAtPrice !== undefined && product.compareAtPrice > product.price;
}

export function getPrimaryImage(product: Product): string {
  return product.images[0]?.url ?? '';
}

export function getSecondaryImage(product: Product): string {
  return product.images[1]?.url ?? product.images[0]?.url ?? '';
}

export function getPrimaryImageAlt(product: Product): string {
  return product.images[0]?.alt || product.name;
}
