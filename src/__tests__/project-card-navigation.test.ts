import { beforeEach, describe, expect, it, vi } from 'vitest';

const navigateToMock = vi.fn();

const matchMediaMock = vi.fn().mockImplementation((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: matchMediaMock,
});

vi.mock('@/utils/router', () => ({
  navigateTo: navigateToMock,
  getCurrentRoute: vi.fn(() => 'home'),
  getRouteTitle: vi.fn(() => 'Home'),
}));

vi.mock('@/utils/performance', async () => {
  const noop = () => {};
  const throttled = (fn: (...args: unknown[]) => void) => {
    const wrapper = (...args: unknown[]) => fn(...args);
    (wrapper as typeof wrapper & { cancel: () => void }).cancel = () => {};
    return wrapper;
  };

  return {
    prefersReducedMotion: () => true,
    addWillChange: noop,
    removeWillChange: noop,
    rafThrottle: throttled,
    observeIntersection: noop,
  };
});

describe('Project card navigation', () => {
  beforeEach(async () => {
    vi.resetModules();
    navigateToMock.mockClear();
    document.body.innerHTML = '';
  });

  it('navigates to the detail route when a project card is activated', async () => {
    const [{ renderProjectsPage }, { attachProjectCardListeners }] = await Promise.all([
      import('@/components/ProjectsPage'),
      import('@/components/ProjectCard'),
    ]);

    document.body.innerHTML = renderProjectsPage();

    const card = document.querySelector<HTMLElement>('[data-project-card][data-project-route]');
    expect(card).not.toBeNull();
    expect(card?.dataset['projectRoute']).toBe('project-weready');

    attachProjectCardListeners();

    expect(card?.dataset['listenersAttached']).toBe('true');

    card?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(navigateToMock).toHaveBeenCalledWith('project-weready');
  });
});
