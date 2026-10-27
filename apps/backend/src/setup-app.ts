import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { APP_CONFIG, type AppConfig } from './config/app-config.js';
import { ProductsSoapService } from './soap/products-soap.service.js';

export async function setupApp(app: INestApplication): Promise<void> {
  const config = app.get<AppConfig>(APP_CONFIG);
  const express = app.getHttpAdapter().getInstance();

  express.disable('x-powered-by');

  app.enableCors({
    origin: config.frontendOrigins,
    methods: ['GET', 'POST'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.get(ProductsSoapService).publish(express);
  app.enableShutdownHooks();
}
