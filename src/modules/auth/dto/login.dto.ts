import { z } from 'zod';

export const LoginDto = z.object({
  email: z.string().email('Email is not valid'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

export type LoginDto = z.infer<typeof LoginDto>;
