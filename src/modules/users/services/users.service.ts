import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { User } from '../entities/user.entity';
import { FindAllUsersDto } from '../dto/find-all-users.dto';

@Injectable()
export class UsersService {
  constructor(private readonly em: EntityManager) {}

  async findAll(query: FindAllUsersDto) {
    const userRepository = this.em.getRepository(User);
    return userRepository.findAllPaginated(query);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.em.findOne(User, { email });
  }

  async findById(id: string): Promise<User> {
    const user = await this.em.findOne(User, { id });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findOne(id: string) {
    return this.findById(id);
  }
}
