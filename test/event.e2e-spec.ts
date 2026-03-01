import { Test, TestingModule } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { MikroORM } from '@mikro-orm/core';

describe('EventController (e2e)', () => {
  let app: NestFastifyApplication;
  let orm: MikroORM;
  let adminToken: string;
  let userToken: string;
  let eventId: string;

  const adminUser = {
    name: 'Event Admin',
    email: 'event-admin@example.com',
    phone: '081234567890',
    password: 'Password123!',
  };

  const regularUser = {
    name: 'Regular User',
    email: 'regular-user@example.com',
    phone: '081234567891',
    password: 'Password123!',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    orm = app.get(MikroORM);
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('Refusing to drop schema outside of test environment');
    }
    const generator = orm.getSchemaGenerator();
    await generator.dropSchema();
    await generator.createSchema();
    await generator.updateSchema();

    // Register admin user
    await request(app.getHttpServer())
      .post('/auth/register')
      .send(adminUser)
      .expect(201);

    // Promote to ADMIN via direct DB update
    const connection = orm.em.getConnection();
    await connection.execute(
      `UPDATE "user" SET role = 'ADMIN' WHERE email = '${adminUser.email}'`,
    );

    // Login as admin
    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: adminUser.email, password: adminUser.password })
      .expect(200);
    adminToken = adminLogin.body.accessToken;

    // Register regular user
    await request(app.getHttpServer())
      .post('/auth/register')
      .send(regularUser)
      .expect(201);

    // Login as regular user
    const userLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: regularUser.email, password: regularUser.password })
      .expect(200);
    userToken = userLogin.body.accessToken;
  });

  afterAll(async () => {
    await orm.close();
    await app.close();
  });

  const validEvent = {
    title: 'Rock Festival 2026',
    artistName: 'Band X',
    description: 'The biggest rock festival in Southeast Asia',
    genre: 'Rock',
    city: 'Jakarta',
    venue: 'Gelora Bung Karno',
    address: 'Jl. Pintu Satu Senayan, Jakarta',
    eventDate: '2026-12-01T19:00:00.000Z',
    status: 'PUBLISHED',
  };

  // ── POST /events ──────────────────────────────────

  it('POST /events - 401 without token', async () => {
    await request(app.getHttpServer())
      .post('/events')
      .send(validEvent)
      .expect(401);
  });

  it('POST /events - 403 for non-admin user', async () => {
    await request(app.getHttpServer())
      .post('/events')
      .send(validEvent)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);
  });

  it('POST /events - 400 for invalid payload', async () => {
    await request(app.getHttpServer())
      .post('/events')
      .send({ title: '' })
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(400);
  });

  it('POST /events - 201 success for admin', async () => {
    const res = await request(app.getHttpServer())
      .post('/events')
      .send(validEvent)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toBe(validEvent.title);
    expect(res.body.status).toBe('PUBLISHED');
    eventId = res.body.id;
  });

  // ── GET /events ───────────────────────────────────

  it('GET /events - returns published events (public)', async () => {
    const res = await request(app.getHttpServer()).get('/events').expect(200);

    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('total');
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /events?city=Jakarta - filters by city', async () => {
    const res = await request(app.getHttpServer())
      .get('/events?city=Jakarta')
      .expect(200);

    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    for (const event of res.body.data) {
      expect(event.city).toBe('Jakarta');
    }
  });

  it('GET /events?city=Nonexistent - returns empty for unknown city', async () => {
    const res = await request(app.getHttpServer())
      .get('/events?city=Nonexistent')
      .expect(200);

    expect(res.body.data).toHaveLength(0);
    expect(res.body.total).toBe(0);
  });

  // ── GET /events/my ────────────────────────────────

  it('GET /events/my - 401 without token', async () => {
    await request(app.getHttpServer()).get('/events/my').expect(401);
  });

  it('GET /events/my - returns own events', async () => {
    const res = await request(app.getHttpServer())
      .get('/events/my')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  // ── GET /events/:id ───────────────────────────────

  it('GET /events/:id - returns event by ID', async () => {
    const res = await request(app.getHttpServer())
      .get(`/events/${eventId}`)
      .expect(200);

    expect(res.body.id).toBe(eventId);
    expect(res.body.title).toBe(validEvent.title);
  });

  it('GET /events/:id - 404 for nonexistent ID', async () => {
    await request(app.getHttpServer())
      .get('/events/00000000-0000-0000-0000-000000000000')
      .expect(404);
  });

  it('GET /events/:id - 400 for invalid UUID', async () => {
    await request(app.getHttpServer()).get('/events/not-a-uuid').expect(400);
  });

  // ── PATCH /events/:id ─────────────────────────────

  it('PATCH /events/:id - 401 without token', async () => {
    await request(app.getHttpServer())
      .patch(`/events/${eventId}`)
      .send({ title: 'Updated' })
      .expect(401);
  });

  it('PATCH /events/:id - 403 for non-admin', async () => {
    await request(app.getHttpServer())
      .patch(`/events/${eventId}`)
      .send({ title: 'Updated' })
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);
  });

  it('PATCH /events/:id - 200 success for admin owner', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/events/${eventId}`)
      .send({ title: 'Updated Rock Festival' })
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.title).toBe('Updated Rock Festival');
  });

  // ── DELETE /events/:id ────────────────────────────

  it('DELETE /events/:id - 401 without token', async () => {
    await request(app.getHttpServer()).delete(`/events/${eventId}`).expect(401);
  });

  it('DELETE /events/:id - 403 for non-admin', async () => {
    await request(app.getHttpServer())
      .delete(`/events/${eventId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);
  });

  it('DELETE /events/:id - 200 cancels event for admin owner', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/events/${eventId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body).toEqual({ message: 'Event cancelled successfully' });
  });
});
