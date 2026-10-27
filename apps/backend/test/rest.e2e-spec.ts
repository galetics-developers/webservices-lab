import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './helpers.js';

describe('REST /api/products (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await createTestApp());
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET devuelve los productos de ejemplo en JSON', async () => {
    const res = await request(app.getHttpServer()).get('/api/products').expect(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toHaveLength(3);
    expect(res.body[0]).toMatchObject({ id: 1, name: 'Teclado mecánico' });
  });

  it('POST agrega un producto y responde 201', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/products')
      .send({ name: 'Mouse', category: 'Periféricos', price: 249.5 })
      .expect(201);
    expect(res.body).toMatchObject({ id: 4, name: 'Mouse', price: 249.5, description: '' });

    const list = await request(app.getHttpServer()).get('/api/products').expect(200);
    expect(list.body).toHaveLength(4);
  });

  it('POST rechaza datos inválidos con 400', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/products')
      .send({ name: '', category: 'X', price: -5 })
      .expect(400);
    expect(res.body.message).toEqual(
      expect.arrayContaining(['name should not be empty', 'price must not be less than 0.01']),
    );
  });

  it('POST rechaza propiedades no declaradas', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/products')
      .send({ name: 'A', category: 'B', price: 1, isAdmin: true })
      .expect(400);
    expect(res.body.message).toContain('property isAdmin should not exist');
  });

  it('CORS solo autoriza los orígenes del frontend', async () => {
    const allowed = await request(app.getHttpServer())
      .get('/api/products')
      .set('Origin', 'http://localhost:3000');
    expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:3000');

    const loopback = await request(app.getHttpServer())
      .get('/api/products')
      .set('Origin', 'http://127.0.0.1:3000');
    expect(loopback.headers['access-control-allow-origin']).toBe('http://127.0.0.1:3000');

    const other = await request(app.getHttpServer())
      .get('/api/products')
      .set('Origin', 'http://evil.example');
    expect(other.headers['access-control-allow-origin']).toBeUndefined();
  });
});
