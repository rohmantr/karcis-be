import { z } from 'zod';

export const RefreshTokenSchema = z.object({
  refreshToken: z.string(),
});

export type RefreshTokenDtoType = z.infer<typeof RefreshTokenSchema>;

export class RefreshTokenDto implements RefreshTokenDtoType {
  refreshToken!: string;
}
