import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module.js';
import { APP_CONFIG, loadConfig, type AppConfig } from '../src/config/app-config.js';
import { setupApp } from '../src/setup-app.js';

export async function getFreePort(): Promise<number> {
  const server = createServer();
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  await new Promise<void>((resolve) => server.close(() => resolve()));
  return port;
}

export async function createTestApp(
  overrides: Partial<AppConfig> = {},
): Promise<{ app: INestApplication; config: AppConfig; baseUrl: string }> {
  const port = await getFreePort();
  const config: AppConfig = {
    ...loadConfig({}),
    port,
    publicBaseUrl: `http://127.0.0.1:${port}`,
    ...overrides,
  };

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(APP_CONFIG)
    .useValue(config)
    .compile();

  const app = moduleRef.createNestApplication({ logger: false });
  await setupApp(app);
  await app.listen(port, '127.0.0.1');
  return { app, config, baseUrl: config.publicBaseUrl };
}

export async function startLocalServer(
  handler: Parameters<typeof createServer>[1],
): Promise<{ server: Server; url: string }> {
  const server = createServer(handler);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  return { server, url: `http://127.0.0.1:${port}` };
}

export function closeServer(server: Server): Promise<void> {
  server.closeAllConnections();
  return new Promise((resolve) => server.close(() => resolve()));
}
