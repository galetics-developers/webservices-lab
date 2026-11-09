import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './helpers.js';

describe('Sondas de salud (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await createTestApp());
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health responde 200 sin consultar dependencias', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.uptimeSeconds).toBeGreaterThanOrEqual(0);
    expect(res.body.checks).toBeUndefined();
  });

  it('GET /health/ready informa el estado de la base de datos', async () => {
    const res = await request(app.getHttpServer()).get('/health/ready').expect(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.checks.database.status).toBe('not_configured');
  });

  it('las sondas quedan fuera de la política CORS del frontend', async () => {
    const res = await request(app.getHttpServer())
      .get('/health')
      .set('Origin', 'http://evil.example');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});
