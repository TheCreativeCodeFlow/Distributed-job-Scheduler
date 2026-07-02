import { z } from 'zod';

export const registerSchema = {
  body: z.object({
    email: z
      .string()
      .email('Must be a valid email address.')
      .transform((val) => val.toLowerCase().trim()),
    name: z.string().min(1, 'Name cannot be empty.').optional(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long.')
      .refine(
        (val) => /[A-Z]/.test(val),
        'Password must contain at least one uppercase letter.',
      )
      .refine(
        (val) => /[a-z]/.test(val),
        'Password must contain at least one lowercase letter.',
      )
      .refine(
        (val) => /[0-9]/.test(val),
        'Password must contain at least one number.',
      ),
  }),
};

export const loginSchema = {
  body: z.object({
    email: z
      .string()
      .email('Must be a valid email address.')
      .transform((val) => val.toLowerCase().trim()),
    password: z.string().min(1, 'Password is required.'),
  }),
};

export const refreshSchema = {
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required.'),
  }),
};
