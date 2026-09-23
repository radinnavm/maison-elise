import type { Category } from '@prisma/client';

import type { CategoryDto } from '@maison-elise/shared';

export function toCategoryDto(category: Category): CategoryDto {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
  };
}
