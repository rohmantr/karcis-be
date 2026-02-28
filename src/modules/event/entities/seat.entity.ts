import {
  Collection,
  Entity,
  EntityRepositoryType,
  ManyToOne,
  OneToMany,
  Property,
} from '@mikro-orm/core';
import { BaseEntity } from '../../../common/database/base.entity';
import { SeatStatus } from '../../../common/entities/enums';
import { Booking } from '../../booking/entities/booking.entity';
import { SeatTier } from './seat-tier.entity';
import { SeatRepository } from '../repositories/seat.repository';

@Entity({ repository: () => SeatRepository })
export class Seat extends BaseEntity {
  [EntityRepositoryType]?: SeatRepository;
  @ManyToOne(() => SeatTier)
  seatTier!: SeatTier;

  @Property()
  row!: string;

  @Property()
  number!: number;

  @Property({ type: 'string' })
  status: SeatStatus = SeatStatus.AVAILABLE;

  @Property({ version: true })
  version!: number; // Optimistic locking key feature

  @OneToMany(() => Booking, (booking) => booking.seat)
  bookings = new Collection<Booking>(this);
}
