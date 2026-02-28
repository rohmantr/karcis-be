import { Test, TestingModule } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import request from 'supertest';
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
  let refreshToken: string;

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

  it('/auth/login (POST) - success', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(200);

    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
  });

  it('/auth/login (POST) - invalid credentials', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: 'wrong-password' })
      .expect(401);
  });

  it('/auth/refresh-token (POST) - success with rotation', async () => {
    // Ensure we have valid tokens from login
    expect(refreshToken).toBeDefined();

    const res = await request(app.getHttpServer())
      .post('/auth/refresh-token')
      .send({ refreshToken })
      .expect(200);

    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body.refreshToken).not.toBe(refreshToken);

    // Update tokens for subsequent tests
    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
  });

  it('/auth/refresh-token (POST) - old token rejected after rotation', async () => {
    // Login again to get a fresh token pair
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(200);

    const firstToken = loginRes.body.refreshToken;
    accessToken = loginRes.body.accessToken;

    // Use the token to rotate
    const rotateRes = await request(app.getHttpServer())
      .post('/auth/refresh-token')
      .send({ refreshToken: firstToken })
      .expect(200);

    expect(rotateRes.body).toHaveProperty('refreshToken');
    refreshToken = rotateRes.body.refreshToken;
    accessToken = rotateRes.body.accessToken;

    // Try to reuse the first token (already rotated/revoked)
    await request(app.getHttpServer())
      .post('/auth/refresh-token')
      .send({ refreshToken: firstToken })
      .expect(401);
  });

  it('/auth/logout (POST) - success', async () => {
    // Login to get a fresh token since previous test may have revoked all
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(200);

    accessToken = loginRes.body.accessToken;

    const res = await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body).toEqual({ message: 'Logout successful' });
  });

  it('/auth/logout (POST) - unauthorized without token', async () => {
    await request(app.getHttpServer()).post('/auth/logout').expect(401);
  });
});
