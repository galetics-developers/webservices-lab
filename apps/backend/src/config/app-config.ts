import { networkInterfaces } from 'node:os';

export const APP_CONFIG = Symbol('APP_CONFIG');

export const FRONTEND_PORT = 3000;

export interface DatabaseConfig {
  url: string;
  ssl: boolean;
  maxConnections: number;
  connectionTimeoutMs: number;
}

export interface AppConfig {
  port: number;
  publicBaseUrl: string;
  frontendOrigins: string[];
  httpTimeoutMs: number;
  openMeteoBaseUrl: string;
  countryInfoWsdlUrl: string;
  countryInfoEndpoint: string;
  externalRssUrl: string;
  database?: DatabaseConfig;
}

const DEFAULTS = {
  BACKEND_PORT: '4000',
  PUBLIC_BASE_URL: 'http://localhost:4000',
  FRONTEND_EXTRA_ORIGINS: '',
  HTTP_TIMEOUT_MS: '8000',
  OPEN_METEO_BASE_URL: 'https://api.open-meteo.com/v1/forecast',
  COUNTRY_INFO_WSDL_URL:
    'https://webservices.oorsprong.org/websamples.countryinfo/CountryInfoService.wso?WSDL',
  COUNTRY_INFO_ENDPOINT:
    'https://webservices.oorsprong.org/websamples.countryinfo/CountryInfoService.wso',
  EXTERNAL_RSS_URL: 'https://feeds.bbci.co.uk/mundo/rss.xml',
  DATABASE_SSL: 'true',
  DATABASE_MAX_CONNECTIONS: '5',
  DATABASE_CONNECTION_TIMEOUT_MS: '10000',
} as const;

type EnvKey = keyof typeof DEFAULTS;

function read(env: NodeJS.ProcessEnv, key: EnvKey): string {
  const value = env[key]?.trim();
  return value ? value : DEFAULTS[key];
}

function parseHttpUrl(key: string, value: string): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`La variable ${key} no contiene una URL válida: "${value}"`);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`La variable ${key} debe usar http o https`);
  }
  return url;
}

function readUrl(env: NodeJS.ProcessEnv, key: EnvKey): string {
  return parseHttpUrl(key, read(env, key)).href;
}

function readInt(env: NodeJS.ProcessEnv, key: EnvKey, min: number, max: number): number {
  const value = Number(read(env, key));
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`La variable ${key} debe ser un entero entre ${min} y ${max}`);
  }
  return value;
}

function readBool(env: NodeJS.ProcessEnv, key: EnvKey): boolean {
  const value = read(env, key).toLowerCase();
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  throw new Error(`La variable ${key} debe ser true o false`);
}

function readPort(env: NodeJS.ProcessEnv): number {
  const platform = env.PORT?.trim();
  const local = env.BACKEND_PORT?.trim();
  const source = platform ? 'PORT' : 'BACKEND_PORT';
  const raw = platform || local || DEFAULTS.BACKEND_PORT;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1 || value > 65535) {
    throw new Error(`La variable ${source} debe ser un entero entre 1 y 65535`);
  }
  return value;
}

function readDatabase(env: NodeJS.ProcessEnv): DatabaseConfig | undefined {
  const url = env.DATABASE_URL?.trim();
  if (!url) return undefined;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('La variable DATABASE_URL no contiene una URL válida');
  }
  if (parsed.protocol !== 'postgres:' && parsed.protocol !== 'postgresql:') {
    throw new Error('La variable DATABASE_URL debe usar el esquema postgres o postgresql');
  }
  if (!parsed.pathname.replace(/^\//, '')) {
    throw new Error('La variable DATABASE_URL debe incluir el nombre de la base de datos');
  }

  return {
    url,
    ssl: readBool(env, 'DATABASE_SSL'),
    maxConnections: readInt(env, 'DATABASE_MAX_CONNECTIONS', 1, 100),
    connectionTimeoutMs: readInt(env, 'DATABASE_CONNECTION_TIMEOUT_MS', 100, 60000),
  };
}

export function localIpv4Addresses(): string[] {
  return Object.values(networkInterfaces())
    .flat()
    .filter((net) => net && net.family === 'IPv4' && !net.internal)
    .map((net) => net!.address);
}

export function defaultFrontendOrigins(): string[] {
  const hosts = ['localhost', '127.0.0.1', ...localIpv4Addresses()];
  return hosts.map((host) => `http://${host}:${FRONTEND_PORT}`);
}

function readOrigins(env: NodeJS.ProcessEnv, includeLocal: boolean): string[] {
  const extra = read(env, 'FRONTEND_EXTRA_ORIGINS')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => parseHttpUrl('FRONTEND_EXTRA_ORIGINS', value).origin);
  const local = includeLocal ? defaultFrontendOrigins() : [`http://localhost:${FRONTEND_PORT}`];
  return [...new Set([...local, ...extra])];
}

export function loadConfig(
  env: NodeJS.ProcessEnv = process.env,
  options: { detectLocalNetwork?: boolean } = {},
): AppConfig {
  const publicBase = parseHttpUrl('PUBLIC_BASE_URL', read(env, 'PUBLIC_BASE_URL'));
  if (publicBase.search || publicBase.hash) {
    throw new Error('PUBLIC_BASE_URL no debe incluir parámetros de consulta ni fragmentos');
  }

  return {
    port: readPort(env),
    publicBaseUrl: publicBase.href.replace(/\/$/, ''),
    frontendOrigins: readOrigins(env, options.detectLocalNetwork ?? true),
    httpTimeoutMs: readInt(env, 'HTTP_TIMEOUT_MS', 100, 60000),
    openMeteoBaseUrl: readUrl(env, 'OPEN_METEO_BASE_URL'),
    countryInfoWsdlUrl: readUrl(env, 'COUNTRY_INFO_WSDL_URL'),
    countryInfoEndpoint: readUrl(env, 'COUNTRY_INFO_ENDPOINT'),
    externalRssUrl: readUrl(env, 'EXTERNAL_RSS_URL'),
    database: readDatabase(env),
  };
}
