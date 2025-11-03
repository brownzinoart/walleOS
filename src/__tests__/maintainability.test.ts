import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('frontend maintainability configuration', () => {
  const rootDir = join(import.meta.dirname, '..', '..');
  const tsconfigEslintPath = join(rootDir, 'tsconfig.eslint.json');
  const packageJsonPath = join(rootDir, 'package.json');

  it('provides tsconfig.eslint.json including tests and controllers directories', () => {
    const tsconfig = JSON.parse(readFileSync(tsconfigEslintPath, 'utf-8'));
    expect(tsconfig.extends).toBe('./tsconfig.json');
    const include = tsconfig.include as string[];
    expect(include).toContain('tests/**/*.ts');
    expect(include).toContain('src/controllers/**/*.ts');
  });

  it('pins packageManager to npm for consistent tooling', () => {
    const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    expect(pkg.packageManager).toMatch(/^npm@/);
  });
});
