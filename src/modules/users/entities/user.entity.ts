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

  @OneToMany(() => Booking, (booking) => booking.user)
  bookings = new Collection<Booking>(this);
}
