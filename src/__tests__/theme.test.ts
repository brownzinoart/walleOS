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
    expect(seen[0].endsWith('->light')).toBe(true);
    expect(seen[seen.length - 1].endsWith('->dark')).toBe(true);

    unsubscribe();
  });
});
