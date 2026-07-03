import { z } from 'zod';

export const registerSchema = {
  body: z.object({
    email: z
      .string()
      .email('Must be a valid email address.')
      .max(254, 'Email address is too long.')
      .transform((val) => val.toLowerCase().trim()),
    name: z
      .string()
      .min(1, 'Name cannot be empty.')
      .max(100, 'Name is too long.')
      .optional(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long.')
      // bcrypt silently truncates at 72 bytes — cap to prevent DoS
      .max(72, 'Password must not exceed 72 characters.')
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
      .max(254, 'Email address is too long.')
      .transform((val) => val.toLowerCase().trim()),
    // Keep login password validation minimal to avoid lockout on policy changes
    password: z
      .string()
      .min(1, 'Password is required.')
      .max(72, 'Password is too long.'),
  }),
};

export const refreshSchema = {
  body: z.object({
    // Optional — refresh token can also come from HttpOnly cookie
    refreshToken: z.string().min(1, 'Refresh token is required.').optional(),
  }),
};
