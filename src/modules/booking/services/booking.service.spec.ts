import { Test, TestingModule } from '@nestjs/testing';
import { BookingService } from './booking.service';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { Booking } from '../entities/booking.entity';

describe('BookingService', () => {
  let service: BookingService;

  const mockBookingRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingService,
        {
          provide: getRepositoryToken(Booking),
          useValue: mockBookingRepository,
        },
      ],
    }).compile();

    service = module.get<BookingService>(BookingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a booking', () => {
    expect(service.create({ eventId: 'uuid', userId: 'uuid' } as never)).toBe(
      'This action adds a new booking',
    );
  });

  it('should find all bookings', () => {
    expect(service.findAll()).toBe('This action returns all booking');
  });

  it('should find a booking', () => {
    expect(service.findOne(1)).toBe('This action returns a #1 booking');
  });

  it('should update a booking', () => {
    expect(service.update(1, { eventId: 'updated' } as never)).toBe(
      'This action updates a #1 booking',
    );
  });

  it('should remove a booking', () => {
    expect(service.remove(1)).toBe('This action removes a #1 booking');
  });
});
