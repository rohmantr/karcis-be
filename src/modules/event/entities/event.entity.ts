import {
  Entity,
  EntityRepositoryType,
  Enum,
  Index,
  ManyToOne,
  Property,
} from '@mikro-orm/core';
import { BaseEntity } from '../../../common/database/base.entity';
import { EventStatus } from '../../../common/entities/enums';
import { User } from '../../users/entities/user.entity';
import { EventRepository } from '../repositories/event.repository';

@Entity({ repository: () => EventRepository })
export class Event extends BaseEntity {
  [EntityRepositoryType]?: EventRepository;

  @Property({ length: 255 })
  title!: string;

  @Property({ length: 255 })
  artistName!: string;

  @Property({ columnType: 'text' })
  description!: string;

  @Property({ length: 100 })
  genre!: string;

  @Property({ length: 100 })
  @Index({ name: 'idx_event_city' })
  city!: string;

  @Property({ length: 255 })
  venue!: string;

  @Property({ columnType: 'text' })
  address!: string;

  @Property()
  @Index({ name: 'idx_event_date' })
  eventDate!: Date;

  @Property({ columnType: 'text', nullable: true })
  posterUrl?: string;

  @Enum({ items: () => EventStatus, default: EventStatus.DRAFT, length: 20 })
  @Index({ name: 'idx_event_status' })
  status: EventStatus = EventStatus.DRAFT;

  @ManyToOne(() => User)
  @Index({ name: 'idx_event_created_by' })
  createdBy!: User;
}
