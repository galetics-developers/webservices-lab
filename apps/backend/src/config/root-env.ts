import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

export function findWorkspaceRoot(start: string = process.cwd()): string | undefined {
  let dir = start;
  for (;;) {
    if (existsSync(join(dir, 'pnpm-workspace.yaml'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
}

export function loadRootEnv(): string | undefined {
  const root = findWorkspaceRoot();
  if (!root) return undefined;
  const file = join(root, '.env');
  if (!existsSync(file)) return undefined;
  process.loadEnvFile(file);
  return file;
}
