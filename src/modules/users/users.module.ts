import { Module } from '@nestjs/common';
import { UsersService } from './services/users.service';
import { UsersController } from './controller/users.controller';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { User } from './entities/user.entity';
import { EntityManager } from '@mikro-orm/core';

@Module({
  imports: [MikroOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [
    UsersService,
    {
      provide: 'UserRepository',
      useFactory: (em: EntityManager) => em.getRepository(User),
      inject: [EntityManager],
    },
  ],
  exports: [UsersService, 'UserRepository'],
})
export class UsersModule {}
