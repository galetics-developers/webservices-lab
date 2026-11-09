import { Global, Module } from '@nestjs/common';
import { APP_CONFIG, type AppConfig } from '../config/app-config.js';
import { DatabaseService } from './database.service.js';

@Global()
@Module({
  providers: [
    {
      provide: DatabaseService,
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig): DatabaseService | null =>
        config.database ? new DatabaseService(config.database) : null,
    },
  ],
  exports: [DatabaseService],
})
export class DatabaseModule {}
