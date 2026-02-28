import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

export type RegisterDtoType = z.infer<typeof RegisterSchema>;

export class RegisterDto implements RegisterDtoType {
  email!: string;
  password!: string;
}
