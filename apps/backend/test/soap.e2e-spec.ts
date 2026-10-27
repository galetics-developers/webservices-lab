import type { INestApplication } from '@nestjs/common';
import { SyntaxValidator } from 'fast-xml-validator';
import * as soap from 'soap';
import request from 'supertest';
import { createTestApp } from './helpers.js';

describe('SOAP /soap/products (e2e)', () => {
  let app: INestApplication;
  let baseUrl: string;

  beforeAll(async () => {
    ({ app, baseUrl } = await createTestApp());
  });

  afterAll(async () => {
    await app.close();
  });

  it('publica el WSDL con las operaciones y la dirección real', async () => {
    const res = await request(app.getHttpServer()).get('/soap/products?wsdl').expect(200);
    const wsdl = res.text;
    expect(SyntaxValidator.validate(wsdl)).toBe(true);
    expect(wsdl).toContain('<operation name="ListProducts">');
    expect(wsdl).toContain('<operation name="GetProductById">');
    expect(wsdl).toContain(`<soap:address location="${baseUrl}/soap/products"/>`);
  });

  it('un cliente SOAP construido desde el WSDL ve las operaciones', async () => {
    const client = await soap.createClientAsync(`${baseUrl}/soap/products?wsdl`);
    const description = client.describe();
    expect(Object.keys(description.ProductsService.ProductsPort)).toEqual([
      'ListProducts',
      'GetProductById',
    ]);
  });

  it('ListProducts devuelve los productos', async () => {
    const client: any = await soap.createClientAsync(`${baseUrl}/soap/products?wsdl`);
    const [result, rawResponse] = await client.ListProductsAsync({});
    expect(result.product).toHaveLength(3);
    expect(result.product[0]).toMatchObject({ id: 1, name: 'Teclado mecánico' });
    expect(rawResponse).toContain('<ListProductsResponse');
  });

  it('GetProductById devuelve un producto (node-soap convierte xsd:int y xsd:decimal)', async () => {
    const client: any = await soap.createClientAsync(`${baseUrl}/soap/products?wsdl`);
    const [result] = await client.GetProductByIdAsync({ id: 2 });
    expect(result.product).toMatchObject({ id: 2, name: 'Monitor 24 pulgadas', price: 3499.9 });
  });

  it('GetProductById responde SOAP Fault si el producto no existe', async () => {
    const client: any = await soap.createClientAsync(`${baseUrl}/soap/products?wsdl`);
    await expect(client.GetProductByIdAsync({ id: 999 })).rejects.toMatchObject({
      root: {
        Envelope: {
          Body: {
            Fault: { faultcode: 'soap:Client', faultstring: 'No existe el producto con id 999' },
          },
        },
      },
    });
  });

  it('rechaza sobres SOAP demasiado grandes', async () => {
    await request(app.getHttpServer())
      .post('/soap/products')
      .set('Content-Type', 'text/xml')
      .send('x'.repeat(200 * 1024))
      .expect(413);
  });
});
