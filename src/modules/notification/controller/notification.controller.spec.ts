import { Test, TestingModule } from '@nestjs/testing';
import { NotificationController } from './notification.controller';
import { NotificationService } from '../services/notification.service';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { UpdateNotificationDto } from '../dto/update-notification.dto';

describe('NotificationController', () => {
  let controller: NotificationController;
  let service: NotificationService;

  const mockNotificationService = {
    create: jest.fn((dto) => 'This action adds a new notification'),
    findAll: jest.fn(() => 'This action returns all notification'),
    findOne: jest.fn((id) => `This action returns a #${id} notification`),
    update: jest.fn((id, dto) => `This action updates a #${id} notification`),
    remove: jest.fn((id) => `This action removes a #${id} notification`),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
      ],
    }).compile();

    controller = module.get<NotificationController>(NotificationController);
    service = module.get<NotificationService>(NotificationService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a notification', () => {
    const dto: CreateNotificationDto = { message: 'msg' } as any;
    expect(controller.create(dto)).toBe('This action adds a new notification');
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('should find all notifications', () => {
    expect(controller.findAll()).toBe('This action returns all notification');
    expect(service.findAll).toHaveBeenCalled();
  });

  it('should find a notification', () => {
    expect(controller.findOne('1')).toBe(
      'This action returns a #1 notification',
    );
    expect(service.findOne).toHaveBeenCalledWith(1);
  });

  it('should update a notification', () => {
    const dto: UpdateNotificationDto = { message: 'updated' } as any;
    expect(controller.update('1', dto)).toBe(
      'This action updates a #1 notification',
    );
    expect(service.update).toHaveBeenCalledWith(1, dto);
  });

  it('should remove a notification', () => {
    expect(controller.remove('1')).toBe(
      'This action removes a #1 notification',
    );
    expect(service.remove).toHaveBeenCalledWith(1);
  });
});
