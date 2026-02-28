import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { BookingService } from './services/booking.service';
import { BookingController } from './controller/booking.controller';
import { BookingProcessor } from './processors/booking.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'expire-booking',
    }),
  ],
  controllers: [BookingController],
  providers: [BookingService, BookingProcessor],
})
export class BookingModule {}
