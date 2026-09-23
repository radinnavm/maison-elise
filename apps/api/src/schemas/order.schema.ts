import { z } from 'zod';

export const createOrderSchema = z.object({
  addressId: z.uuid({ error: 'A valid shipping address is required.' }),
});

export const orderListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type OrderListQueryInput = z.infer<typeof orderListQuerySchema>;
