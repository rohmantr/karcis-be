import {
  Entity,
  EntityRepositoryType,
  ManyToOne,
  Property,
} from '@mikro-orm/core';
import { BaseEntity } from '../../../common/database/base.entity';
import { BookingStatus } from '../../../common/entities/enums';
import { User } from '../../users/entities/user.entity';
import { Seat } from '../../event/entities/seat.entity';
import { BookingRepository } from '../repositories/booking.repository';

@Entity({ repository: () => BookingRepository })
export class Booking extends BaseEntity {
  [EntityRepositoryType]?: BookingRepository;
  @ManyToOne(() => User)
  user!: User;

  @ManyToOne(() => Seat)
  seat!: Seat;

  @Property({ type: 'string' })
  status: BookingStatus = BookingStatus.PENDING;

  @Property()
  expiresAt!: Date; // Deadline pembayaran
}
