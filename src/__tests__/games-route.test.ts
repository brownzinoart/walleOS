// src/__tests__/games-route.test.ts
import { describe, it, expect, beforeEach } from 'vitest';

describe('Games route component', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('exports render, init, and cleanup functions', async () => {
    const gamesModule = await import('@/routes/playground/games');

    expect(gamesModule.render).toBeDefined();
    expect(typeof gamesModule.render).toBe('function');
    expect(gamesModule.init).toBeDefined();
    expect(typeof gamesModule.init).toBe('function');
    expect(gamesModule.cleanup).toBeDefined();
    expect(typeof gamesModule.cleanup).toBe('function');
  });
});
