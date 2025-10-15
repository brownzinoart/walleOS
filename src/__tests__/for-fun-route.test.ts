import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('for-fun route wiring', () => {
  beforeEach(async () => {
    // Ensure fresh module state and reset document context
    vi.resetModules();
    window.location.hash = '';
    document.title = 'WalleOS';
  });

  it('exposes a navigation entry for the For Fun route', async () => {
    const contentModule = await import('@/config/content');
    const { navigation } = contentModule;

    const hasForFunNav = navigation.some((item) => item.id === 'for-fun');
    expect(hasForFunNav).toBe(true);
  });

  it('updates hash and title when navigating to the For Fun route', async () => {
    const routerModule = await import('@/utils/router');
    const { navigateTo, getRouteTitle } = routerModule;

    expect(getRouteTitle('for-fun')).toBe('For Fun');

    navigateTo('for-fun');

    expect(window.location.hash).toBe('#for-fun');
    expect(document.title).toBe('For Fun - WalleOS');
  });
});
