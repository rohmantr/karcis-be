import { EntityRepository } from '@mikro-orm/postgresql';
import { RefreshToken } from '../entities/refresh-token.entity';

export class RefreshTokenRepository extends EntityRepository<RefreshToken> {
  async findValidByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    return this.findOne(
      {
        tokenHash,
        revokedAt: null,
        expiresAt: { $gt: new Date() },
      },
      { populate: ['user'] },
    );
  }

  async revokeAllByUserId(userId: string): Promise<number> {
    return this.nativeUpdate(
      { user: userId, revokedAt: null },
      { revokedAt: new Date() },
    );
  }

  async revokeByTokenHash(
    tokenHash: string,
    replacedByTokenId?: string,
  ): Promise<void> {
    await this.nativeUpdate(
      { tokenHash },
      { revokedAt: new Date(), replacedByToken: replacedByTokenId },
    );
  }
}
