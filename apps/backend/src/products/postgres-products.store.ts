import { ConflictException, Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import type { CreateProductInput, Product } from '@wslab/shared';
import { DatabaseService } from '../database/database.service.js';
import { PRODUCT_SEED } from './products.seed.js';
import type { ProductsStore } from './products-store.js';

interface ProductRow {
  id: number;
  name: string;
  category: string;
  price: string;
  description: string;
  created_at: Date;
}

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: Number(row.price),
    description: row.description,
    createdAt: row.created_at.toISOString(),
  };
}

const COLUMNS = 'id, name, category, price, description, created_at';

@Injectable()
export class PostgresProductsStore implements ProductsStore, OnModuleInit {
  private readonly logger = new Logger(PostgresProductsStore.name);

  constructor(private readonly db: DatabaseService) {}

  async onModuleInit(): Promise<void> {
    await this.db.ensureSchema();
    await this.seedIfEmpty();
  }

  async findAll(): Promise<Product[]> {
    const { rows } = await this.db.query<ProductRow>(
      `SELECT ${COLUMNS} FROM products ORDER BY id`,
    );
    return rows.map(toProduct);
  }

  async findById(id: number): Promise<Product | undefined> {
    const { rows } = await this.db.query<ProductRow>(
      `SELECT ${COLUMNS} FROM products WHERE id = $1`,
      [id],
    );
    return rows[0] ? toProduct(rows[0]) : undefined;
  }

  async create(input: CreateProductInput): Promise<Product> {
    try {
      const { rows } = await this.db.query<ProductRow>(
        `INSERT INTO products (name, category, price, description)
         VALUES ($1, $2, $3, $4)
         RETURNING ${COLUMNS}`,
        [input.name, input.category, input.price, input.description ?? ''],
      );
      return toProduct(rows[0]);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException(`Ya existe un producto con el nombre "${input.name}"`);
      }
      throw error;
    }
  }

  private async seedIfEmpty(): Promise<void> {
    const { rows } = await this.db.query<{ count: string }>('SELECT COUNT(*) AS count FROM products');
    if (Number(rows[0].count) > 0) {
      this.logger.log(`Catálogo existente con ${rows[0].count} productos`);
      return;
    }

    for (const product of PRODUCT_SEED) {
      await this.db.query(
        `INSERT INTO products (name, category, price, description)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (name) DO NOTHING`,
        [product.name, product.category, product.price, product.description],
      );
    }
    this.logger.log(`Catálogo inicializado con ${PRODUCT_SEED.length} productos`);
  }
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505';
}
