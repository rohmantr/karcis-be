import { Module } from '@nestjs/common';
import { BookingService } from './services/booking.service';
import { BookingController } from './controller/booking.controller';

@Module({
  controllers: [BookingController],
  providers: [BookingService],
})
export class BookingModule {}
