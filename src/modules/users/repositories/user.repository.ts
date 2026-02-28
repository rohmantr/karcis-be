import { EntityRepository } from '@mikro-orm/postgresql';
import { User } from '../entities/user.entity';
import { FindAllUsersDto } from '../dto/find-all-users.dto';

export class UserRepository extends EntityRepository<User> {
  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ email });
  }

  async findAllPaginated(query: FindAllUsersDto) {
    const { limit, offset, email } = query;
    const qb = this.createQueryBuilder('u')
      .select([
        'id',
        'name',
        'email',
        'phone',
        'role',
        'isActive',
        'createdAt',
        'updatedAt',
      ])
      .limit(limit)
      .offset(offset);

    if (email) {
      qb.andWhere({ email: { $ilike: `%${email}%` } });
    }
    const [data, total] = await qb.getResultAndCount();

    return {
      data,
      total,
      limit,
      offset,
    };
  }
}
