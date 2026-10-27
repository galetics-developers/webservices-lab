import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import type { Product } from '@wslab/shared';
import { ProductsService } from '../products/products.service.js';
import { CreateProductDto } from './create-product.dto.js';

@Controller('api/products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  findAll(): Product[] {
    return this.products.findAll();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateProductDto): Product {
    return this.products.create(dto);
  }
}
