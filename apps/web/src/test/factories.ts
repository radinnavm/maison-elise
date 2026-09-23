import type { Product } from '@/types/product';

export function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'prod-1',
    name: 'Aurelia Satin Dress',
    slug: 'aurelia-satin-dress',
    description: 'Cut from fluid satin with a softly structured silhouette.',
    category: { id: 'cat-1', name: 'Dresses', slug: 'dresses' },
    price: 189,
    currency: 'EUR',
    images: [
      {
        id: 'img-1',
        url: 'https://cdn.example.com/aurelia-1.svg',
        alt: 'Aurelia Satin Dress',
        sortOrder: 0,
      },
    ],
    variants: [
      {
        id: 'var-m-black',
        sku: 'SKU-M-BLK',
        size: 'M',
        color: 'Black',
        stockQuantity: 3,
        price: 189,
      },
    ],
    sizes: ['M'],
    colors: ['Black'],
    stock: 3,
    isNew: true,
    isFeatured: false,
    status: 'ACTIVE',
    ...overrides,
  };
}
