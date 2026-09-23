import { describe, expect, it } from 'vitest';

import { makeProduct } from '@/test/factories';

import {
  absoluteUrl,
  buildProductJsonLd,
  buildShopSeo,
  buildWebsiteJsonLd,
  truncate,
  withBrandSuffix,
} from './metadata';

describe('seo metadata helpers', () => {
  it('appends the brand suffix only once', () => {
    expect(withBrandSuffix('Shop')).toBe('Shop — Maison Élise');
    expect(withBrandSuffix('Maison Élise')).toBe('Maison Élise');
  });

  it('truncates long descriptions to a meta-friendly length', () => {
    expect(truncate('a'.repeat(300)).length).toBeLessThanOrEqual(160);
    expect(truncate('short text')).toBe('short text');
  });

  it('builds absolute urls without doubling slashes', () => {
    expect(absoluteUrl('https://shop.test/', '/product/x')).toBe('https://shop.test/product/x');
    expect(absoluteUrl('https://shop.test', 'shop')).toBe('https://shop.test/shop');
  });

  it('builds Product structured data from known fields only', () => {
    const jsonLd = buildProductJsonLd(makeProduct(), 'https://shop.test');
    const offers = jsonLd.offers as Record<string, unknown>;

    expect(jsonLd['@context']).toBe('https://schema.org');
    expect(jsonLd['@type']).toBe('Product');
    expect(jsonLd.name).toBe('Aurelia Satin Dress');
    expect(jsonLd.url).toBe('https://shop.test/product/aurelia-satin-dress');
    expect(jsonLd.sku).toBe('SKU-M-BLK');
    expect(offers).toMatchObject({
      '@type': 'Offer',
      price: '189.00',
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
    });

    // Never invent data that is not server-authoritative.
    expect(jsonLd).not.toHaveProperty('aggregateRating');
    expect(jsonLd).not.toHaveProperty('review');
    expect(jsonLd).not.toHaveProperty('brand');
  });

  it('marks out-of-stock products as OutOfStock', () => {
    const jsonLd = buildProductJsonLd(makeProduct({ stock: 0 }), 'https://shop.test');
    const offers = jsonLd.offers as Record<string, unknown>;

    expect(offers.availability).toBe('https://schema.org/OutOfStock');
  });

  it('builds WebSite structured data', () => {
    expect(buildWebsiteJsonLd('https://shop.test')).toMatchObject({
      '@type': 'WebSite',
      url: 'https://shop.test/',
    });
  });
});

describe('buildShopSeo', () => {
  const base = { sort: 'featured', page: 1 };

  it('makes the clean shop and category pages indexable', () => {
    expect(buildShopSeo(base)).toEqual({
      title: 'Shop the Collection',
      canonicalPath: '/shop',
      robots: 'index',
    });

    expect(buildShopSeo({ ...base, categoryName: 'Dresses', categorySlug: 'dresses' })).toEqual({
      title: 'Dresses — Shop',
      canonicalPath: '/shop/dresses',
      robots: 'index',
    });
  });

  it.each([
    { search: 'silk' },
    { size: 'M' },
    { color: 'Black' },
    { minPrice: 100 },
    { maxPrice: 500 },
    { page: 2 },
    { sort: 'price_asc' },
  ])('marks faceted/paginated shop pages noindex (%o)', (override) => {
    expect(buildShopSeo({ ...base, ...override }).robots).toBe('noindex');
  });
});
