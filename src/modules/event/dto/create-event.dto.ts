import { z } from 'zod';
import { EventStatus } from '../../../common/entities/enums';

export const CreateEventSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(255),
  artistName: z.string().trim().min(1, 'Artist name is required').max(255),
  description: z.string().trim().min(1, 'Description is required'),
  genre: z.string().trim().min(1, 'Genre is required').max(100),
  city: z.string().trim().min(1, 'City is required').max(100),
  venue: z.string().trim().min(1, 'Venue is required').max(255),
  address: z.string().trim().min(1, 'Address is required'),
  eventDate: z.coerce.date().refine((d) => d > new Date(), {
    message: 'Event date must be in the future',
  }),
  posterUrl: z.string().url('Invalid poster URL').optional(),
  status: z.nativeEnum(EventStatus).optional().default(EventStatus.DRAFT),
});

export type CreateEventDtoType = z.infer<typeof CreateEventSchema>;

export class CreateEventDto implements CreateEventDtoType {
  title!: string;
  artistName!: string;
  description!: string;
  genre!: string;
  city!: string;
  venue!: string;
  address!: string;
  eventDate!: Date;
  posterUrl?: string;
  status!: EventStatus;
}
