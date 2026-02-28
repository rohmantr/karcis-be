import { Test, TestingModule } from '@nestjs/testing';
import { EventController } from './event.controller';
import { EventService } from '../services/event.service';
import { CreateEventDto } from '../dto/create-event.dto';
import { UpdateEventDto } from '../dto/update-event.dto';

describe('EventController', () => {
  let controller: EventController;
  let service: EventService;

  const mockEventService = {
    create: jest.fn((dto) => 'This action adds a new event'),
    findAll: jest.fn(() => 'This action returns all event'),
    findOne: jest.fn((id) => `This action returns a #${id} event`),
    update: jest.fn((id, dto) => `This action updates a #${id} event`),
    remove: jest.fn((id) => `This action removes a #${id} event`),
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
    }).compile();

    controller = module.get<EventController>(EventController);
    service = module.get<EventService>(EventService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create an event', () => {
    const dto: CreateEventDto = { name: 'name' } as never;
    expect(controller.create(dto)).toBe('This action adds a new event');
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('should find all events', () => {
    expect(controller.findAll()).toBe('This action returns all event');
    expect(service.findAll).toHaveBeenCalled();
  });

  it('should find an event', () => {
    expect(controller.findOne('1')).toBe('This action returns a #1 event');
    expect(service.findOne).toHaveBeenCalledWith(1);
  });

  it('should update an event', () => {
    const dto: UpdateEventDto = { name: 'updated' } as never;
    expect(controller.update('1', dto)).toBe('This action updates a #1 event');
    expect(service.update).toHaveBeenCalledWith(1, dto);
  });

  it('should remove an event', () => {
    expect(controller.remove('1')).toBe('This action removes a #1 event');
    expect(service.remove).toHaveBeenCalledWith(1);
  });
});
