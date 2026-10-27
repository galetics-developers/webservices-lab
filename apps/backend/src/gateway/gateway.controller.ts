import { Controller, Get, HttpStatus, Logger, Param, Query, Res } from '@nestjs/common';
import type { GatewayErrorCode, GatewayResult } from '@wslab/shared';
import type { Response } from 'express';
import { CountryInfoClient } from '../consumers/country-info.client.js';
import { OpenMeteoClient } from '../consumers/open-meteo.client.js';
import { OwnSoapClient } from '../consumers/own-soap.client.js';
import { RssClient } from '../consumers/rss.client.js';
import { CountryParams, ProductIdParams, WeatherQuery } from './gateway.dto.js';

const STATUS_BY_ERROR: Record<GatewayErrorCode, number> = {
  NOT_FOUND: HttpStatus.NOT_FOUND,
  TIMEOUT: HttpStatus.GATEWAY_TIMEOUT,
  CONNECTION_ERROR: HttpStatus.BAD_GATEWAY,
  UPSTREAM_ERROR: HttpStatus.BAD_GATEWAY,
  SOAP_FAULT: HttpStatus.BAD_GATEWAY,
  INVALID_RESPONSE: HttpStatus.BAD_GATEWAY,
};

@Controller('api/gateway')
export class GatewayController {
  private readonly logger = new Logger(GatewayController.name);

  constructor(
    private readonly ownSoap: OwnSoapClient,
    private readonly rss: RssClient,
    private readonly openMeteo: OpenMeteoClient,
    private readonly countryInfo: CountryInfoClient,
  ) {}

  @Get('soap/products')
  async soapProducts(@Res({ passthrough: true }) res: Response) {
    return this.reply(res, await this.ownSoap.listProducts());
  }

  @Get('soap/products/:id')
  async soapProduct(@Param() params: ProductIdParams, @Res({ passthrough: true }) res: Response) {
    return this.reply(res, await this.ownSoap.getProductById(params.id));
  }

  @Get('rss/products')
  async rssProducts(@Res({ passthrough: true }) res: Response) {
    return this.reply(res, await this.rss.readOwnFeed());
  }

  @Get('external/weather')
  async weather(@Query() query: WeatherQuery, @Res({ passthrough: true }) res: Response) {
    return this.reply(res, await this.openMeteo.getCurrentWeather(query.city));
  }

  @Get('external/countries/:iso')
  async country(@Param() params: CountryParams, @Res({ passthrough: true }) res: Response) {
    return this.reply(res, await this.countryInfo.getCountry(params.iso));
  }

  @Get('external/rss')
  async externalRss(@Res({ passthrough: true }) res: Response) {
    return this.reply(res, await this.rss.readExternalFeed());
  }

  private reply<T>(res: Response, result: GatewayResult<T>): GatewayResult<T> {
    if (!result.ok && result.error) {
      this.logger.warn(`[${result.source}] ${result.error.code}: ${result.error.message}`);
      res.status(STATUS_BY_ERROR[result.error.code]);
    }
    return result;
  }
}
