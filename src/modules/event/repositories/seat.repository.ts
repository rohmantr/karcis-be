import { EntityRepository } from '@mikro-orm/postgresql';
import { Seat } from '../entities/seat.entity';

export class SeatRepository extends EntityRepository<Seat> {
  // Custom repository methods for Seat go here
}
