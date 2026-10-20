import { describe, expect, it } from 'vitest';

import { queryDemoProducts } from './catalogSource';
import { demoCategories, demoProducts } from './demoProducts';

function categoryCount(category: string): number {
  return demoProducts.filter((product) => product.category.slug === category).length;
}

describe('demo catalog', () => {
  it('contains 30 women and 30 men products with stable unique identifiers', () => {
    expect(demoProducts).toHaveLength(60);
    expect(demoProducts.filter((product) => product.category.slug.startsWith('women-'))).toHaveLength(
      30,
    );
    expect(demoProducts.filter((product) => product.category.slug.startsWith('men-'))).toHaveLength(
      30,
    );

    expect(new Set(demoProducts.map((product) => product.id)).size).toBe(60);
    expect(new Set(demoProducts.map((product) => product.slug)).size).toBe(60);
  });

  it('matches the requested category distribution', () => {
    expect(categoryCount('women-dresses')).toBe(6);
    expect(categoryCount('women-blazers')).toBe(4);
    expect(categoryCount('women-trousers')).toBe(4);
    expect(categoryCount('women-tops')).toBe(4);
    expect(categoryCount('women-skirts')).toBe(3);
    expect(categoryCount('women-knitwear')).toBe(3);
    expect(categoryCount('women-outerwear')).toBe(3);
    expect(categoryCount('women-denim')).toBe(3);

    expect(categoryCount('men-shirts')).toBe(5);
    expect(categoryCount('men-trousers')).toBe(5);
    expect(categoryCount('men-blazers')).toBe(4);
    expect(categoryCount('men-tshirts')).toBe(4);
    expect(categoryCount('men-knitwear')).toBe(4);
    expect(categoryCount('men-outerwear')).toBe(4);
    expect(categoryCount('men-denim')).toBe(4);
  });

  it('uses initials placeholders instead of product photography', () => {
    for (const product of demoProducts) {
      expect(product.images).toEqual([]);
    }
  });

  it('provides realistic prices, sizes, colours, variants and stock', () => {
    for (const product of demoProducts) {
      expect(product.price).toBeGreaterThanOrEqual(35);
      expect(product.price).toBeLessThanOrEqual(450);
      expect(product.currency).toBe('EUR');
      expect(product.sizes.length).toBeGreaterThan(0);
      expect(product.colors.length).toBeGreaterThan(0);
      expect(product.variants.length).toBeGreaterThan(0);
      expect(product.stock).toBeGreaterThan(0);
      expect(product.status).toBe('ACTIVE');

      for (const variant of product.variants) {
        expect(variant.stockQuantity).toBeGreaterThanOrEqual(0);
        expect(variant.price).toBe(product.price);
      }
    }
  });

  it('exposes the women and men top-level categories plus subcategories', () => {
    const slugs = demoCategories.map((category) => category.slug);

    expect(slugs).toContain('women');
    expect(slugs).toContain('men');
    expect(slugs).toContain('women-dresses');
    expect(slugs).toContain('men-shirts');
  });

  it('filters, searches, sorts and paginates locally', () => {
    const women = queryDemoProducts({ category: 'women', sort: 'featured', page: 1, limit: 60 });
    const men = queryDemoProducts({ category: 'men', sort: 'featured', page: 1, limit: 60 });

    expect(women.meta.total).toBe(30);
    expect(men.meta.total).toBe(30);
    expect(women.data.every((product) => product.category.slug.startsWith('women-'))).toBe(true);
    expect(men.data.every((product) => product.category.slug.startsWith('men-'))).toBe(true);

    const dresses = queryDemoProducts({
      category: 'women-dresses',
      sort: 'price_asc',
      page: 1,
      limit: 12,
    });

    expect(dresses.meta.total).toBe(6);
    const prices = dresses.data.map((product) => product.price);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));

    const searched = queryDemoProducts({ search: 'silk', sort: 'featured', page: 1, limit: 12 });
    expect(searched.meta.total).toBeGreaterThan(0);
    expect(
      searched.data.every((product) =>
        `${product.name} ${product.description}`.toLowerCase().includes('silk'),
      ),
    ).toBe(true);

    const sizeFiltered = queryDemoProducts({
      category: 'men',
      size: 'XL',
      sort: 'featured',
      page: 1,
      limit: 60,
    });
    expect(sizeFiltered.data.every((product) => product.sizes.includes('XL'))).toBe(true);

    const firstPage = queryDemoProducts({ sort: 'price_asc', page: 1, limit: 12 });
    const secondPage = queryDemoProducts({ sort: 'price_asc', page: 2, limit: 12 });
    expect(firstPage.meta.totalPages).toBe(5);
    expect(firstPage.data).toHaveLength(12);
    expect(secondPage.data).toHaveLength(12);
    expect(firstPage.data[0]?.id).not.toBe(secondPage.data[0]?.id);
  });
});
