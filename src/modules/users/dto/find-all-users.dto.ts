import { z } from 'zod';

export const FindAllUsersSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(10),
  offset: z.coerce.number().min(0).default(0),
  email: z.string().email().optional(),
  username: z.string().optional(),
});

export type FindAllUsersDto = z.infer<typeof FindAllUsersSchema>;
