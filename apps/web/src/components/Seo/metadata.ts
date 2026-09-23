import type { Product } from '@/types/product';

export type SeoRobots = 'index' | 'noindex';

export interface SeoConfig {
  /** Full or page-level title. The brand suffix is added when missing. */
  title: string;
  description?: string;
  /** Path relative to the site origin, e.g. `/product/foo`. */
  canonicalPath?: string;
  robots?: SeoRobots;
  ogType?: 'website' | 'product';
  ogImage?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

export const SITE_NAME = 'Maison Élise';

const BRAND_SUFFIX = ` — ${SITE_NAME}`;

export function withBrandSuffix(title: string): string {
  return title.includes(SITE_NAME) ? title : `${title}${BRAND_SUFFIX}`;
}

export function truncate(text: string, max = 160): string {
  const normalized = text.replace(/\s+/g, ' ').trim();

  if (normalized.length <= max) {
    return normalized;
  }

  return `${normalized.slice(0, max - 1).trimEnd()}…`;
}

export function absoluteUrl(siteUrl: string, path: string): string {
  const base = siteUrl.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

/**
 * Schema.org Product data built only from server-authoritative fields. Ratings,
 * reviews, brand and shipping are intentionally omitted because they are unknown.
 */
export function buildProductJsonLd(product: Product, siteUrl: string): Record<string, unknown> {
  const url = absoluteUrl(siteUrl, `/product/${product.slug}`);
  const sku = product.variants[0]?.sku;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images.map((image) => image.url),
    ...(sku ? { sku } : {}),
    category: product.category.name,
    url,
    offers: {
      '@type': 'Offer',
      url,
      price: product.price.toFixed(2),
      priceCurrency: product.currency,
      availability:
        product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };
}

export function buildWebsiteJsonLd(siteUrl: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: absoluteUrl(siteUrl, '/'),
  };
}

export interface ShopSeoInput {
  categoryName?: string;
  categorySlug?: string;
  search?: string;
  size?: string;
  color?: string;
  minPrice?: number;
  maxPrice?: number;
  sort: string;
  page: number;
}

const DEFAULT_SORT_OPTION = 'featured';

export interface ShopSeo {
  title: string;
  canonicalPath: string;
  robots: SeoRobots;
}

/**
 * Shop/category SEO. The clean category (or `/shop`) URL is canonical; any
 * filter, search, non-default sort or pagination marks the page `noindex` so
 * faceted URLs never become indexable duplicates.
 */
export function buildShopSeo(input: ShopSeoInput): ShopSeo {
  const hasFilterState =
    Boolean(input.search || input.size || input.color) ||
    input.minPrice !== undefined ||
    input.maxPrice !== undefined ||
    input.page > 1 ||
    input.sort !== DEFAULT_SORT_OPTION;

  return {
    title: input.categoryName ? `${input.categoryName} — Shop` : 'Shop the Collection',
    canonicalPath: input.categorySlug ? `/shop/${input.categorySlug}` : '/shop',
    robots: hasFilterState ? 'noindex' : 'index',
  };
}
