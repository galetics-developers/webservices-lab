import { Module } from '@nestjs/common';
import { ProductsModule } from '../products/products.module.js';
import { RssController } from './rss.controller.js';

@Module({
  imports: [ProductsModule],
  controllers: [RssController],
})
export class RssModule {}
