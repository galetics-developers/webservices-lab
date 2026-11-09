import { readFileSync } from 'node:fs';
import { Injectable, Logger, type OnApplicationShutdown } from '@nestjs/common';
import pg from 'pg';
import type { Pool as PgPool, QueryResult, QueryResultRow } from 'pg';
import type { DatabaseConfig } from '../config/app-config.js';

const { Pool } = pg;

@Injectable()
export class DatabaseService implements OnApplicationShutdown {
  private readonly logger = new Logger(DatabaseService.name);
  private readonly pool: PgPool;

  constructor(private readonly settings: DatabaseConfig) {
    this.pool = new Pool({
      connectionString: this.settings.url,
      ssl: this.settings.ssl ? { rejectUnauthorized: false } : undefined,
      max: this.settings.maxConnections,
      connectionTimeoutMillis: this.settings.connectionTimeoutMs,
      idleTimeoutMillis: 30_000,
      application_name: 'wslab-backend',
    });

    this.pool.on('error', (error) => {
      this.logger.error(`Error en una conexión inactiva: ${error.message}`);
    });
  }

  query<T extends QueryResultRow>(sql: string, values: unknown[] = []): Promise<QueryResult<T>> {
    return this.pool.query<T>(sql, values);
  }

  async ping(): Promise<void> {
    await this.pool.query('SELECT 1');
  }

  async ensureSchema(): Promise<void> {
    const sql = readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');
    await this.pool.query(sql);
    this.logger.log('Esquema verificado');
  }

  async onApplicationShutdown(): Promise<void> {
    await this.pool.end();
    this.logger.log('Pool de conexiones cerrado');
  }
}
