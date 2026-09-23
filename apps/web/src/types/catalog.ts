import type { ProductListResponse, SortOption } from '@maison-elise/shared';

export type { ProductListResponse, SortOption };

export interface CatalogFilters {
  category?: string;
  size?: string;
  color?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sort: SortOption;
  page: number;
}

export type ProductFilters = CatalogFilters;

export interface ProductQueryParams {
  category?: string;
  size?: string;
  color?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sort: SortOption;
  page: number;
  limit: number;
}
