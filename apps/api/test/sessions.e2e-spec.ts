import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Sessions (e2e)', () => {
  let app: INestApplication;
  let ownerToken: string;
  let joinerToken: string;
  const timestamp = Date.now();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    const owner = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `owner-${timestamp}@example.com`,
        password: 'password123',
        name: 'Session Owner',
      });
    ownerToken = owner.body.accessToken;

    const joiner = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `joiner-${timestamp}@example.com`,
        password: 'password123',
        name: 'Session Joiner',
      });
    joinerToken = joiner.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  let sessionId: string;

  it('POST /sessions rejects unauthenticated requests', () => {
    return request(app.getHttpServer())
      .post('/sessions')
      .send({ game: 'Catan', location: 'Library', startTime: new Date().toISOString(), maxPlayers: 4 })
      .expect(401);
  });

  it('POST /sessions creates a session and auto-joins the owner', async () => {
    const res = await request(app.getHttpServer())
      .post('/sessions')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        game: 'Catan',
        location: 'Downtown Library',
        startTime: new Date(Date.now() + 86400000).toISOString(),
        maxPlayers: 2,
      })
      .expect(201);

    expect(res.body.participants).toHaveLength(1);
    expect(res.body.owner.email).toContain('owner-');
    sessionId = res.body.id;
  });

  it('GET /sessions lists the created session', async () => {
    const res = await request(app.getHttpServer()).get('/sessions').expect(200);
    expect(res.body.some((s: any) => s.id === sessionId)).toBe(true);
  });

  it('GET /sessions?location= filters correctly', async () => {
    const res = await request(app.getHttpServer())
      .get('/sessions')
      .query({ location: 'downtown' })
      .expect(200);
    expect(res.body.every((s: any) => s.location.toLowerCase().includes('downtown'))).toBe(true);
  });

  it('POST /sessions/:id/join adds the joiner as a participant', async () => {
    const res = await request(app.getHttpServer())
      .post(`/sessions/${sessionId}/join`)
      .set('Authorization', `Bearer ${joinerToken}`)
      .expect(201);

    expect(res.body.participants).toHaveLength(2);
  });

  it('POST /sessions/:id/join rejects joining twice', () => {
    return request(app.getHttpServer())
      .post(`/sessions/${sessionId}/join`)
      .set('Authorization', `Bearer ${joinerToken}`)
      .expect(409);
  });

  it('POST /sessions/:id/join rejects when the session is full (maxPlayers: 2, already 2 joined)', async () => {
    const thirdUser = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: `third-${timestamp}@example.com`, password: 'password123', name: 'Third' });

    return request(app.getHttpServer())
      .post(`/sessions/${sessionId}/join`)
      .set('Authorization', `Bearer ${thirdUser.body.accessToken}`)
      .expect(400);
  });

  it('POST /sessions/:id/leave forbids the owner from leaving', () => {
    return request(app.getHttpServer())
      .post(`/sessions/${sessionId}/leave`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(403);
  });

  it('POST /sessions/:id/leave allows a participant to leave', () => {
    return request(app.getHttpServer())
      .post(`/sessions/${sessionId}/leave`)
      .set('Authorization', `Bearer ${joinerToken}`)
      .expect(201);
  });
});
