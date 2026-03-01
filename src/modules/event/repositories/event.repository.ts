import { EntityRepository } from '@mikro-orm/postgresql';
import { Event } from '../entities/event.entity';
import { EventStatus } from '../../../common/entities/enums';

export interface EventFilters {
  city?: string;
  genre?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export class EventRepository extends EntityRepository<Event> {
  async findPublished(
    filters: EventFilters = {},
    limit = 20,
    offset = 0,
  ): Promise<[Event[], number]> {
    const where: Record<string, unknown> = { status: EventStatus.PUBLISHED };

    if (filters.city) where.city = filters.city;
    if (filters.genre) where.genre = filters.genre;
    if (filters.dateFrom || filters.dateTo) {
      const dateCondition: Record<string, Date> = {};
      if (filters.dateFrom) dateCondition.$gte = filters.dateFrom;
      if (filters.dateTo) dateCondition.$lte = filters.dateTo;
      where.eventDate = dateCondition;
    }

    return this.findAndCount(where, {
      orderBy: { eventDate: 'ASC' },
      limit,
      offset,
    });
  }

  async findByCreator(userId: string): Promise<Event[]> {
    return this.find({ createdBy: userId }, { orderBy: { createdAt: 'DESC' } });
  }
}
