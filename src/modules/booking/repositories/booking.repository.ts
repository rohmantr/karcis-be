import { EntityRepository } from '@mikro-orm/postgresql';
import { Booking } from '../entities/booking.entity';

export class BookingRepository extends EntityRepository<Booking> {
  // Custom repository methods for Booking go here
}
