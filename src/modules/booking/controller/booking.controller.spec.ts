import { Test, TestingModule } from '@nestjs/testing';
import { BookingController } from './booking.controller';
import { BookingService } from '../services/booking.service';
import { CreateBookingDto } from '../dto/create-booking.dto';
import { UpdateBookingDto } from '../dto/update-booking.dto';

describe('BookingController', () => {
  let controller: BookingController;
  let service: BookingService;

  const mockBookingService = {
    create: jest.fn((dto) => 'This action adds a new booking'),
    findAll: jest.fn(() => 'This action returns all booking'),
    findOne: jest.fn((id) => `This action returns a #${id} booking`),
    update: jest.fn((id, dto) => `This action updates a #${id} booking`),
    remove: jest.fn((id) => `This action removes a #${id} booking`),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingController],
      providers: [
        {
          provide: BookingService,
          useValue: mockBookingService,
        },
      ],
    }).compile();

    controller = module.get<BookingController>(BookingController);
    service = module.get<BookingService>(BookingService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a booking', () => {
    const dto: CreateBookingDto = { eventId: 'uuid', userId: 'uuid' } as never;
    expect(controller.create(dto)).toBe('This action adds a new booking');
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('should find all bookings', () => {
    expect(controller.findAll()).toBe('This action returns all booking');
    expect(service.findAll).toHaveBeenCalled();
  });

  it('should find a booking', () => {
    expect(controller.findOne('1')).toBe('This action returns a #1 booking');
    expect(service.findOne).toHaveBeenCalledWith(1);
  });

  it('should update a booking', () => {
    const dto: UpdateBookingDto = { eventId: 'updated' } as never;
    expect(controller.update('1', dto)).toBe(
      'This action updates a #1 booking',
    );
    expect(service.update).toHaveBeenCalledWith(1, dto);
  });

  it('should remove a booking', () => {
    expect(controller.remove('1')).toBe('This action removes a #1 booking');
    expect(service.remove).toHaveBeenCalledWith(1);
  });
});
