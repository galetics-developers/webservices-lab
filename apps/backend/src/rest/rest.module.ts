import { Module } from '@nestjs/common';
import { ProductsModule } from '../products/products.module.js';
import { ProductsController } from './products.controller.js';

@Module({
  imports: [ProductsModule],
  controllers: [ProductsController],
})
export class RestModule {}
