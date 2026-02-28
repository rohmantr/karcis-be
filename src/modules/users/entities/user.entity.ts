import {
  Collection,
  Entity,
  EntityRepositoryType,
  Enum,
  Index,
  OneToMany,
  Property,
} from '@mikro-orm/core';
import { BaseEntity } from '../../../common/database/base.entity';
import { UserRole } from '../../../common/entities/enums';
import type { Booking } from '../../booking/entities/booking.entity';
import type { RefreshToken } from '../../auth/entities/refresh-token.entity';
import { UserRepository } from '../repositories/user.repository';

@Entity({ repository: () => UserRepository })
export class User extends BaseEntity {
  [EntityRepositoryType]?: UserRepository;

  @Property({ length: 150 })
  name!: string;

  @Property({ length: 150, unique: true })
  email!: string;

  @Property({ length: 30, nullable: true })
  phone?: string;

  @Property({ hidden: true, columnType: 'text' })
  passwordHash!: string;

  @Enum({ items: () => UserRole, default: UserRole.USER, length: 20 })
  @Index({ name: 'idx_users_role' })
  role: UserRole = UserRole.USER;

  @Property({ default: true })
  isActive: boolean = true;

  @OneToMany({ entity: () => 'Booking', mappedBy: 'user' })
  bookings = new Collection<Booking>(this);

  @OneToMany({ entity: () => 'RefreshToken', mappedBy: 'user' })
  refreshTokens = new Collection<RefreshToken>(this);
}
