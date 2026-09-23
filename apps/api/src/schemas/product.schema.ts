import { z } from 'zod';

const productStatusSchema = z.enum(['ACTIVE', 'DRAFT', 'ARCHIVED']);

const productImageSchema = z.object({
  url: z.url({ error: 'Image URL must be a valid URL.' }),
  alt: z.string().trim().max(200).default(''),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

const productVariantSchema = z.object({
  sku: z.string().trim().min(1, { error: 'SKU is required.' }).max(64),
  size: z.string().trim().min(1, { error: 'Size is required.' }).max(40),
  color: z.string().trim().min(1, { error: 'Colour is required.' }).max(40),
  stockQuantity: z.coerce.number().int().min(0).default(0),
  price: z.coerce
    .number()
    .positive({ error: 'Variant price must be greater than zero.' })
    .optional(),
});

export const createProductSchema = z.object({
  name: z.string().trim().min(1, { error: 'Name is required.' }).max(200),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      error: 'Slug must contain lowercase letters, numbers and hyphens only.',
    })
    .optional(),
  description: z.string().trim().min(1, { error: 'Description is required.' }).max(5000),
  categoryId: z.uuid({ error: 'A valid category is required.' }),
  basePrice: z.coerce.number().positive({ error: 'Base price must be greater than zero.' }),
  currency: z.string().trim().length(3).toUpperCase().default('EUR'),
  status: productStatusSchema.default('ACTIVE'),
  isNew: z.coerce.boolean().default(false),
  isFeatured: z.coerce.boolean().default(false),
  images: z.array(productImageSchema).default([]),
  variants: z.array(productVariantSchema).default([]),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
