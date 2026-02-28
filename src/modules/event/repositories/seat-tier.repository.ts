import { EntityRepository } from '@mikro-orm/postgresql';
import { SeatTier } from '../entities/seat-tier.entity';

export class SeatTierRepository extends EntityRepository<SeatTier> {
  // Custom repository methods for SeatTier go here
}
