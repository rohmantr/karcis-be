import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { EventService } from './services/event.service';
import { EventController } from './controller/event.controller';
import { Event } from './entities/event.entity';

@Module({
  imports: [MikroOrmModule.forFeature([Event])],
  controllers: [EventController],
  providers: [EventService],
  exports: [EventService],
})
export class EventModule {}
