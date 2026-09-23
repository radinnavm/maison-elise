import { z } from 'zod';

const quantitySchema = z.coerce
  .number({ error: 'Quantity is required.' })
  .int({ error: 'Quantity must be a whole number.' });

export const addCartItemSchema = z.object({
  variantId: z.uuid({ error: 'A valid variant is required.' }),
  quantity: quantitySchema.default(1),
});

export const updateCartItemSchema = z.object({
  quantity: quantitySchema,
});

export const mergeCartSchema = z.object({
  items: z
    .array(
      z.object({
        variantId: z.uuid({ error: 'A valid variant is required.' }),
        quantity: quantitySchema,
      }),
    )
    .max(100, { error: 'Too many items to merge.' })
    .default([]),
});

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type MergeCartInput = z.infer<typeof mergeCartSchema>;
