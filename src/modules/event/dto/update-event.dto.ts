import { z } from 'zod';
import { CreateEventSchema } from './create-event.dto';

export const UpdateEventSchema = CreateEventSchema.partial();

export type UpdateEventDtoType = z.infer<typeof UpdateEventSchema>;

export class UpdateEventDto implements UpdateEventDtoType {
  title?: string;
  artistName?: string;
  description?: string;
  genre?: string;
  city?: string;
  venue?: string;
  address?: string;
  eventDate?: Date;
  posterUrl?: string;
  status?: import('../../../common/entities/enums').EventStatus;
}
