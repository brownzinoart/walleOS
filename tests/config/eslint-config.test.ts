import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('lint configuration', () => {
  const rootDir = join(import.meta.dirname, '..', '..');
  const eslintConfigPath = join(rootDir, '.eslintrc.json');
  const eslintIgnorePath = join(rootDir, '.eslintignore');
  const packageJsonPath = join(rootDir, 'package.json');

  const loadJson = (path: string) => JSON.parse(readFileSync(path, 'utf-8'));

  it('enables the security plugin and recommended ruleset', () => {
    const cfg = loadJson(eslintConfigPath);

    expect(cfg.plugins).toContain('security');
    expect(cfg.rules['security/detect-object-injection']).toBeDefined();
  });

  it('does not ignore the tests directory in eslintignore', () => {
    const ignoreContents = readFileSync(eslintIgnorePath, 'utf-8');
    expect(ignoreContents).not.toMatch(/^tests$/m);
  });

  it('configures lint-staged tasks', () => {
    const pkg = loadJson(packageJsonPath);
    expect(pkg['lint-staged']).toBeDefined();
    const tsCommands = pkg['lint-staged']['*.{ts,tsx}'];
    expect(Array.isArray(tsCommands)).toBe(true);
    expect(tsCommands.some((cmd: string) => cmd.startsWith('eslint'))).toBe(true);
  });
});
