import { useMemo } from 'react';

import type {
  CategoryDto,
  ProductDto,
  ProductListResponse,
  SortOption,
} from '@maison-elise/shared';

import { useGetCategoriesQuery } from '@/api/categoriesApi';
import { useGetProductBySlugQuery, useGetProductsQuery } from '@/api/productsApi';
import { env } from '@/config/env';
import type { ProductQueryParams } from '@/types/catalog';

import { demoCategories, demoProductBySlug, demoProducts } from './demoProducts';
import type { DemoProduct } from './demoProducts';

export interface CatalogProductsResult {
  data?: ProductListResponse;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error?: unknown;
  refetch: () => void;
}

export interface CatalogProductResult {
  data?: ProductDto;
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
}

export interface CatalogCategoriesResult {
  data: CategoryDto[];
  isLoading: boolean;
}

function matchesCategory(product: DemoProduct, category: string | undefined): boolean {
  if (!category) {
    return true;
  }

  if (category === 'women' || category === 'men') {
    return product.category.slug.startsWith(`${category}-`);
  }

  return product.category.slug === category;
}

function compareProducts(a: DemoProduct, b: DemoProduct, sort: SortOption): number {
  switch (sort) {
    case 'newest':
      return Number(b.isNew) - Number(a.isNew);
    case 'price_asc':
      return a.price - b.price;
    case 'price_desc':
      return b.price - a.price;
    case 'name_asc':
      return a.name.localeCompare(b.name);
    case 'featured':
    default:
      return Number(b.isFeatured) - Number(a.isFeatured);
  }
}

function searchMatches(product: DemoProduct, search: string): boolean {
  const term = search.toLowerCase();
  return [product.name, product.description, product.shortDescription, product.category.name]
    .join(' ')
    .toLowerCase()
    .includes(term);
}

export function queryDemoProducts(query: ProductQueryParams): ProductListResponse {
  const filtered = demoProducts.filter((product) => {
    if (!matchesCategory(product, query.category)) {
      return false;
    }

    if (query.size && !product.sizes.includes(query.size)) {
      return false;
    }

    if (
      query.color &&
      !product.colors.some((color) => color.toLowerCase() === query.color?.toLowerCase())
    ) {
      return false;
    }

    if (query.minPrice !== undefined && product.price < query.minPrice) {
      return false;
    }

    if (query.maxPrice !== undefined && product.price > query.maxPrice) {
      return false;
    }

    if (query.search && !searchMatches(product, query.search)) {
      return false;
    }

    return true;
  });

  const sorted = [...filtered].sort((a, b) => compareProducts(a, b, query.sort));
  const limit = Math.max(1, query.limit);
  const page = Math.max(1, query.page);
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;

  return {
    data: sorted.slice(start, start + limit),
    meta: { page, limit, total, totalPages },
  };
}

export function useCatalogProducts(query: ProductQueryParams): CatalogProductsResult {
  const demoData = useMemo(
    () => (env.demoCatalog ? queryDemoProducts(query) : undefined),
    [query],
  );
  const api = useGetProductsQuery(query, { skip: env.demoCatalog });

  if (env.demoCatalog) {
    return {
      data: demoData,
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: () => undefined,
    };
  }

  return {
    data: api.data,
    isLoading: api.isLoading,
    isFetching: api.isFetching,
    isError: api.isError,
    error: api.error,
    refetch: () => {
      void api.refetch();
    },
  };
}

export function useCatalogProduct(slug?: string): CatalogProductResult {
  const demoProduct = useMemo(
    () => (env.demoCatalog && slug ? demoProductBySlug.get(slug) : undefined),
    [slug],
  );
  const api = useGetProductBySlugQuery(slug ?? '', { skip: !slug || env.demoCatalog });

  if (env.demoCatalog) {
    const missing = Boolean(slug) && !demoProduct;

    return {
      data: demoProduct,
      isLoading: false,
      isError: missing,
      error: missing ? { status: 404, message: 'Product not found.' } : undefined,
    };
  }

  return {
    data: api.data,
    isLoading: api.isLoading,
    isError: api.isError,
    error: api.error,
  };
}

export function useCatalogCategories(): CatalogCategoriesResult {
  const api = useGetCategoriesQuery(undefined, { skip: env.demoCatalog });

  if (env.demoCatalog) {
    return { data: demoCategories, isLoading: false };
  }

  return { data: api.data ?? [], isLoading: api.isLoading };
}
