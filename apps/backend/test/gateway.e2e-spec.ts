import type { Server } from 'node:http';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { closeServer, createTestApp, getFreePort, startLocalServer } from './helpers.js';

const SEED_SIZE = 15;

describe('Gateway con servicios propios (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await createTestApp());
  });

  afterAll(async () => {
    await app.close();
  });

  it('consume ListProducts del SOAP propio a través del WSDL', async () => {
    const res = await request(app.getHttpServer()).get('/api/gateway/soap/products').expect(200);
    expect(res.body).toMatchObject({ source: 'own-soap', protocol: 'SOAP', ok: true });
    expect(res.body.data).toHaveLength(SEED_SIZE);
    expect(res.body.data[0]).toMatchObject({ id: 1, price: 18450 });
    expect(res.body.rawRequest).toContain('ListProductsRequest');
    expect(res.body.raw).toContain('ListProductsResponse');
  });

  it('consume GetProductById y refleja productos creados por REST (no lee el catálogo directo)', async () => {
    await request(app.getHttpServer())
      .post('/api/products')
      .send({ name: 'Nivel láser de líneas cruzadas', category: 'Medición', price: 899 })
      .expect(201);
    const res = await request(app.getHttpServer())
      .get(`/api/gateway/soap/products/${SEED_SIZE + 1}`)
      .expect(200);
    expect(res.body.data).toMatchObject({
      id: SEED_SIZE + 1,
      name: 'Nivel láser de líneas cruzadas',
      price: 899,
    });
  });

  it('traduce el SOAP Fault de producto inexistente a 404', async () => {
    const res = await request(app.getHttpServer()).get('/api/gateway/soap/products/999').expect(404);
    expect(res.body).toMatchObject({ ok: false, data: null, error: { code: 'NOT_FOUND' } });
    expect(res.body.raw).toContain('soap:Fault');
  });

  it('valida el id antes de llamar al servicio', async () => {
    await request(app.getHttpServer()).get('/api/gateway/soap/products/abc').expect(400);
  });

  it('consume el RSS propio por HTTP', async () => {
    const res = await request(app.getHttpServer()).get('/api/gateway/rss/products').expect(200);
    expect(res.body).toMatchObject({ source: 'own-rss', protocol: 'RSS', ok: true });
    expect(res.body.data.items.length).toBeGreaterThanOrEqual(SEED_SIZE);
    expect(res.body.raw).toContain('<rss version="2.0"');
  });

  it('valida los parámetros de los servicios externos', async () => {
    await request(app.getHttpServer()).get('/api/gateway/external/weather?city=paris').expect(400);
    await request(app.getHttpServer()).get('/api/gateway/external/weather').expect(400);
    await request(app.getHttpServer()).get('/api/gateway/external/countries/MEX').expect(400);
  });
});

describe('Gateway ante fallos de servicios externos (e2e)', () => {
  let app: INestApplication;
  let hanging: Server;
  let doctype: Server;

  beforeAll(async () => {
    const closedPort = await getFreePort();
    const slow = await startLocalServer(() => {});
    hanging = slow.server;
    const evil = await startLocalServer((_req, res) => {
      res.setHeader('Content-Type', 'application/rss+xml');
      res.end('<?xml version="1.0"?><!DOCTYPE r [<!ENTITY a "aaaa">]><rss><channel><title>&a;</title></channel></rss>');
    });
    doctype = evil.server;

    ({ app } = await createTestApp({
      httpTimeoutMs: 500,
      openMeteoBaseUrl: `http://127.0.0.1:${closedPort}/v1/forecast`,
      countryInfoWsdlUrl: `${slow.url}/CountryInfoService.wso?WSDL`,
      externalRssUrl: `${evil.url}/rss.xml`,
    }));
  });

  afterAll(async () => {
    await app.close();
    await closeServer(hanging);
    await closeServer(doctype);
  });

  it('servicio REST inaccesible: 502 CONNECTION_ERROR', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/gateway/external/weather?city=madrid')
      .expect(502);
    expect(res.body).toMatchObject({ source: 'open-meteo', ok: false, error: { code: 'CONNECTION_ERROR' } });
  });

  it('WSDL que no responde: 504 TIMEOUT', async () => {
    const res = await request(app.getHttpServer()).get('/api/gateway/external/countries/MX').expect(504);
    expect(res.body).toMatchObject({ source: 'country-info', ok: false, error: { code: 'TIMEOUT' } });
    expect(res.body.durationMs).toBeLessThan(3000);
  });

  it('RSS con DOCTYPE: 502 INVALID_RESPONSE', async () => {
    const res = await request(app.getHttpServer()).get('/api/gateway/external/rss').expect(502);
    expect(res.body).toMatchObject({ source: 'external-rss', ok: false, error: { code: 'INVALID_RESPONSE' } });
  });

  it('el backend sigue respondiendo después de los fallos', async () => {
    await request(app.getHttpServer()).get('/api/products').expect(200);
    await request(app.getHttpServer()).get('/api/gateway/soap/products').expect(200);
  });
});