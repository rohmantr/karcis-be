import { z } from 'zod';

export const RegisterSchema = z.object({
  name: z.string().min(1, 'Name is required').max(150),
  email: z.string().email('Invalid email address'),
  phone: z.string().max(30).optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(
      /[^A-Za-z0-9]/,
      'Password must contain at least one special character',
    ),
});

export type RegisterDtoType = z.infer<typeof RegisterSchema>;

export class RegisterDto implements RegisterDtoType {
  name!: string;
  email!: string;
  phone?: string;
  password!: string;
}
