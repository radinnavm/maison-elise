import type { Prisma } from '@prisma/client';

import { prisma } from '../config/prisma.js';

export const productInclude = {
  category: true,
  images: { orderBy: { sortOrder: 'asc' } },
  variants: { orderBy: [{ size: 'asc' }, { color: 'asc' }] },
} satisfies Prisma.ProductInclude;

export type ProductWithRelations = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

export interface FindManyProductsParams {
  where: Prisma.ProductWhereInput;
  orderBy: Prisma.ProductOrderByWithRelationInput[];
  skip: number;
  take: number;
}

export const productRepository = {
  async findMany(
    params: FindManyProductsParams,
  ): Promise<{ items: ProductWithRelations[]; total: number }> {
    const [items, total] = await prisma.$transaction([
      prisma.product.findMany({
        where: params.where,
        orderBy: params.orderBy,
        skip: params.skip,
        take: params.take,
        include: productInclude,
      }),
      prisma.product.count({ where: params.where }),
    ]);

    return { items, total };
  },

  findBySlug(slug: string): Promise<ProductWithRelations | null> {
    return prisma.product.findUnique({ where: { slug }, include: productInclude });
  },

  findById(id: string): Promise<ProductWithRelations | null> {
    return prisma.product.findUnique({ where: { id }, include: productInclude });
  },

  create(data: Prisma.ProductCreateInput): Promise<ProductWithRelations> {
    return prisma.product.create({ data, include: productInclude });
  },

  update(id: string, data: Prisma.ProductUpdateInput): Promise<ProductWithRelations> {
    return prisma.product.update({ where: { id }, data, include: productInclude });
  },

  delete(id: string): Promise<{ id: string }> {
    return prisma.product.delete({ where: { id }, select: { id: true } });
  },
};
