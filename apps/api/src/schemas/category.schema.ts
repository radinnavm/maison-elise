import { z } from 'zod';

const slugSchema = z
  .string()
  .trim()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    error: 'Slug must contain lowercase letters, numbers and hyphens only.',
  });

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, { error: 'Name is required.' }).max(120),
  slug: slugSchema.optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
