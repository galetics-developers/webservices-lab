import { existsSync, readFileSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { dirname, join } from 'node:path';
import { parseEnv } from 'node:util';
import type { NextConfig } from 'next';

function findWorkspaceRoot(start: string): string | undefined {
  let dir = start;
  for (;;) {
    if (existsSync(join(dir, 'pnpm-workspace.yaml'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
}

function readRootEnv(): Record<string, string | undefined> {
  const root = findWorkspaceRoot(process.cwd());
  if (!root) return {};
  const file = join(root, '.env');
  return existsSync(file) ? parseEnv(readFileSync(file, 'utf8')) : {};
}

const rootEnv = readRootEnv();

function setting(key: string): string {
  return (process.env[key] ?? rootEnv[key] ?? '').trim();
}

function extraOriginHosts(): string[] {
  return setting('FRONTEND_EXTRA_ORIGINS')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .flatMap((value) => {
      try {
        return [new URL(value).hostname];
      } catch {
        return [];
      }
    });
}

function localIpv4Addresses(): string[] {
  return Object.values(networkInterfaces())
    .flat()
    .filter((net) => net && net.family === 'IPv4' && !net.internal)
    .map((net) => net!.address);
}

const nextConfig: NextConfig = {
  output: setting('NEXT_OUTPUT') === 'export' ? 'export' : undefined,
  transpilePackages: ['@wslab/shared'],
  poweredByHeader: false,
  agentRules: false,
  allowedDevOrigins: [...new Set(['127.0.0.1', ...localIpv4Addresses(), ...extraOriginHosts()])],
  env: {
    NEXT_PUBLIC_API_URL: setting('NEXT_PUBLIC_API_URL'),
    NEXT_PUBLIC_BACKEND_PORT: setting('BACKEND_PORT') || '4000',
  },
};

export default nextConfig;