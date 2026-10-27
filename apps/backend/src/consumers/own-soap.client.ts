import { Inject, Injectable } from '@nestjs/common';
import type { GatewayResult, Product } from '@wslab/shared';
import { APP_CONFIG, type AppConfig } from '../config/app-config.js';
import { SOAP_PATH } from '../soap/products-soap.service.js';
import { ConsumerError } from './consumer-error.js';
import { execute } from './execute.js';
import { asArray, callSoapOperation, createSoapClient, soapText } from './soap-client.js';

@Injectable()
export class OwnSoapClient {
  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  private get endpoint(): string {
    return `${this.config.publicBaseUrl}${SOAP_PATH}`;
  }

  listProducts(): Promise<GatewayResult<Product[]>> {
    return execute('own-soap', 'SOAP', `${this.endpoint} (ListProducts)`, async (trace) => {
      const client = await createSoapClient(`${this.endpoint}?wsdl`, this.config.httpTimeoutMs);
      const { result, rawRequest, rawResponse } = await callSoapOperation(
        client,
        'ListProducts',
        {},
        this.config.httpTimeoutMs,
        trace,
      );
      return { data: asArray(result?.product).map(toProduct), raw: rawResponse, rawRequest };
    });
  }

  getProductById(id: number): Promise<GatewayResult<Product>> {
    return execute('own-soap', 'SOAP', `${this.endpoint} (GetProductById)`, async (trace) => {
      const client = await createSoapClient(`${this.endpoint}?wsdl`, this.config.httpTimeoutMs);
      const { result, rawRequest, rawResponse } = await callSoapOperation(
        client,
        'GetProductById',
        { id },
        this.config.httpTimeoutMs,
        trace,
      );
      return { data: toProduct(result?.product), raw: rawResponse, rawRequest };
    });
  }
}

function toProduct(raw: any): Product {
  const product: Product = {
    id: Number(soapText(raw?.id)),
    name: soapText(raw?.name),
    category: soapText(raw?.category),
    price: Number(soapText(raw?.price)),
    description: soapText(raw?.description),
    createdAt: soapText(raw?.createdAt),
  };
  if (!Number.isInteger(product.id) || !product.name || !Number.isFinite(product.price)) {
    throw new ConsumerError('INVALID_RESPONSE', 'La respuesta SOAP no contiene un producto válido');
  }
  return product;
}
