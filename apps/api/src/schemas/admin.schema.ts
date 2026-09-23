import { z } from 'zod';

const pageSchema = z.coerce.number().int().min(1).default(1);
const limitSchema = z.coerce.number().int().min(1).max(100).default(20);

export const adminOrderListQuerySchema = z.object({
  page: pageSchema,
  limit: limitSchema,
  search: z.string().trim().min(1).max(200).optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED']).optional(),
  paymentStatus: z.enum(['UNPAID', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED']).optional(),
});

export const adminProductListQuerySchema = z.object({
  page: pageSchema,
  limit: limitSchema,
  search: z.string().trim().min(1).max(200).optional(),
  category: z.string().trim().min(1).optional(),
  status: z.enum(['ACTIVE', 'DRAFT', 'ARCHIVED']).optional(),
  sort: z.enum(['newest', 'name_asc', 'price_asc', 'price_desc']).default('newest'),
});

export const adminInventoryListQuerySchema = z.object({
  page: pageSchema,
  limit: limitSchema,
  search: z.string().trim().min(1).max(200).optional(),
  stock: z.enum(['all', 'low', 'out']).default('all'),
});

export const adminCustomerListQuerySchema = z.object({
  page: pageSchema,
  limit: limitSchema,
  search: z.string().trim().min(1).max(200).optional(),
});

export const orderStatusUpdateSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED']),
});

export const inventoryUpdateSchema = z.object({
  stockQuantity: z.coerce
    .number({ error: 'Stock quantity is required.' })
    .int({ error: 'Stock quantity must be a whole number.' })
    .min(0, { error: 'Stock quantity cannot be negative.' })
    .max(1_000_000, { error: 'Stock quantity is too large.' }),
});

export type AdminOrderListQuery = z.infer<typeof adminOrderListQuerySchema>;
export type AdminProductListQuery = z.infer<typeof adminProductListQuerySchema>;
export type AdminInventoryListQuery = z.infer<typeof adminInventoryListQuerySchema>;
export type AdminCustomerListQuery = z.infer<typeof adminCustomerListQuerySchema>;
