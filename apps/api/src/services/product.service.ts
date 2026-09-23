import type { ProductDto, ProductListResponse } from '@maison-elise/shared';
import type { Prisma } from '@prisma/client';

import { toProductDto } from '../mappers/product.mapper.js';
import { categoryRepository } from '../repositories/category.repository.js';
import { productRepository } from '../repositories/product.repository.js';
import type { CreateProductInput, UpdateProductInput } from '../schemas/product.schema.js';
import type { ProductListQueryInput } from '../schemas/query.schema.js';
import { ConflictError, NotFoundError, ValidationError } from '../utils/errors.js';
import { buildPaginationMeta, parsePagination } from '../utils/pagination.js';
import { buildProductOrderBy, buildProductWhere } from '../utils/productQuery.js';
import { slugify } from '../utils/slugify.js';

async function ensureCategoryExists(categoryId: string): Promise<void> {
  const category = await categoryRepository.findById(categoryId);

  if (!category) {
    throw new ValidationError('The selected category does not exist.');
  }
}

async function assertSlugAvailable(slug: string, ignoreId?: string): Promise<void> {
  const existing = await productRepository.findBySlug(slug);

  if (existing && existing.id !== ignoreId) {
    throw new ConflictError('A product with this slug already exists.', 'SLUG_IN_USE');
  }
}

async function generateUniqueSlug(base: string): Promise<string> {
  let candidate = base;
  let suffix = 1;

  for (;;) {
    const existing = await productRepository.findBySlug(candidate);

    if (!existing) {
      return candidate;
    }

    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
}

export const productService = {
  async list(query: ProductListQueryInput): Promise<ProductListResponse> {
    const pagination = parsePagination(query.page, query.limit);
    const where = buildProductWhere(query);
    const orderBy = buildProductOrderBy(query.sort);

    const { items, total } = await productRepository.findMany({
      where,
      orderBy,
      skip: pagination.skip,
      take: pagination.take,
    });

    return {
      data: items.map(toProductDto),
      meta: buildPaginationMeta(total, pagination.page, pagination.limit),
    };
  },

  async getBySlug(slug: string): Promise<ProductDto> {
    const product = await productRepository.findBySlug(slug);

    if (!product || product.status !== 'ACTIVE') {
      throw new NotFoundError('Product not found.', 'PRODUCT_NOT_FOUND');
    }

    return toProductDto(product);
  },

  async create(input: CreateProductInput): Promise<ProductDto> {
    await ensureCategoryExists(input.categoryId);

    const slug = input.slug
      ? (await assertSlugAvailable(input.slug), input.slug)
      : await generateUniqueSlug(slugify(input.name));

    if (!slug) {
      throw new ValidationError('A slug could not be generated from the name.');
    }

    const data: Prisma.ProductCreateInput = {
      name: input.name,
      slug,
      description: input.description,
      category: { connect: { id: input.categoryId } },
      basePrice: input.basePrice,
      currency: input.currency,
      status: input.status,
      isNew: input.isNew,
      isFeatured: input.isFeatured,
      images: {
        create: input.images.map((image) => ({
          url: image.url,
          alt: image.alt,
          sortOrder: image.sortOrder,
        })),
      },
      variants: {
        create: input.variants.map((variant) => ({
          sku: variant.sku,
          size: variant.size,
          color: variant.color,
          stockQuantity: variant.stockQuantity,
          price: variant.price ?? input.basePrice,
        })),
      },
    };

    const product = await productRepository.create(data);
    return toProductDto(product);
  },

  async update(id: string, input: UpdateProductInput): Promise<ProductDto> {
    const existing = await productRepository.findById(id);

    if (!existing) {
      throw new NotFoundError('Product not found.', 'PRODUCT_NOT_FOUND');
    }

    if (input.categoryId !== undefined) {
      await ensureCategoryExists(input.categoryId);
    }

    const data: Prisma.ProductUpdateInput = {};

    if (input.name !== undefined) {
      data.name = input.name;
    }

    if (input.description !== undefined) {
      data.description = input.description;
    }

    if (input.categoryId !== undefined) {
      data.category = { connect: { id: input.categoryId } };
    }

    if (input.basePrice !== undefined) {
      data.basePrice = input.basePrice;
    }

    if (input.currency !== undefined) {
      data.currency = input.currency;
    }

    if (input.status !== undefined) {
      data.status = input.status;
    }

    if (input.isNew !== undefined) {
      data.isNew = input.isNew;
    }

    if (input.isFeatured !== undefined) {
      data.isFeatured = input.isFeatured;
    }

    if (input.slug !== undefined) {
      await assertSlugAvailable(input.slug, id);
      data.slug = input.slug;
    }

    if (input.images !== undefined) {
      data.images = {
        deleteMany: {},
        create: input.images.map((image) => ({
          url: image.url,
          alt: image.alt,
          sortOrder: image.sortOrder,
        })),
      };
    }

    if (input.variants !== undefined) {
      const fallbackPrice = Number(existing.basePrice);
      const incomingKeys = new Set(
        input.variants.map((variant) => `${variant.size}::${variant.color}`),
      );
      const removedIds = existing.variants
        .filter((variant) => !incomingKeys.has(`${variant.size}::${variant.color}`))
        .map((variant) => variant.id);

      // Upsert by (size, colour) so unchanged variants keep their IDs, which keeps
      // historical OrderItem snapshots stable. Only removed combinations are deleted.
      data.variants = {
        ...(removedIds.length > 0 ? { deleteMany: { id: { in: removedIds } } } : {}),
        upsert: input.variants.map((variant) => ({
          where: {
            productId_size_color: { productId: id, size: variant.size, color: variant.color },
          },
          update: {
            sku: variant.sku,
            stockQuantity: variant.stockQuantity,
            price: variant.price ?? fallbackPrice,
          },
          create: {
            sku: variant.sku,
            size: variant.size,
            color: variant.color,
            stockQuantity: variant.stockQuantity,
            price: variant.price ?? fallbackPrice,
          },
        })),
      };
    }

    const product = await productRepository.update(id, data);
    return toProductDto(product);
  },

  async remove(id: string): Promise<void> {
    const existing = await productRepository.findById(id);

    if (!existing) {
      throw new NotFoundError('Product not found.', 'PRODUCT_NOT_FOUND');
    }

    await productRepository.delete(id);
  },
};
