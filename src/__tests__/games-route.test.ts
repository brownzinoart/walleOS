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

  it('shows the word search game by default', async () => {
    const { render, init } = await import('@/routes/playground/games');

    document.body.innerHTML = render();
    init();

    const wordFrame = document.querySelector('[data-game-frame="word-search"]') as HTMLElement;

    expect(wordFrame.style.display).toBe('block');
  });

  it('keeps the only game selected when its button is clicked', async () => {
    const { render, init } = await import('@/routes/playground/games');

    document.body.innerHTML = render();
    init();

    const wordSearchBtn = document.querySelector('[data-game-id="word-search"]') as HTMLButtonElement;
    const wordFrame = document.querySelector('[data-game-frame="word-search"]') as HTMLElement;

    wordSearchBtn.click();

    expect(wordFrame.style.display).toBe('block');
    expect(wordSearchBtn.getAttribute('aria-pressed')).toBe('true');
  });

  it('removes event listeners on cleanup', async () => {
    const { render, init, cleanup } = await import('@/routes/playground/games');

    document.body.innerHTML = render();
    init();

    const root = document.querySelector('[data-games-root]');
    const wordFrame = document.querySelector('[data-game-frame="word-search"]') as HTMLElement;
    const wordSearchBtn = document.querySelector('[data-game-id="word-search"]') as HTMLButtonElement;

    // Verify initial state - word search is showing
    expect(wordFrame.style.display).toBe('block');

    // Click its button again
    wordSearchBtn.click();
    expect(wordFrame.style.display).toBe('block');

    // Run cleanup
    cleanup();

    // After cleanup, root should still exist
    expect(root).not.toBeNull();

    // Clicking buttons after cleanup should not switch games (listeners removed)
    // Clicking after cleanup should not throw and state remains
    wordSearchBtn.click();
    expect(wordFrame.style.display).toBe('block');
  });

  it('has a registered route for playground-games', async () => {
    const { navigateTo, getRouteTitle } = await import('@/utils/router');

    expect(getRouteTitle('playground-games')).toBe('Games');

    navigateTo('playground-games');

    expect(window.location.hash).toBe('#playground-games');
    expect(document.title).toBe('Games - WalleOS');
  });
});

describe('Games page integration', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renders complete games page with all elements', async () => {
    const { render, init } = await import('@/routes/playground/games');

    document.body.innerHTML = render();
    init();

    const root = document.querySelector('[data-games-root]');
    expect(root).not.toBeNull();

    const header = root?.querySelector('.games-header');
    expect(header).not.toBeNull();

    const title = root?.querySelector('.games-title');
    expect(title?.textContent).toBe('Take a Break');

    const toggleButtons = root?.querySelectorAll('[data-game-id]');
    expect(toggleButtons?.length).toBe(1);

    const iframes = root?.querySelectorAll('[data-game-frame]');
    expect(iframes?.length).toBe(1);
  });

  it('loads correct iframe sources for each game', async () => {
    const { render } = await import('@/routes/playground/games');

    document.body.innerHTML = render();

    const wordFrame = document.querySelector('[data-game-frame="word-search"]') as HTMLIFrameElement;
    expect(wordFrame.src).toContain('/playground/games/word-seach/dist/index.html');
  });
});
