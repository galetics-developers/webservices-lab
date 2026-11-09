import type { CreateProductInput, Product } from '@wslab/shared';

export const PRODUCTS_STORE = Symbol('PRODUCTS_STORE');

export interface ProductsStore {
  findAll(): Promise<Product[]>;
  findById(id: number): Promise<Product | undefined>;
  create(input: CreateProductInput): Promise<Product>;
}
