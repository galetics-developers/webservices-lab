import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { findWorkspaceRoot } from './root-env.js';

describe('findWorkspaceRoot', () => {
  it('encuentra la raíz del monorepo desde la carpeta del backend', () => {
    const root = findWorkspaceRoot(join(process.cwd(), 'src', 'config'));
    expect(root).toBeDefined();
    expect(existsSync(join(root!, 'pnpm-workspace.yaml'))).toBe(true);
    expect(existsSync(join(root!, 'apps', 'backend'))).toBe(true);
  });

  it('devuelve undefined fuera de un monorepo', () => {
    expect(findWorkspaceRoot('/')).toBeUndefined();
  });
});
