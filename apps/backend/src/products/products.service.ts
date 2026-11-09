import { Inject, Injectable } from '@nestjs/common';
import type { CreateProductInput, Product } from '@wslab/shared';
import { PRODUCTS_STORE, type ProductsStore } from './products-store.js';

@Injectable()
export class ProductsService {
  constructor(@Inject(PRODUCTS_STORE) private readonly store: ProductsStore) {}

  findAll(): Promise<Product[]> {
    return this.store.findAll();
  }

  findById(id: number): Promise<Product | undefined> {
    return this.store.findById(id);
  }

  create(input: CreateProductInput): Promise<Product> {
    return this.store.create(input);
  }
}
