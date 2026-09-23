import type { Prisma } from '@prisma/client';

import type { SortOption } from '@maison-elise/shared';

export interface ProductListQuery {
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

export function buildProductWhere(query: ProductListQuery): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {
    status: 'ACTIVE',
  };

  if (query.category) {
    where.category = { slug: query.category };
  }

  if (query.size || query.color) {
    where.variants = {
      some: {
        ...(query.size ? { size: query.size } : {}),
        ...(query.color ? { color: query.color } : {}),
      },
    };
  }

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    where.basePrice = {
      ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
      ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
    };
  }

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  return where;
}

const SORT_MAP: Record<SortOption, Prisma.ProductOrderByWithRelationInput[]> = {
  featured: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
  newest: [{ isNew: 'desc' }, { createdAt: 'desc' }],
  price_asc: [{ basePrice: 'asc' }],
  price_desc: [{ basePrice: 'desc' }],
  name_asc: [{ name: 'asc' }],
};

export function buildProductOrderBy(sort: SortOption): Prisma.ProductOrderByWithRelationInput[] {
  return SORT_MAP[sort] ?? SORT_MAP.featured;
}
