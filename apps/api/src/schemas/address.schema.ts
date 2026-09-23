import { z } from 'zod';

const nameSchema = z.string().trim().min(1, { error: 'This field is required.' }).max(80);
const phoneSchema = z
  .string()
  .trim()
  .min(4, { error: 'Enter a valid phone number.' })
  .max(30, { error: 'Phone number is too long.' });

export const addressInputSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  phone: phoneSchema,
  addressLine1: z.string().trim().min(1, { error: 'Address is required.' }).max(200),
  addressLine2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(1, { error: 'City is required.' }).max(120),
  postalCode: z.string().trim().min(1, { error: 'Postal code is required.' }).max(20),
  countryCode: z.string().trim().length(2, { error: 'Use a 2-letter country code.' }).toUpperCase(),
  isDefault: z.boolean().optional(),
});

export const updateAddressSchema = addressInputSchema.partial();

export type AddressInput = z.infer<typeof addressInputSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
