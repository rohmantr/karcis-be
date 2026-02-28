import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('Email is not valid'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

export type LoginDtoType = z.infer<typeof LoginSchema>;

export class LoginDto implements LoginDtoType {
  email!: string;
  password!: string;
}
