import { renderSidebar, initSidebarInteractions, setActiveNavItem } from './Sidebar';
import { attachThemeToggleListeners } from './ThemeToggle';
import { renderMobileNav, attachMobileNavListeners } from './MobileNav';

const SIDEBAR_SELECTOR = '[data-sidebar]';
const MOBILE_NAV_TRIGGER = '[data-mobile-nav-trigger]';

type LayoutState = {
  isSidebarOpen: boolean;
  isMobile: boolean;
  lastScreenWidth: number;
  activeNavItem: string | null;
};

const layoutState: LayoutState = {
  isSidebarOpen: false,
  isMobile: false,
  lastScreenWidth: 0,
  activeNavItem: null,
};

let lockedScrollY = 0;

const isDesktop = () => window.matchMedia('(min-width: 1024px)').matches;

const isOffCanvasSidebar = (el: HTMLElement) => {
  try {
    return getComputedStyle(el).position === 'fixed';
  } catch {
    return !isDesktop();
  }
};

const setSidebarOpenState = (sidebar: HTMLElement, trigger: HTMLElement, shouldOpen: boolean) => {
  const sidebarElement = sidebar;
  const triggerElement = trigger;
  const offCanvas = isOffCanvasSidebar(sidebar);
  const sidebarHidden = offCanvas ? !shouldOpen : false;
  const offCanvasOpen = shouldOpen && offCanvas;

  layoutState.isSidebarOpen = offCanvasOpen;

  // Lock body scroll on mobile when sidebar is open
  if (offCanvasOpen) {
    lockedScrollY = window.scrollY;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.top = `-${lockedScrollY}px`;
  } else {
    const topValue = document.body.style.top;
    const y = Math.abs(parseInt(topValue || '0', 10)) || 0;
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.top = '';
    if (topValue) {
      window.scrollTo(0, y);
    }
  }

  sidebarElement.classList.toggle('translate-x-0', shouldOpen);
  sidebarElement.classList.toggle('-translate-x-full', !shouldOpen);
  sidebarElement.classList.toggle('sidebar-open', shouldOpen && offCanvas);
  sidebarElement.classList.toggle('sidebar-closed', !shouldOpen && offCanvas);
  sidebarElement.classList.toggle('shadow-brutal-lg', shouldOpen && offCanvas);
  sidebarElement.setAttribute('aria-hidden', String(sidebarHidden));

  const main = document.querySelector<HTMLElement>('[data-main-content]');

  if (main) {
    const mainWithInert = main as HTMLElement & { inert?: boolean };
    const supportsInert =
      'inert' in HTMLElement.prototype || typeof mainWithInert.inert !== 'undefined';

    if (offCanvasOpen) {
      mainWithInert.setAttribute('aria-hidden', 'true');
      if (supportsInert) {
        mainWithInert.inert = true;
      }
    } else {
      mainWithInert.removeAttribute('aria-hidden');
      if (supportsInert) {
        mainWithInert.inert = false;
      }
    }
  }

  triggerElement.classList.toggle('open', offCanvasOpen);
  triggerElement.setAttribute('aria-expanded', String(offCanvasOpen));
};

const closeSidebar = (sidebar: HTMLElement, trigger: HTMLElement) => {
  if (!layoutState.isSidebarOpen && isOffCanvasSidebar(sidebar)) {
    return;
  }

  setSidebarOpenState(sidebar, trigger, false);
};

export const renderLayout = (mainContent: string): string => `
  <div class="layout-root relative min-h-screen text-primary">
    ${renderMobileNav()}
    <div class="layout-container grid grid-cols-1 md:grid-cols-[240px_1fr] lg:grid-cols-[280px_1fr]">
      <div
        id="sidebar-drawer"
        class="sidebar-container fixed inset-0 z-40 w-full -translate-x-full transform transition-transform duration-300 ease-in-out md:static md:z-auto md:inset-auto md:h-full md:w-[240px] md:translate-x-0 lg:w-[280px] lg:static lg:z-auto lg:h-full lg:translate-x-0"
        data-sidebar
        aria-hidden="true"
      >
        ${renderSidebar()}
      </div>
      <main
        class="main-content-area w-full min-h-screen p-6 pt-20 md:p-8 md:pt-20 lg:p-12"
        data-main-content
        role="main"
        aria-label="Main content"
        id="main-content"
      >
        ${mainContent}
      </main>
    </div>
  </div>
`;

export const initLayout = (): void => {
  const sidebar = document.querySelector<HTMLElement>(SIDEBAR_SELECTOR);
  const trigger = document.querySelector<HTMLElement>(MOBILE_NAV_TRIGGER);

  if (!sidebar || !trigger) {
    return;
  }

  initSidebarInteractions();
  
  // Attach theme toggle listeners
  attachThemeToggleListeners();

  if (layoutState.activeNavItem) {
    setActiveNavItem(layoutState.activeNavItem, { silent: true });
  }

  setSidebarOpenState(sidebar, trigger, false);

  const toggleSidebar = () => {
    setSidebarOpenState(sidebar, trigger, !layoutState.isSidebarOpen);
  };

  const handleSidebarNavigate = (event: Event) => {
    const customEvent = event as CustomEvent<{ id: string }>;
    const navId = customEvent.detail?.id;

    if (!navId) {
      return;
    }

    layoutState.activeNavItem = navId;

    if (!isDesktop()) {
      closeSidebar(sidebar, trigger);
    }
  };

  const handleActiveChange = (event: Event) => {
    const customEvent = event as CustomEvent<{ id: string }>;

    if (customEvent.detail?.id) {
      layoutState.activeNavItem = customEvent.detail.id;
    }
  };

  document.addEventListener('sidebar:navigate', handleSidebarNavigate);
  document.addEventListener('sidebar:active-change', handleActiveChange);

  attachMobileNavListeners(toggleSidebar, {
    getIsOpen: () => layoutState.isSidebarOpen,
    close: () => closeSidebar(sidebar, trigger),
    sidebar,
  });

  window.addEventListener('resize', () => {
    if (!isOffCanvasSidebar(sidebar)) {
      closeSidebar(sidebar, trigger);
    }
  });
};
