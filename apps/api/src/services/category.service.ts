import type { CategoryDto } from '@maison-elise/shared';
import type { Prisma } from '@prisma/client';

import { toCategoryDto } from '../mappers/category.mapper.js';
import { categoryRepository } from '../repositories/category.repository.js';
import type { CreateCategoryInput, UpdateCategoryInput } from '../schemas/category.schema.js';
import { ConflictError, NotFoundError, ValidationError } from '../utils/errors.js';
import { slugify } from '../utils/slugify.js';

async function assertSlugAvailable(slug: string, ignoreId?: string): Promise<void> {
  const existing = await categoryRepository.findBySlug(slug);

  if (existing && existing.id !== ignoreId) {
    throw new ConflictError('A category with this slug already exists.', 'SLUG_IN_USE');
  }
}

async function generateUniqueSlug(base: string): Promise<string> {
  let candidate = base;
  let suffix = 1;

  for (;;) {
    const existing = await categoryRepository.findBySlug(candidate);

    if (!existing) {
      return candidate;
    }

    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
}

export const categoryService = {
  async list(): Promise<CategoryDto[]> {
    const categories = await categoryRepository.findManyWithActiveProducts();
    return categories.map(toCategoryDto);
  },

  async getBySlug(slug: string): Promise<CategoryDto> {
    const category = await categoryRepository.findBySlug(slug);

    if (!category) {
      throw new NotFoundError('Category not found.', 'CATEGORY_NOT_FOUND');
    }

    return toCategoryDto(category);
  },

  async create(input: CreateCategoryInput): Promise<CategoryDto> {
    const slug = input.slug
      ? (await assertSlugAvailable(input.slug), input.slug)
      : await generateUniqueSlug(slugify(input.name));

    if (!slug) {
      throw new ValidationError('A slug could not be generated from the name.');
    }

    const category = await categoryRepository.create({ name: input.name, slug });
    return toCategoryDto(category);
  },

  async update(id: string, input: UpdateCategoryInput): Promise<CategoryDto> {
    const existing = await categoryRepository.findById(id);

    if (!existing) {
      throw new NotFoundError('Category not found.', 'CATEGORY_NOT_FOUND');
    }

    const data: Prisma.CategoryUpdateInput = {};

    if (input.name !== undefined) {
      data.name = input.name;
    }

    if (input.slug !== undefined) {
      await assertSlugAvailable(input.slug, id);
      data.slug = input.slug;
    }

    const category = await categoryRepository.update(id, data);
    return toCategoryDto(category);
  },

  async remove(id: string): Promise<void> {
    const existing = await categoryRepository.findById(id);

    if (!existing) {
      throw new NotFoundError('Category not found.', 'CATEGORY_NOT_FOUND');
    }

    await categoryRepository.delete(id);
  },
};
