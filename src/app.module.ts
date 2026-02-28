import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { validate } from './config/env.validation';
import { AuthModule } from './modules/auth/auth.module';
import { BookingModule } from './modules/booking/booking.module';
import { EventModule } from './modules/event/event.module';
import { NotificationModule } from './modules/notification/notification.module';
import { UsersModule } from './modules/users/users.module';
import { RedisModule } from './common/redis/redis.module';
import mikroOrmConfig from './mikro-orm.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    MikroOrmModule.forRoot(mikroOrmConfig),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.get<string>('REDIS_PASSWORD'),
        },
      }),
    }),
    AuthModule,
    BookingModule,
    EventModule,
    NotificationModule,
    UsersModule,
    RedisModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
