import { readFileSync } from 'node:fs';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Product } from '@wslab/shared';
import type { Express, NextFunction, Request, Response } from 'express';
import * as soap from 'soap';
import { APP_CONFIG, type AppConfig } from '../config/app-config.js';
import { ProductsService } from '../products/products.service.js';

export const SOAP_PATH = '/soap/products';

const MAX_SOAP_REQUEST_BYTES = 100 * 1024;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function soapFault(faultcode: string, faultstring: string, code: string, statusCode = 500) {
  return { Fault: { faultcode, faultstring, detail: { code }, statusCode } };
}

@Injectable()
export class ProductsSoapService {
  private readonly logger = new Logger(ProductsSoapService.name);

  constructor(
    private readonly products: ProductsService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  buildWsdl(): string {
    const template = readFileSync(new URL('./products.wsdl', import.meta.url), 'utf8');
    const serviceUrl = `${this.config.publicBaseUrl}${SOAP_PATH}`;
    return template.replaceAll('{{SERVICE_URL}}', escapeXml(serviceUrl));
  }

  buildServiceDefinition() {
    return {
      ProductsService: {
        ProductsPort: {
          ListProducts: () => ({
            product: this.products.findAll().map(toSoapProduct),
          }),
          GetProductById: (args: { id?: unknown }) => {
            const id = Number(args?.id);
            if (!Number.isInteger(id) || id < 1) {
              throw soapFault('soap:Client', 'El id debe ser un entero positivo', 'INVALID_ID');
            }
            const product = this.products.findById(id);
            if (!product) {
              throw soapFault('soap:Client', `No existe el producto con id ${id}`, 'NOT_FOUND');
            }
            return { product: toSoapProduct(product) };
          },
        },
      },
    };
  }

  async publish(app: Express): Promise<void> {
    app.use(SOAP_PATH, (req: Request, res: Response, next: NextFunction) => {
      const length = Number(req.headers['content-length'] ?? 0);
      if (length > MAX_SOAP_REQUEST_BYTES) {
        res.status(413).end();
        return;
      }
      next();
    });

    await new Promise<void>((resolve, reject) => {
      const server = soap.listen(app, {
        path: SOAP_PATH,
        services: this.buildServiceDefinition(),
        xml: this.buildWsdl(),
        suppressStack: true,
        callback: (err: unknown) => (err ? reject(err) : resolve()),
      });
      server.log = (type: string, data: unknown) => {
        if (type === 'error') this.logger.warn(String(data));
      };
    });
    this.logger.log(`SOAP publicado en ${SOAP_PATH} (WSDL en ${SOAP_PATH}?wsdl)`);
  }
}

function toSoapProduct(p: Product) {
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    price: p.price.toFixed(2),
    description: p.description,
    createdAt: p.createdAt,
  };
}
