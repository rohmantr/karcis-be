import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { CreateRequestContext } from '@mikro-orm/core';
import { Event } from '../entities/event.entity';
import { User } from '../../users/entities/user.entity';
import { EventRepository } from '../repositories/event.repository';
import { CreateEventDto } from '../dto/create-event.dto';
import { UpdateEventDto } from '../dto/update-event.dto';
import { EventStatus } from '../../../common/entities/enums';
import type { EventFilters } from '../repositories/event.repository';

@Injectable()
export class EventService {
  constructor(private readonly em: EntityManager) {}

  private get eventRepository(): EventRepository {
    return this.em.getRepository(Event);
  }

  @CreateRequestContext()
  async create(dto: CreateEventDto, userId: string): Promise<Event> {
    const user = this.em.getReference(User, userId);
    const event = this.eventRepository.create({
      ...dto,
      createdBy: user,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await this.em.persistAndFlush(event);
    return event;
  }

  @CreateRequestContext()
  async findAll(
    filters: EventFilters = {},
    limit = 20,
    offset = 0,
  ): Promise<{ data: Event[]; total: number }> {
    const [data, total] = await this.eventRepository.findPublished(
      filters,
      limit,
      offset,
    );
    return { data, total };
  }

  @CreateRequestContext()
  async findOne(id: string): Promise<Event> {
    const event = await this.eventRepository.findOne(
      { id, status: { $ne: EventStatus.CANCELLED } },
      { populate: ['createdBy'] },
    );
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    return event;
  }

  @CreateRequestContext()
  async findMyEvents(userId: string): Promise<Event[]> {
    return this.eventRepository.findByCreator(userId);
  }

  @CreateRequestContext()
  async update(
    id: string,
    dto: UpdateEventDto,
    userId: string,
  ): Promise<Event> {
    const event = await this.findEventOrFail(id);
    this.assertOwnership(event, userId);
    this.eventRepository.assign(event, dto);
    await this.em.flush();
    return event;
  }

  @CreateRequestContext()
  async remove(id: string, userId: string): Promise<{ message: string }> {
    const event = await this.findEventOrFail(id);
    this.assertOwnership(event, userId);
    event.status = EventStatus.CANCELLED;
    await this.em.flush();
    return { message: 'Event cancelled successfully' };
  }

  private async findEventOrFail(id: string): Promise<Event> {
    const event = await this.eventRepository.findOne(id, {
      populate: ['createdBy'],
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    return event;
  }

  private assertOwnership(event: Event, userId: string): void {
    if (event.createdBy.id !== userId) {
      throw new ForbiddenException(
        'You do not have permission to modify this event',
      );
    }
  }
}
