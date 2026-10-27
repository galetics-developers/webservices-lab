import { Injectable } from '@nestjs/common';
import type { CreateProductInput, Product } from '@wslab/shared';

const SEED: Omit<Product, 'id' | 'createdAt'>[] = [
  {
    name: 'Teclado mecánico',
    category: 'Periféricos',
    price: 1299.0,
    description: 'Teclado de ejemplo con switches táctiles.',
  },
  {
    name: 'Monitor 24 pulgadas',
    category: 'Pantallas',
    price: 3499.9,
    description: 'Monitor de ejemplo con resolución Full HD.',
  },
  {
    name: 'Cable USB-C',
    category: 'Accesorios',
    price: 189.5,
    description: 'Cable de ejemplo de un metro.',
  },
];

@Injectable()
export class ProductsService {
  private readonly products: Product[];
  private nextId: number;

  constructor() {
    const createdAt = new Date('2026-01-15T12:00:00.000Z').toISOString();
    this.products = SEED.map((p, index) => ({ ...p, id: index + 1, createdAt }));
    this.nextId = this.products.length + 1;
  }

  findAll(): Product[] {
    return this.products.map((p) => ({ ...p }));
  }

  findById(id: number): Product | undefined {
    const product = this.products.find((p) => p.id === id);
    return product ? { ...product } : undefined;
  }

  create(input: CreateProductInput): Product {
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
