import {
  Collection,
  Entity,
  EntityRepositoryType,
  OneToMany,
  Property,
} from '@mikro-orm/core';
import { BaseEntity } from '../../../common/database/base.entity';
import { SeatTier } from './seat-tier.entity';
import { EventRepository } from '../repositories/event.repository';

@Entity({ repository: () => EventRepository })
export class Event extends BaseEntity {
  [EntityRepositoryType]?: EventRepository;
  @Property()
  title!: string;

  @OneToMany(() => SeatTier, (tier) => tier.event)
  seatTiers = new Collection<SeatTier>(this);
}
