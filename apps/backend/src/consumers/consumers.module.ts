import { Module } from '@nestjs/common';
import { CountryInfoClient } from './country-info.client.js';
import { OpenMeteoClient } from './open-meteo.client.js';
import { OwnSoapClient } from './own-soap.client.js';
import { RssClient } from './rss.client.js';

@Module({
  providers: [OwnSoapClient, RssClient, OpenMeteoClient, CountryInfoClient],
  exports: [OwnSoapClient, RssClient, OpenMeteoClient, CountryInfoClient],
})
export class ConsumersModule {}
