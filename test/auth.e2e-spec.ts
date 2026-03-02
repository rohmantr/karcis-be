import { Test, TestingModule } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import request from 'supertest';
import cookie from '@fastify/cookie';
import { AppModule } from './../src/app.module';
import { MikroORM } from '@mikro-orm/core';

describe('AuthController (e2e)', () => {
  let app: NestFastifyApplication;
  let orm: MikroORM;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );

    await app.register(cookie, {
      secret: process.env.COOKIE_SECRET || 'test-cookie-secret',
    });

    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    orm = app.get(MikroORM);
    const generator = orm.getSchemaGenerator();
    await generator.dropSchema();
    await generator.createSchema();
    await generator.updateSchema();
  });

  afterAll(async () => {
    await orm.close();
    await app.close();
  });

  const testUser = {
    name: 'E2E Test User',
    email: 'test-e2e@example.com',
    phone: '081234567890',
    password: 'Password123!',
  };

  let accessToken: string;
  let cookies: string[];

  it('/auth/register (POST) - success', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send(testUser)
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.email).toBe(testUser.email);
    expect(res.body.name).toBe(testUser.name);
  });

  it('/auth/register (POST) - duplicate email', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send(testUser)
      .expect(409);
  });

  it('/auth/register (POST) - validation error (missing name)', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'no-name@test.com', password: 'Password123!' })
      .expect(400);
  });

  it('/auth/login (POST) - success with cookies', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(200);

    expect(res.body).toHaveProperty('accessToken');
    accessToken = res.body.accessToken;

    // Verify Set-Cookie headers are present
    cookies = res.headers['set-cookie'] as unknown as string[];
    expect(cookies).toBeDefined();
    expect(cookies.length).toBeGreaterThanOrEqual(2);

    const cookieNames = cookies.map((c: string) => c.split('=')[0]);
    expect(cookieNames).toContain('access_token');
    expect(cookieNames).toContain('refresh_token');

    // Verify HttpOnly flag
    const accessCookie = cookies.find((c: string) =>
      c.startsWith('access_token='),
    );
    expect(accessCookie).toContain('HttpOnly');
  });

  it('/auth/login (POST) - invalid credentials', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: 'wrong-password' })
      .expect(401);
  });

  it('/auth/refresh-token (POST) - success with cookie', async () => {
    expect(cookies).toBeDefined();

    const res = await request(app.getHttpServer())
      .post('/auth/refresh-token')
      .set('Cookie', cookies)
      .send({})
      .expect(200);

    expect(res.body).toHaveProperty('accessToken');

    // Update cookies for subsequent tests
    const newCookies = res.headers['set-cookie'] as unknown as string[];
    if (newCookies) cookies = newCookies;
    accessToken = res.body.accessToken;
  });

  it('/auth/refresh-token (POST) - old cookie rejected after rotation', async () => {
    // Login again to get a fresh cookie set
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(200);

    const firstCookies = loginRes.headers[
      'set-cookie'
    ] as unknown as string[];
    accessToken = loginRes.body.accessToken;

    // Use the cookie to rotate
    const rotateRes = await request(app.getHttpServer())
      .post('/auth/refresh-token')
      .set('Cookie', firstCookies)
      .send({})
      .expect(200);

    expect(rotateRes.body).toHaveProperty('accessToken');
    cookies = rotateRes.headers['set-cookie'] as unknown as string[];
    accessToken = rotateRes.body.accessToken;

    // Try to reuse the first cookies (already rotated/revoked)
    await request(app.getHttpServer())
      .post('/auth/refresh-token')
      .set('Cookie', firstCookies)
      .send({})
      .expect(401);
  });

  it('/auth/logout (POST) - success with cookie clearing', async () => {
    // Login to get a fresh token
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(200);

    accessToken = loginRes.body.accessToken;
    const loginCookies = loginRes.headers[
      'set-cookie'
    ] as unknown as string[];

    const res = await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Cookie', loginCookies)
      .expect(200);

    expect(res.body).toEqual({ message: 'Logout successful' });

    // Verify cookies are cleared (Set-Cookie headers with empty/expired values)
    const logoutCookies = res.headers['set-cookie'] as unknown as string[];
    expect(logoutCookies).toBeDefined();
  });

  it('/auth/logout (POST) - unauthorized without token', async () => {
    await request(app.getHttpServer()).post('/auth/logout').expect(401);
  });
});
