import { Module } from '@nestjs/common';
import { ProductsModule } from '../products/products.module.js';
import { ProductsSoapService } from './products-soap.service.js';

@Module({
  imports: [ProductsModule],
  providers: [ProductsSoapService],
  exports: [ProductsSoapService],
})
export class SoapModule {}
