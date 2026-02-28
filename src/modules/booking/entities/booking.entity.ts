import {
  Entity,
  EntityRepositoryType,
  ManyToOne,
  Property,
} from '@mikro-orm/core';
import { BaseEntity } from '../../../common/database/base.entity';
import { BookingStatus } from '../../../common/entities/enums';
import type { User } from '../../users/entities/user.entity';
import type { Seat } from '../../event/entities/seat.entity';
import { BookingRepository } from '../repositories/booking.repository';

@Entity({ repository: () => BookingRepository })
export class Booking extends BaseEntity {
  [EntityRepositoryType]?: BookingRepository;
  @ManyToOne({ entity: () => 'User' })
  user!: User;

  @ManyToOne({ entity: () => 'Seat' })
  seat!: Seat;

  @Property({ type: 'string' })
  status: BookingStatus = BookingStatus.PENDING;

  @Property()
  expiresAt!: Date; // Deadline pembayaran
}
