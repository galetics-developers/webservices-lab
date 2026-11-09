import { Injectable } from '@nestjs/common';
import type { CreateProductInput, Product } from '@wslab/shared';
import { PRODUCT_SEED, SEED_CREATED_AT } from './products.seed.js';
import type { ProductsStore } from './products-store.js';

@Injectable()
export class InMemoryProductsStore implements ProductsStore {
  private readonly products: Product[];
  private nextId: number;

  constructor() {
    this.products = PRODUCT_SEED.map((p, index) => ({
      ...p,
      id: index + 1,
      createdAt: SEED_CREATED_AT,
    }));
    this.nextId = this.products.length + 1;
  }

  async findAll(): Promise<Product[]> {
    return this.products.map((p) => ({ ...p }));
  }

  async findById(id: number): Promise<Product | undefined> {
    const product = this.products.find((p) => p.id === id);
    return product ? { ...product } : undefined;
  }

  async create(input: CreateProductInput): Promise<Product> {
    const product: Product = {
      id: this.nextId++,
      name: input.name,
      category: input.category,
      price: input.price,
      description: input.description ?? '',
      createdAt: new Date().toISOString(),
    };
    this.products.push(product);
    return { ...product };
  }
}
