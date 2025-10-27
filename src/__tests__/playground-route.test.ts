import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PlaygroundSlide } from '@/config/playgroundContent';

describe('Playground route wiring', () => {
  beforeEach(async () => {
    // Ensure fresh module state and reset document context
    vi.resetModules();
    window.location.hash = '';
    document.title = 'WalleOS';
  });

  it('exposes a navigation entry for the Playground route', async () => {
    const contentModule = await import('@/config/content');
    const { navigation } = contentModule;

    const hasPlaygroundNav = navigation.some((item) => item.id === 'playground');
    expect(hasPlaygroundNav).toBe(true);
  });

  it('updates hash and title when navigating to the Playground route', async () => {
    const routerModule = await import('@/utils/router');
    const { navigateTo, getRouteTitle } = routerModule;

    expect(getRouteTitle('playground')).toBe('Playground');

    navigateTo('playground');

    expect(window.location.hash).toBe('#playground');
    expect(document.title).toBe('Playground - WalleOS');
  });
});

describe('Playground page layout', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renders a bento grid with cards for each slide', async () => {
    const [{ render }, { playgroundSlides }] = await Promise.all([
      import('@/routes/playground/index'),
      import('@/config/playgroundContent'),
    ]);

    document.body.innerHTML = render();

    const root = document.querySelector('[data-playground-root]');
    expect(root).not.toBeNull();

    const grid = root?.querySelector('.bento-grid-container');
    expect(grid).not.toBeNull();

    const cards = root?.querySelectorAll('[data-bento-card]') ?? [];
    expect(cards.length).toBe(playgroundSlides.length);

    playgroundSlides.forEach(({ title, category }) => {
      expect(root?.textContent?.includes(title)).toBe(true);
      expect(root?.textContent?.includes(category)).toBe(true);
    });
  });

  it('applies card size classes and accent styling', async () => {
    const [{ render }, { getBentoCardSize }] = await Promise.all([
      import('@/routes/playground/index'),
      import('@/config/playgroundContent'),
    ]);

    document.body.innerHTML = render();

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

    const mockSlides: PlaygroundSlide[] = Array.from({ length: 9 }, (_, index) => ({
      title: `Mock Slide ${index + 1}`,
      category: 'Mock Category',
      backgroundImage: `/mock-background-${index + 1}.jpg`,
      foregroundImage: `/mock-foreground-${index + 1}.png`,
    }));

    const actualModule = await vi.importActual<typeof import('@/config/playgroundContent')>(
      '@/config/playgroundContent',
    );

    vi.doMock('@/config/playgroundContent', () => ({
      ...actualModule,
      playgroundSlides: mockSlides,
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

    const { render } = await import('@/routes/playground/index');

    document.body.innerHTML = render();

    const cards = Array.from(document.querySelectorAll<HTMLElement>('[data-bento-card]'));
    expect(cards).toHaveLength(mockSlides.length);

    const overflowCards = cards.slice(7);
    expect(overflowCards).not.toHaveLength(0);

    overflowCards.forEach((card) => {
      const style = card.getAttribute('style') ?? '';
      expect(style.includes('grid-column: auto')).toBe(true);
      expect(style.includes('grid-row: auto')).toBe(true);
    });

    vi.doUnmock('@/config/playgroundContent');
    vi.resetModules();
  });
});
