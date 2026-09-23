import { PRODUCT_COLORS } from '@/data/colors';
import { SIZES } from '@/data/sizes';
import type { CatalogFilters, ProductQueryParams, SortOption } from '@/types/catalog';

export const DEFAULT_SORT: SortOption = 'featured';
export const PAGE_SIZE = 12;

const SORT_OPTIONS: SortOption[] = ['featured', 'newest', 'price_asc', 'price_desc', 'name_asc'];

export const sortLabels: Record<SortOption, string> = {
  featured: 'Featured',
  newest: 'Newest',
  price_asc: 'Price: Low to High',
  price_desc: 'Price: High to Low',
  name_asc: 'Name: A–Z',
};

export function isSortOption(value: string): value is SortOption {
  return (SORT_OPTIONS as string[]).includes(value);
}

export function sortOptionEntries(): { value: SortOption; label: string }[] {
  return SORT_OPTIONS.map((value) => ({ value, label: sortLabels[value] }));
}

function parsePrice(value: string | null): number | undefined {
  if (value === null) {
    return undefined;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function parsePage(value: string | null): number {
  if (value === null) {
    return 1;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 1 ? parsed : 1;
}

export function parseFilters(searchParams: URLSearchParams, categorySlug?: string): CatalogFilters {
  const queryCategory = searchParams.get('category');
  const category = categorySlug ?? queryCategory ?? undefined;

  const sizeParam = searchParams.get('size')?.toUpperCase();
  const colorParam = searchParams.get('color');
  const sortParam = searchParams.get('sort');

  const filters: CatalogFilters = {
    sort: sortParam && isSortOption(sortParam) ? sortParam : DEFAULT_SORT,
    page: parsePage(searchParams.get('page')),
  };

  if (category) {
    filters.category = category;
  }

  if (sizeParam && SIZES.includes(sizeParam)) {
    filters.size = sizeParam;
  }

  const colorMatch = colorParam
    ? PRODUCT_COLORS.find((color) => color.name.toLowerCase() === colorParam.toLowerCase())
    : undefined;

  if (colorMatch) {
    filters.color = colorMatch.name;
  }

  const minPrice = parsePrice(searchParams.get('minPrice'));
  const maxPrice = parsePrice(searchParams.get('maxPrice'));

  if (minPrice !== undefined) {
    filters.minPrice = minPrice;
  }

  if (maxPrice !== undefined) {
    filters.maxPrice = maxPrice;
  }

  const search = searchParams.get('search')?.trim();

  if (search) {
    filters.search = search;
  }

  return filters;
}

export function toSearchParams(filters: CatalogFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.size) {
    params.set('size', filters.size);
  }

  if (filters.color) {
    params.set('color', filters.color);
  }

  if (filters.minPrice !== undefined) {
    params.set('minPrice', String(filters.minPrice));
  }

  if (filters.maxPrice !== undefined) {
    params.set('maxPrice', String(filters.maxPrice));
  }

  if (filters.search) {
    params.set('search', filters.search);
  }

  if (filters.sort !== DEFAULT_SORT) {
    params.set('sort', filters.sort);
  }

  if (filters.page > 1) {
    params.set('page', String(filters.page));
  }

  return params;
}

export function buildProductQuery(filters: CatalogFilters, limit = PAGE_SIZE): ProductQueryParams {
  const query: ProductQueryParams = {
    sort: filters.sort,
    page: filters.page,
    limit,
  };

  if (filters.category) {
    query.category = filters.category;
  }

  if (filters.size) {
    query.size = filters.size;
  }

  if (filters.color) {
    query.color = filters.color;
  }

  if (filters.minPrice !== undefined) {
    query.minPrice = filters.minPrice;
  }

  if (filters.maxPrice !== undefined) {
    query.maxPrice = filters.maxPrice;
  }

  if (filters.search) {
    query.search = filters.search;
  }

  return query;
}

export function formatCount(count: number): string {
  return `${count} ${count === 1 ? 'piece' : 'pieces'}`;
}
