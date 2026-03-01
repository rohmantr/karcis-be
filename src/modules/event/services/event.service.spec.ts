import { Test, TestingModule } from '@nestjs/testing';
import { EventService } from './event.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { User } from '../../users/entities/user.entity';
import { EventStatus } from '../../../common/entities/enums';
import { EntityManager } from '@mikro-orm/postgresql';
import { Event } from '../entities/event.entity';

jest.mock('@mikro-orm/core', () => {
  const actual = jest.requireActual('@mikro-orm/core');
  return {
    ...actual,
    CreateRequestContext:
      () => (_target: unknown, _key: string, descriptor: PropertyDescriptor) =>
        descriptor,
  };
});

describe('EventService', () => {
  let service: EventService;
  let eventRepo: Record<string, jest.Mock>;
  let mockEm: Record<string, jest.Mock>;

  const adminUser = {
    id: 'admin-1',
    name: 'Admin',
    email: 'admin@test.com',
  } as User;

  const otherUser = {
    id: 'admin-2',
    name: 'Other Admin',
    email: 'other@test.com',
  } as User;

  const sampleEvent = {
    id: 'evt-1',
    title: 'Rock Concert',
    artistName: 'Band X',
    description: 'Awesome concert',
    genre: 'Rock',
    city: 'Jakarta',
    venue: 'GBK',
    address: 'Senayan, Jakarta',
    eventDate: new Date('2026-06-01'),
    status: EventStatus.DRAFT,
    createdBy: adminUser,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as Event;

  beforeEach(async () => {
    eventRepo = {
      create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 'evt-1' })),
      findOne: jest.fn(),
      findPublished: jest.fn(),
      findByCreator: jest.fn(),
      assign: jest.fn(),
    };

    mockEm = {
      getRepository: jest.fn().mockReturnValue(eventRepo),
      getReference: jest.fn().mockImplementation((_entity, id) => ({ id })),
      persistAndFlush: jest.fn(),
      flush: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [EventService, { provide: EntityManager, useValue: mockEm }],
    }).compile();

    service = module.get(EventService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── create ────────────────────────────────────────

  describe('create', () => {
    it('creates event and persists it', async () => {
      const dto = {
        title: 'Rock Concert',
        artistName: 'Band X',
        description: 'Awesome concert',
        genre: 'Rock',
        city: 'Jakarta',
        venue: 'GBK',
        address: 'Senayan, Jakarta',
        eventDate: new Date('2026-06-01'),
        status: EventStatus.DRAFT,
      };

      const result = await service.create(dto, 'admin-1');

      expect(mockEm.getReference).toHaveBeenCalledWith(User, 'admin-1');
      expect(eventRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Rock Concert',
          createdBy: { id: 'admin-1' },
        }),
      );
      expect(mockEm.persistAndFlush).toHaveBeenCalled();
      expect(result).toHaveProperty('id');
    });
  });

  // ── findAll ───────────────────────────────────────

  describe('findAll', () => {
    it('returns published events with total count', async () => {
      eventRepo.findPublished.mockResolvedValue([[sampleEvent], 1]);

      const result = await service.findAll({ city: 'Jakarta' });

      expect(eventRepo.findPublished).toHaveBeenCalledWith(
        { city: 'Jakarta' },
        20,
        0,
      );
      expect(result).toEqual({ data: [sampleEvent], total: 1 });
    });

    it('uses custom limit and offset', async () => {
      eventRepo.findPublished.mockResolvedValue([[], 0]);

      await service.findAll({}, 10, 5);

      expect(eventRepo.findPublished).toHaveBeenCalledWith({}, 10, 5);
    });

    it('clamps negative limit to 1 and negative offset to 0', async () => {
      eventRepo.findPublished.mockResolvedValue([[], 0]);

      await service.findAll({}, -5, -10);

      expect(eventRepo.findPublished).toHaveBeenCalledWith({}, 1, 0);
    });

    it('clamps excessive limit to 100', async () => {
      eventRepo.findPublished.mockResolvedValue([[], 0]);

      await service.findAll({}, 500, 0);

      expect(eventRepo.findPublished).toHaveBeenCalledWith({}, 100, 0);
    });
  });

  // ── findOne ───────────────────────────────────────

  describe('findOne', () => {
    it('returns event when found', async () => {
      eventRepo.findOne.mockResolvedValue(sampleEvent);

      const result = await service.findOne('evt-1');

      expect(result).toBe(sampleEvent);
      expect(eventRepo.findOne).toHaveBeenCalledWith(
        {
          id: 'evt-1',
          status: { $in: [EventStatus.PUBLISHED, EventStatus.SOLD_OUT] },
        },
        { populate: ['createdBy'] },
      );
    });

    it('throws NotFoundException when event not found', async () => {
      eventRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── findMyEvents ──────────────────────────────────

  describe('findMyEvents', () => {
    it('returns events created by user', async () => {
      eventRepo.findByCreator.mockResolvedValue([sampleEvent]);

      const result = await service.findMyEvents('admin-1');

      expect(eventRepo.findByCreator).toHaveBeenCalledWith('admin-1');
      expect(result).toEqual([sampleEvent]);
    });
  });

  // ── update ────────────────────────────────────────

  describe('update', () => {
    it('updates own event successfully', async () => {
      eventRepo.findOne.mockResolvedValue(sampleEvent);

      const dto = { title: 'Updated Concert' };
      const result = await service.update('evt-1', dto, 'admin-1');

      expect(eventRepo.assign).toHaveBeenCalledWith(sampleEvent, dto);
      expect(mockEm.flush).toHaveBeenCalled();
      expect(result).toBe(sampleEvent);
    });

    it('throws NotFoundException for missing event', async () => {
      eventRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update('nope', { title: 'x' }, 'admin-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException for non-owner', async () => {
      const eventByOther = {
        ...sampleEvent,
        createdBy: otherUser,
      } as unknown as Event;
      eventRepo.findOne.mockResolvedValue(eventByOther);

      await expect(
        service.update('evt-1', { title: 'x' }, 'admin-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ── remove ────────────────────────────────────────

  describe('remove', () => {
    it('cancels own event successfully', async () => {
      const mutableEvent = { ...sampleEvent } as unknown as Event;
      eventRepo.findOne.mockResolvedValue(mutableEvent);

      const result = await service.remove('evt-1', 'admin-1');

      expect(mutableEvent.status).toBe(EventStatus.CANCELLED);
      expect(mockEm.flush).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Event cancelled successfully' });
    });

    it('throws NotFoundException for missing event', async () => {
      eventRepo.findOne.mockResolvedValue(null);

      await expect(service.remove('nope', 'admin-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException for non-owner', async () => {
      const eventByOther = {
        ...sampleEvent,
        createdBy: otherUser,
      } as unknown as Event;
      eventRepo.findOne.mockResolvedValue(eventByOther);

      await expect(service.remove('evt-1', 'admin-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
