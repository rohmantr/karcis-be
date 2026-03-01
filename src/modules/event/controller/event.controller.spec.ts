import { Test, TestingModule } from '@nestjs/testing';
import { EventController } from './event.controller';
import { EventService } from '../services/event.service';
import { ThrottlerGuard } from '@nestjs/throttler';
import { EventStatus } from '../../../common/entities/enums';

describe('EventController', () => {
  let controller: EventController;
  let service: EventService;

  const sampleEvent = {
    id: 'evt-1',
    title: 'Rock Concert',
    artistName: 'Band X',
    status: EventStatus.PUBLISHED,
  };

  const mockEventService = {
    create: jest.fn().mockResolvedValue(sampleEvent),
    findAll: jest.fn().mockResolvedValue({ data: [sampleEvent], total: 1 }),
    findOne: jest.fn().mockResolvedValue(sampleEvent),
    findMyEvents: jest.fn().mockResolvedValue([sampleEvent]),
    update: jest
      .fn()
      .mockResolvedValue({ ...sampleEvent, title: 'Updated Concert' }),
    remove: jest
      .fn()
      .mockResolvedValue({ message: 'Event cancelled successfully' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventController],
      providers: [
        {
          provide: EventService,
          useValue: mockEventService,
        },
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<EventController>(EventController);
    service = module.get<EventService>(EventService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ── create ────────────────────────────────────────

  describe('create', () => {
    it('delegates to service with user id', async () => {
      const dto = {
        title: 'Rock Concert',
        artistName: 'Band X',
        description: 'Awesome',
        genre: 'Rock',
        city: 'Jakarta',
        venue: 'GBK',
        address: 'Senayan',
        eventDate: new Date('2026-06-01'),
        status: EventStatus.DRAFT,
      };
      const user = { id: 'admin-1' } as never;

      const result = await controller.create(dto, user);

      expect(service.create).toHaveBeenCalledWith(dto, 'admin-1');
      expect(result).toEqual(sampleEvent);
    });
  });

  // ── findAll ───────────────────────────────────────

  describe('findAll', () => {
    it('returns published events without filters', async () => {
      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalledWith(
        { city: undefined, genre: undefined },
        undefined,
        undefined,
      );
      expect(result).toEqual({ data: [sampleEvent], total: 1 });
    });

    it('passes query filters to service', async () => {
      await controller.findAll('Jakarta', 'Rock', 10, 5);

      expect(service.findAll).toHaveBeenCalledWith(
        { city: 'Jakarta', genre: 'Rock' },
        10,
        5,
      );
    });
  });

  // ── findMyEvents ──────────────────────────────────

  describe('findMyEvents', () => {
    it('returns events for current user', async () => {
      const user = { id: 'admin-1' } as never;

      const result = await controller.findMyEvents(user);

      expect(service.findMyEvents).toHaveBeenCalledWith('admin-1');
      expect(result).toEqual([sampleEvent]);
    });
  });

  // ── findOne ───────────────────────────────────────

  describe('findOne', () => {
    it('returns event by id', async () => {
      const result = await controller.findOne('evt-1');

      expect(service.findOne).toHaveBeenCalledWith('evt-1');
      expect(result).toEqual(sampleEvent);
    });
  });

  // ── update ────────────────────────────────────────

  describe('update', () => {
    it('delegates update to service with user id', async () => {
      const dto = { title: 'Updated Concert' };
      const user = { id: 'admin-1' } as never;

      const result = await controller.update('evt-1', dto, user);

      expect(service.update).toHaveBeenCalledWith('evt-1', dto, 'admin-1');
      expect(result).toHaveProperty('title', 'Updated Concert');
    });
  });

  // ── remove ────────────────────────────────────────

  describe('remove', () => {
    it('delegates remove to service with user id', async () => {
      const user = { id: 'admin-1' } as never;

      const result = await controller.remove('evt-1', user);

      expect(service.remove).toHaveBeenCalledWith('evt-1', 'admin-1');
      expect(result).toEqual({ message: 'Event cancelled successfully' });
    });
  });
});
