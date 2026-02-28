import {
  Entity,
  EntityRepositoryType,
  Index,
  ManyToOne,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { randomUUID } from 'crypto';
import { User } from '../../users/entities/user.entity';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';

@Entity({ repository: () => RefreshTokenRepository })
export class RefreshToken {
  [EntityRepositoryType]?: RefreshTokenRepository;

  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id: string = randomUUID();

  @ManyToOne(() => User, { deleteRule: 'cascade' })
  @Index({ name: 'idx_refresh_user' })
  user!: User;

  @Property({ columnType: 'text', unique: true })
  tokenHash!: string;

  @Property()
  @Index({ name: 'idx_refresh_expires' })
  expiresAt!: Date;

  @Property()
  createdAt: Date = new Date();

  @Property({ nullable: true })
  revokedAt?: Date;

  @Property({ type: 'uuid', nullable: true })
  replacedByToken?: string;

  @Property({ length: 255, nullable: true })
  deviceInfo?: string;

  @Property({ length: 50, nullable: true })
  ipAddress?: string;
}
