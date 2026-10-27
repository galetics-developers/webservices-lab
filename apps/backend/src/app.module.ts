import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module.js';
import { GatewayModule } from './gateway/gateway.module.js';
import { RestModule } from './rest/rest.module.js';
import { RssModule } from './rss/rss.module.js';
import { SoapModule } from './soap/soap.module.js';

@Module({
  imports: [ConfigModule, RestModule, SoapModule, RssModule, GatewayModule],
})
export class AppModule {}
