import { beforeEach, describe, expect, it, vi } from 'vitest';

const navigateToMock = vi.fn();
const getCurrentRouteMock = vi.fn(() => 'projects');

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
  getCurrentRoute: getCurrentRouteMock,
  getRouteTitle: vi.fn(() => 'WeReady Case Study'),
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

describe('Project WeReady page', () => {
  beforeEach(async () => {
    vi.resetModules();
    navigateToMock.mockClear();
    getCurrentRouteMock.mockReturnValue('projects');
    document.body.innerHTML = '';
  });

  it('renders all main sections when mounting the project-weready route', async () => {
    const { renderProjectWeReadyPage } = await import('@/components/ProjectWeReadyPage');

    document.body.innerHTML = renderProjectWeReadyPage();

    // Assert presence of main sections
    const heroSection = document.querySelector('.weready-hero');
    const overviewSection = document.querySelector('.weready-overview');
    const showcaseSection = document.querySelector('.weready-showcase');
    const outroSection = document.querySelector('.weready-outro');

    expect(heroSection).not.toBeNull();
    expect(overviewSection).not.toBeNull();
    expect(showcaseSection).not.toBeNull();
    expect(outroSection).not.toBeNull();
  });

  it('navigates to projects when back button is clicked from projects route', async () => {
    const { renderProjectWeReadyPage, initProjectWeReadyPage, setReferrerRoute } =
      await import('@/components/ProjectWeReadyPage');

    // Set referrer as 'projects'
    setReferrerRoute('projects');

    document.body.innerHTML = renderProjectWeReadyPage();
    initProjectWeReadyPage();

    const backButton = document.querySelector<HTMLButtonElement>('[data-weready-back]');
    expect(backButton).not.toBeNull();

    backButton?.click();

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(navigateToMock).toHaveBeenCalledWith('projects');
  });

  it('navigates to home when back button is clicked from home route', async () => {
    const { renderProjectWeReadyPage, initProjectWeReadyPage, setReferrerRoute } =
      await import('@/components/ProjectWeReadyPage');

    // Set referrer as 'home'
    setReferrerRoute('home');

    document.body.innerHTML = renderProjectWeReadyPage();
    initProjectWeReadyPage();

    const backButton = document.querySelector<HTMLButtonElement>('[data-weready-back]');
    expect(backButton).not.toBeNull();

    backButton?.click();

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(navigateToMock).toHaveBeenCalledWith('home');
  });

  it('updates back button label based on referrer route', async () => {
    const { renderProjectWeReadyPage, initProjectWeReadyPage, setReferrerRoute } =
      await import('@/components/ProjectWeReadyPage');

    // Test with 'home' referrer
    setReferrerRoute('home');
    document.body.innerHTML = renderProjectWeReadyPage();
    initProjectWeReadyPage();

    let backButton = document.querySelector<HTMLButtonElement>('[data-weready-back]');
    expect(backButton?.textContent).toContain('Back to home');

    // Reset and test with 'projects' referrer
    const { cleanupProjectWeReadyPage } = await import('@/components/ProjectWeReadyPage');
    cleanupProjectWeReadyPage();

    setReferrerRoute('projects');
    document.body.innerHTML = renderProjectWeReadyPage();
    initProjectWeReadyPage();

    backButton = document.querySelector<HTMLButtonElement>('[data-weready-back]');
    expect(backButton?.textContent).toContain('Back to projects');
  });

  it('defaults to projects when no referrer is set', async () => {
    const { renderProjectWeReadyPage, initProjectWeReadyPage } =
      await import('@/components/ProjectWeReadyPage');

    document.body.innerHTML = renderProjectWeReadyPage();
    initProjectWeReadyPage();

    const backButton = document.querySelector<HTMLButtonElement>('[data-weready-back]');
    backButton?.click();

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(navigateToMock).toHaveBeenCalledWith('projects');
  });
});
