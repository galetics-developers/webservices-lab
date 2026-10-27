import type { INestApplication } from '@nestjs/common';
import { SyntaxValidator } from 'fast-xml-validator';
import request from 'supertest';
import { parseRss } from '../src/consumers/rss-parser.js';
import { createTestApp } from './helpers.js';

describe('RSS /rss/products.xml (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await createTestApp());
  });

  afterAll(async () => {
    await app.close();
  });

  it('genera XML RSS 2.0 válido con un item por producto', async () => {
    const res = await request(app.getHttpServer()).get('/rss/products.xml').expect(200);
    expect(res.headers['content-type']).toBe('application/rss+xml; charset=utf-8');
    expect(SyntaxValidator.validate(res.text)).toBe(true);
    expect(res.text).toContain('<rss version="2.0"');

    const feed = parseRss(res.text);
    expect(feed.title).toBe('webservices-lab: productos de ejemplo');
    expect(feed.items.map((i) => i.guid)).toEqual(['product-1', 'product-2', 'product-3']);
  });

  it('refleja los productos agregados por REST', async () => {
    await request(app.getHttpServer())
      .post('/api/products')
      .send({ name: 'Audífonos', category: 'Audio', price: 599 })
      .expect(201);
    const res = await request(app.getHttpServer()).get('/rss/products.xml').expect(200);
    expect(parseRss(res.text).items.at(-1)?.title).toBe('Audífonos');
  });
});
