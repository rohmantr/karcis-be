import { z } from 'zod';

export const RefreshTokenDto = z.object({
  refreshToken: z.string(),
});

export type RefreshTokenDto = z.infer<typeof RefreshTokenDto>;
