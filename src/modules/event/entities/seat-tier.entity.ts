import {
  Collection,
  Entity,
  EntityRepositoryType,
  ManyToOne,
  OneToMany,
  Property,
} from '@mikro-orm/core';
import { BaseEntity } from '../../../common/database/base.entity';
import { Event } from './event.entity';
import { Seat } from './seat.entity';
import { SeatTierRepository } from '../repositories/seat-tier.repository';

@Entity({ repository: () => SeatTierRepository })
export class SeatTier extends BaseEntity {
  [EntityRepositoryType]?: SeatTierRepository;
  @ManyToOne(() => Event)
  event!: Event;

  @Property()
  name!: string; // e.g VIP, Regular

  @Property({ type: 'decimal', precision: 12, scale: 2 })
  price!: string;

  @OneToMany(() => Seat, (seat) => seat.seatTier)
  seats = new Collection<Seat>(this);
}
