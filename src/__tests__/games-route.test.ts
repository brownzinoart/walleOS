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

  it('shows first game by default and hides others', async () => {
    const { render, init } = await import('@/routes/playground/games');

    document.body.innerHTML = render();
    init();

    const simonFrame = document.querySelector('[data-game-frame="simon-says"]') as HTMLElement;
    const wordFrame = document.querySelector('[data-game-frame="word-search"]') as HTMLElement;

    expect(simonFrame.style.display).not.toBe('none');
    expect(wordFrame.style.display).toBe('none');
  });

  it('switches games when toggle button is clicked', async () => {
    const { render, init } = await import('@/routes/playground/games');

    document.body.innerHTML = render();
    init();

    const wordSearchBtn = document.querySelector('[data-game-id="word-search"]') as HTMLButtonElement;
    const simonFrame = document.querySelector('[data-game-frame="simon-says"]') as HTMLElement;
    const wordFrame = document.querySelector('[data-game-frame="word-search"]') as HTMLElement;

    wordSearchBtn.click();

    expect(simonFrame.style.display).toBe('none');
    expect(wordFrame.style.display).not.toBe('none');
    expect(wordSearchBtn.getAttribute('aria-pressed')).toBe('true');
  });

  it('removes event listeners on cleanup', async () => {
    const { render, init, cleanup } = await import('@/routes/playground/games');

    document.body.innerHTML = render();
    init();

    const root = document.querySelector('[data-games-root]');
    const simonFrame = document.querySelector('[data-game-frame="simon-says"]') as HTMLElement;
    const wordFrame = document.querySelector('[data-game-frame="word-search"]') as HTMLElement;
    const wordSearchBtn = document.querySelector('[data-game-id="word-search"]') as HTMLButtonElement;

    // Verify initial state - first game is showing
    expect(simonFrame.style.display).toBe('block');
    expect(wordFrame.style.display).toBe('none');

    // Switch to second game
    wordSearchBtn.click();
    expect(simonFrame.style.display).toBe('none');
    expect(wordFrame.style.display).toBe('block');

    // Run cleanup
    cleanup();

    // After cleanup, root should still exist
    expect(root).not.toBeNull();

    // Clicking buttons after cleanup should not switch games (listeners removed)
    const simonBtn = document.querySelector('[data-game-id="simon-says"]') as HTMLButtonElement;
    simonBtn.click();

    // Games should remain in same state (word-search visible, simon-says hidden)
    expect(simonFrame.style.display).toBe('none');
    expect(wordFrame.style.display).toBe('block');
  });
});
