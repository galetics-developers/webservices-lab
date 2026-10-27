import { Inject, Injectable } from '@nestjs/common';
import type { CountryInfo, GatewayResult } from '@wslab/shared';
import { APP_CONFIG, type AppConfig } from '../config/app-config.js';
import { ConsumerError } from './consumer-error.js';
import { execute } from './execute.js';
import { asArray, callSoapOperation, createSoapClient, soapText } from './soap-client.js';

@Injectable()
export class CountryInfoClient {
  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  getCountry(isoCode: string): Promise<GatewayResult<CountryInfo>> {
    const iso = isoCode.toUpperCase();
    return execute('country-info', 'SOAP', `${this.config.countryInfoEndpoint} (FullCountryInfo)`, async (trace) => {
      const client = await createSoapClient(
        this.config.countryInfoWsdlUrl,
        this.config.httpTimeoutMs,
        this.config.countryInfoEndpoint,
      );
      const { result, rawRequest, rawResponse } = await callSoapOperation(
        client,
        'FullCountryInfo',
        { sCountryISOCode: iso },
        this.config.httpTimeoutMs,
        trace,
      );

      const info = result?.FullCountryInfoResult;
      const name = soapText(info?.sName);
      if (!info || !name) {
        throw new ConsumerError('INVALID_RESPONSE', 'La respuesta SOAP no contiene FullCountryInfoResult');
      }
      if (/not found/i.test(name)) {
        throw new ConsumerError('NOT_FOUND', `El servicio no encontró el país ${iso}: ${name}`);
      }

      return {
        raw: rawResponse,
        rawRequest,
        data: {
          isoCode: soapText(info.sISOCode),
          name,
          capitalCity: soapText(info.sCapitalCity),
          phoneCode: soapText(info.sPhoneCode),
          continentCode: soapText(info.sContinentCode),
          currencyIsoCode: soapText(info.sCurrencyISOCode),
          flagUrl: soapText(info.sCountryFlag),
          languages: asArray(info.Languages?.tLanguage).map((l: any) => ({
            isoCode: soapText(l?.sISOCode),
            name: soapText(l?.sName),
          })),
        },
      };
    });
  }
}
