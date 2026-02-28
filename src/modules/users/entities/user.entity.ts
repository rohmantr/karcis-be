import {
  Collection,
  Entity,
  EntityRepositoryType,
  OneToMany,
  Property,
} from '@mikro-orm/core';
import { BaseEntity } from '../../../common/database/base.entity';
import { Booking } from '../../booking/entities/booking.entity';
import { UserRepository } from '../repositories/user.repository';

@Entity({ repository: () => UserRepository })
export class User extends BaseEntity {
  [EntityRepositoryType]?: UserRepository;
  @Property({ unique: true })
  email!: string;

  @Property({ hidden: true })
  password!: string;

  @Property({ nullable: true })
  refreshToken?: string;

  @Property({ nullable: true })
  refreshTokenExpiresAt?: Date;

  @OneToMany(() => Booking, (booking) => booking.user)
  bookings = new Collection<Booking>(this);
}
