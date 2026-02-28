import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';

@Processor('expire-booking')
export class BookingProcessor extends WorkerHost {
  private readonly logger = new Logger(BookingProcessor.name);

  async process(job: Job<unknown, unknown, string>): Promise<unknown> {
    this.logger.log(`Processing expiration for booking job ID: ${job.id}`);

    // Simulate finding booking and modifying status
    const bookingId = (job.data as { bookingId: string }).bookingId;
    this.logger.log(
      `Cancelling booking ${bookingId} due to payment expiration.`,
    );

    // Dummy await untuk memuaskan strict type requirement ESLint sementara
    await Promise.resolve();

    // Nanti akan diisi logika aslinya untuk menyentuh Repositori
    return { success: true, bookingId };
  }
}
