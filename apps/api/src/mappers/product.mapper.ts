import type { ProductDto } from '@maison-elise/shared';

import { env } from '../config/env.js';
import type { ProductWithRelations } from '../repositories/product.repository.js';

export function toAbsoluteUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return `${env.apiPublicUrl}${url.startsWith('/') ? '' : '/'}${url}`;
}

export function toProductDto(product: ProductWithRelations): ProductDto {
  const sizes = Array.from(new Set(product.variants.map((variant) => variant.size)));
  const colors = Array.from(new Set(product.variants.map((variant) => variant.color)));
  const stock = product.variants.reduce((total, variant) => total + variant.stockQuantity, 0);

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    category: {
      id: product.category.id,
      name: product.category.name,
      slug: product.category.slug,
    },
    price: Number(product.basePrice),
    currency: product.currency,
    images: product.images.map((image) => ({
      id: image.id,
      url: toAbsoluteUrl(image.url),
      alt: image.alt,
      sortOrder: image.sortOrder,
    })),
    variants: product.variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      size: variant.size,
      color: variant.color,
      stockQuantity: variant.stockQuantity,
      price: Number(variant.price),
    })),
    sizes,
    colors,
    stock,
    isNew: product.isNew,
    isFeatured: product.isFeatured,
    status: product.status,
  };
}
