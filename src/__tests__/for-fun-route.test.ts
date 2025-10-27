import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PlaygroundSlide } from '@/config/playgroundContent';

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

    expect(getRouteTitle('playground')).toBe('Playground');

    navigateTo('playground');

    expect(window.location.hash).toBe('#for-fun');
    expect(document.title).toBe('For Fun - WalleOS');
  });
});

describe('for-fun page layout', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renders a bento grid with cards for each slide', async () => {
    const [{ renderForFunPage }, { forFunSlides }] = await Promise.all([
      import('@/components/ForFunPage'),
      import('@/config/forFunContent'),
    ]);

    document.body.innerHTML = renderForFunPage();

    const root = document.querySelector('[data-for-fun-root]');
    expect(root).not.toBeNull();

    const grid = root?.querySelector('.bento-grid-container');
    expect(grid).not.toBeNull();

    const cards = root?.querySelectorAll('[data-bento-card]') ?? [];
    expect(cards.length).toBe(forFunSlides.length);

    forFunSlides.forEach(({ title, category }) => {
      expect(root?.textContent?.includes(title)).toBe(true);
      expect(root?.textContent?.includes(category)).toBe(true);
    });
  });

  it('applies card size classes and accent styling', async () => {
    const [{ renderForFunPage }, { getBentoCardSize }] = await Promise.all([
      import('@/components/ForFunPage'),
      import('@/config/forFunContent'),
    ]);

    document.body.innerHTML = renderForFunPage();

    const cards = Array.from(document.querySelectorAll<HTMLElement>('[data-bento-card]'));
    expect(cards).not.toHaveLength(0);

    cards.forEach((card, index) => {
      const expectedSize = getBentoCardSize(index);
      expect(card.classList.contains(`bento-card-${expectedSize}`)).toBe(true);
      const style = card.getAttribute('style') ?? '';
      expect(style.includes('grid-column')).toBe(true);
      expect(style.includes('--bento-card-accent')).toBe(true);
    });
  });

  it('falls back to auto placement when slides exceed defined positions', async () => {
    vi.resetModules();

    const mockSlides: ForFunSlide[] = Array.from({ length: 9 }, (_, index) => ({
      title: `Mock Slide ${index + 1}`,
      category: 'Mock Category',
      backgroundImage: `/mock-background-${index + 1}.jpg`,
      foregroundImage: `/mock-foreground-${index + 1}.png`,
    }));

    const actualModule = await vi.importActual<typeof import('@/config/forFunContent')>(
      '@/config/forFunContent',
    );

    vi.doMock('@/config/forFunContent', () => ({
      ...actualModule,
      forFunSlides: mockSlides,
      getBentoCardSize: (index: number): ReturnType<typeof actualModule.getBentoCardSize> => {
        const fallbackSizes = ['xl', 'lg', 'tall', 'md', 'md', 'wide', 'lg'] as const;

        const slide = mockSlides[index];
        if (slide?.size) {
          return slide.size;
        }

        const fallbackIndex = ((index % fallbackSizes.length) + fallbackSizes.length) % fallbackSizes.length;
        return fallbackSizes[fallbackIndex] ?? 'md';
      },
    }));

    const { renderForFunPage } = await import('@/components/ForFunPage');

    document.body.innerHTML = renderForFunPage();

    const cards = Array.from(document.querySelectorAll<HTMLElement>('[data-bento-card]'));
    expect(cards).toHaveLength(mockSlides.length);

    const overflowCards = cards.slice(7);
    expect(overflowCards).not.toHaveLength(0);

    overflowCards.forEach((card) => {
      const style = card.getAttribute('style') ?? '';
      expect(style.includes('grid-column: auto')).toBe(true);
      expect(style.includes('grid-row: auto')).toBe(true);
    });

    vi.doUnmock('@/config/forFunContent');
    vi.resetModules();
  });
});
