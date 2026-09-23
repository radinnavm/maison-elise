import type { CartDto, CartItemDto } from '@maison-elise/shared';

import { env } from '../config/env.js';
import type { CartWithItems } from '../repositories/cart.repository.js';

function toAbsoluteUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return `${env.apiPublicUrl}${url.startsWith('/') ? '' : '/'}${url}`;
}

export function toCartDto(cart: CartWithItems | null): CartDto {
  if (!cart) {
    return { items: [], subtotal: 0, itemCount: 0 };
  }

  const items: CartItemDto[] = cart.items.map((item) => {
    const unitPrice = Number(item.variant.price);
    const lineTotal = unitPrice * item.quantity;

    return {
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      name: item.product.name,
      slug: item.product.slug,
      image: toAbsoluteUrl(item.product.images[0]?.url ?? ''),
      size: item.variant.size,
      color: item.variant.color,
      unitPrice,
      quantity: item.quantity,
      lineTotal,
      stockQuantity: item.variant.stockQuantity,
      inStock: item.variant.stockQuantity > 0,
    };
  });

  return {
    items,
    subtotal: items.reduce((total, item) => total + item.lineTotal, 0),
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
  };
}
