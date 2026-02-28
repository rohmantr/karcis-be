import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly em: EntityManager) {}

  create(_createUserDto: CreateUserDto) {
    return 'This action adds a new user';
  }

  async findAll() {
    return this.em.find(User, {});
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

  update(id: string, _updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: string) {
    return `This action removes a #${id} user`;
  }
}
