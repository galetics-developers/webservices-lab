import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { APP_CONFIG, type AppConfig } from './config/app-config.js';
import { loadRootEnv } from './config/root-env.js';
import { setupApp } from './setup-app.js';

const envFile = loadRootEnv();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await setupApp(app);

  const config = app.get<AppConfig>(APP_CONFIG);
  await app.listen(config.port);

  const logger = new Logger('Bootstrap');
  logger.log(envFile ? `Variables de entorno: ${envFile}` : 'Sin archivo .env en la raíz; se usan los valores por defecto');
  logger.log(`Backend en ${config.publicBaseUrl}`);
  logger.log(`REST: ${config.publicBaseUrl}/api/products`);
  logger.log(`SOAP: ${config.publicBaseUrl}/soap/products?wsdl`);
  logger.log(`RSS:  ${config.publicBaseUrl}/rss/products.xml`);
  logger.log(`CORS: ${config.frontendOrigins.join(', ')}`);
}
await bootstrap();
