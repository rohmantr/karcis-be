import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { Notification } from '../entities/notification.entity';

describe('NotificationService', () => {
  let service: NotificationService;

  const mockNotificationRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: getRepositoryToken(Notification),
          useValue: mockNotificationRepository,
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a notification', () => {
    expect(service.create({ message: 'hello' } as never)).toBe(
      'This action adds a new notification',
    );
  });

  it('should find all notifications', () => {
    expect(service.findAll()).toBe('This action returns all notification');
  });

  it('should find a notification', () => {
    expect(service.findOne(1)).toBe('This action returns a #1 notification');
  });

  it('should update a notification', () => {
    expect(service.update(1, { message: 'updated' } as never)).toBe(
      'This action updates a #1 notification',
    );
  });

  it('should remove a notification', () => {
    expect(service.remove(1)).toBe('This action removes a #1 notification');
  });
});
