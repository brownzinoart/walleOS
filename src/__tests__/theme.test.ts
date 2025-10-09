import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('theme utils', () => {
  beforeEach(async () => {
    vi.resetModules();
  });

  it('gets and sets theme, notifies subscribers', async () => {
    const themeMod = await import('@/utils/theme');
    const { getTheme, setTheme, toggleTheme, subscribeToTheme, initTheme } = themeMod as typeof import('@/utils/theme');

    // Initialize to establish baseline theme
    initTheme();

    // Track notifications
    const seen: Array<string> = [];
    const unsubscribe = subscribeToTheme((next, prev) => {
      // Record as `${prev}->${next}`
      seen.push(`${prev}->${next}`);
    });

    // Set to light and verify
    setTheme('light');
    expect(getTheme()).toBe('light');

    // Toggle should switch to dark
    toggleTheme();
    expect(getTheme()).toBe('dark');

    // Verify notifications captured transitions
    expect(seen.length).toBeGreaterThanOrEqual(2);
    const firstTransition = seen[0];
    if (!firstTransition) {
      throw new Error('expected at least one theme transition');
    }
    const lastTransition = seen[seen.length - 1];
    if (!lastTransition) {
      throw new Error('expected a final theme transition value');
    }
    expect(firstTransition.endsWith('->light')).toBe(true);
    expect(lastTransition.endsWith('->dark')).toBe(true);

    unsubscribe();
  });
});
