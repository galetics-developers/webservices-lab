import { Logger, Module } from '@nestjs/common';
import { APP_CONFIG, type AppConfig } from '../config/app-config.js';
import { DatabaseService } from '../database/database.service.js';
import { InMemoryProductsStore } from './in-memory-products.store.js';
import { PostgresProductsStore } from './postgres-products.store.js';
import { PRODUCTS_STORE, type ProductsStore } from './products-store.js';
import { ProductsService } from './products.service.js';

@Module({
  providers: [
    InMemoryProductsStore,
    {
      provide: PRODUCTS_STORE,
      inject: [APP_CONFIG, DatabaseService, InMemoryProductsStore],
      useFactory: (
        config: AppConfig,
        db: DatabaseService | null,
        memory: InMemoryProductsStore,
      ): ProductsStore => {
        const logger = new Logger('ProductsStore');
        if (config.database && db) {
          logger.log('Catálogo persistido en PostgreSQL');
          return new PostgresProductsStore(db);
        }
        logger.log('Catálogo en memoria: no se definió DATABASE_URL');
        return memory;
      },
    },
    ProductsService,
  ],
  exports: [ProductsService],
})
export class ProductsModule {}
