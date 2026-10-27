import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { loadConfig } from '../src/config/app-config.js';
import { createTestApp } from './helpers.js';

const CLOUDFLARE_ORIGINS = 'https://wslab.galetics.lat/, https://wslab.2302073.workers.dev/';

describe('CORS con los dos dominios de Cloudflare (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const { frontendOrigins } = loadConfig(
      { FRONTEND_EXTRA_ORIGINS: CLOUDFLARE_ORIGINS },
      { detectLocalNetwork: false },
    );
    ({ app } = await createTestApp({ frontendOrigins }));
  });

  afterAll(async () => {
    await app.close();
  });

  it.each(['https://wslab.galetics.lat', 'https://wslab.2302073.workers.dev'])(
    'autoriza las solicitudes desde %s',
    async (origin) => {
      const res = await request(app.getHttpServer()).get('/api/products').set('Origin', origin).expect(200);
      expect(res.headers['access-control-allow-origin']).toBe(origin);
    },
  );

  it('responde la solicitud previa del POST desde el dominio propio', async () => {
    const res = await request(app.getHttpServer())
      .options('/api/products')
      .set('Origin', 'https://wslab.galetics.lat')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'content-type')
      .expect(204);
    expect(res.headers['access-control-allow-origin']).toBe('https://wslab.galetics.lat');
    expect(res.headers['access-control-allow-methods']).toContain('POST');
  });

  it('no autoriza otro subdominio que no está en la lista', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/products')
      .set('Origin', 'https://otro.galetics.lat');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});