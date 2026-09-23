import { z } from 'zod';

const emailSchema = z.preprocess(
  (value) => (typeof value === 'string' ? value.trim().toLowerCase() : value),
  z.email({ error: 'Enter a valid email address.' }),
);

export const registerSchema = z
  .object({
    name: z.string().trim().min(1).max(160).optional(),
    firstName: z.string().trim().min(1, { error: 'First name is required.' }).max(80).optional(),
    lastName: z.string().trim().min(1, { error: 'Last name is required.' }).max(80).optional(),
    email: emailSchema,
    password: z
      .string()
      .min(8, { error: 'Password must be at least 8 characters.' })
      .max(128, { error: 'Password must be at most 128 characters.' }),
  })
  .refine((value) => Boolean(value.name) || Boolean(value.firstName && value.lastName), {
    error: 'A name is required.',
    path: ['name'],
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { error: 'Password is required.' }),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
