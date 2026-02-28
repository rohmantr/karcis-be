import { Test, TestingModule } from '@nestjs/testing';
import { EventService } from './event.service';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { Event } from '../entities/event.entity';

describe('EventService', () => {
  let service: EventService;

  const mockEventRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventService,
        {
          provide: getRepositoryToken(Event),
          useValue: mockEventRepository,
        },
      ],
    }).compile();

    service = module.get<EventService>(EventService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create an event', () => {
    expect(service.create({ name: 'event name' } as any)).toBe('This action adds a new event');
  });

  it('should find all events', () => {
    expect(service.findAll()).toBe('This action returns all event');
  });

  it('should find an event', () => {
    expect(service.findOne(1)).toBe('This action returns a #1 event');
  });

  it('should update an event', () => {
    expect(service.update(1, { name: 'updated' } as any)).toBe('This action updates a #1 event');
  });

  it('should remove an event', () => {
    expect(service.remove(1)).toBe('This action removes a #1 event');
  });
});
