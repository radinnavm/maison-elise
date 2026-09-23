import { z } from 'zod';

export const productListQuerySchema = z.object({
  category: z.string().trim().min(1).optional(),
  size: z.string().trim().min(1).optional(),
  color: z.string().trim().min(1).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  search: z.string().trim().min(1).max(200).optional(),
  sort: z.enum(['featured', 'newest', 'price_asc', 'price_desc', 'name_asc']).default('featured'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(12),
});

export type ProductListQueryInput = z.infer<typeof productListQuerySchema>;
