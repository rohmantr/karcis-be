import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { User } from '../modules/users/entities/user.entity';
import { Event } from '../modules/event/entities/event.entity';
import { EventStatus, UserRole } from '../common/entities/enums';
import * as bcrypt from 'bcrypt';

export class DatabaseSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const passwordHash = await bcrypt.hash('password123', 10);

    const adminUser = em.create(User, {
      name: 'System Admin',
      email: 'admin@karcis.com',
      phone: '+6281234567890',
      passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
    });

    const regularUser = em.create(User, {
      name: 'Regular Customer',
      email: 'user@karcis.com',
      phone: '+6281987654321',
      passwordHash,
      role: UserRole.USER,
      isActive: true,
    });

    const event1 = em.create(Event, {
      title: 'Jakarta Music Festival 2026',
      artistName: 'Various Artists',
      description:
        'The biggest music festival in Jakarta featuring top local and international artists.',
      genre: 'Pop/Rock',
      city: 'Jakarta',
      venue: 'Gelora Bung Karno',
      address:
        'Jl. Pintu Satu Senayan, Gelora, Kecamatan Tanah Abang, Kota Jakarta Pusat, Daerah Khusus Ibukota Jakarta 10270',
      eventDate: new Date('2026-08-15T15:00:00Z'),
      posterUrl: 'https://example.com/posters/jmf2026.jpg',
      status: EventStatus.PUBLISHED,
      createdBy: adminUser,
    });

    const event2 = em.create(Event, {
      title: 'Indie Rock Nite',
      artistName: 'The Rolling Beats',
      description: 'An intimate night with the best indie rock bands in town.',
      genre: 'Indie Rock',
      city: 'Bandung',
      venue: 'Dago Tea House',
      address:
        'Jl. Bukit Dago Selatan No.53A, Dago, Kecamatan Coblong, Kota Bandung, Jawa Barat 40135',
      eventDate: new Date('2026-06-20T19:00:00Z'),
      status: EventStatus.PUBLISHED,
      createdBy: adminUser,
    });

    const event3 = em.create(Event, {
      title: 'Jazz By The Beach',
      artistName: 'Smooth Jazz Quartet',
      description: 'Relaxing jazz music with a beautiful beach sunset view.',
      genre: 'Jazz',
      city: 'Bali',
      venue: 'Potato Head Beach Club',
      address:
        'Jalan Petitenget No.51B, Seminyak, Kec. Kuta Utara, Kabupaten Badung, Bali 80361',
      eventDate: new Date('2026-07-10T17:00:00Z'),
      status: EventStatus.DRAFT,
      createdBy: adminUser,
    });

    em.persist([adminUser, regularUser, event1, event2, event3]);
    await em.flush();
  }
}
