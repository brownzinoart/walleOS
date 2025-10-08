import { renderSidebar, initSidebarInteractions, setActiveNavItem } from './Sidebar';
import { attachThemeToggleListeners } from './ThemeToggle';
import { renderMobileNav, attachMobileNavListeners } from './MobileNav';

const SIDEBAR_SELECTOR = '[data-sidebar]';
const MOBILE_NAV_TRIGGER = '[data-mobile-nav-trigger]';
const MOBILE_NAV_OVERLAY = '[data-mobile-nav-overlay]';

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

const isDesktop = () => window.matchMedia('(min-width: 768px)').matches;

const setSidebarOpenState = (
  sidebar: HTMLElement,
  overlay: HTMLElement,
  trigger: HTMLElement,
  shouldOpen: boolean
) => {
  const sidebarElement = sidebar;
  const overlayElement = overlay;
  const triggerElement = trigger;
  const desktop = isDesktop();
  const sidebarHidden = desktop ? false : !shouldOpen;
  const showOverlay = shouldOpen && !desktop;

  layoutState.isSidebarOpen = showOverlay;

  sidebarElement.classList.toggle('translate-x-0', shouldOpen);
  sidebarElement.classList.toggle('-translate-x-full', !shouldOpen);
  sidebarElement.classList.toggle('sidebar-open', shouldOpen && !desktop);
  sidebarElement.classList.toggle('sidebar-closed', !shouldOpen && !desktop);
  sidebarElement.classList.toggle('shadow-brutal-lg', shouldOpen && !desktop);
  sidebarElement.setAttribute('aria-hidden', String(sidebarHidden));

  overlayElement.classList.toggle('overlay-visible', showOverlay);
  overlayElement.classList.toggle('overlay-hidden', !showOverlay);
  overlayElement.setAttribute('aria-hidden', String(!showOverlay));

  triggerElement.classList.toggle('open', showOverlay);
  triggerElement.setAttribute('aria-expanded', String(showOverlay));
};

const closeSidebar = (
  sidebar: HTMLElement,
  overlay: HTMLElement,
  trigger: HTMLElement
) => {
  if (!layoutState.isSidebarOpen && !isDesktop()) {
    return;
  }

  setSidebarOpenState(sidebar, overlay, trigger, false);
};

export const renderLayout = (mainContent: string): string => `
  <div class="layout-root relative min-h-screen text-primary">
    ${renderMobileNav()}
    <div class="layout-container grid grid-cols-1 md:grid-cols-[280px_1fr]">
      <div
        id="sidebar-drawer"
        class="sidebar-container fixed inset-y-0 left-0 z-40 w-[280px] -translate-x-full transform transition-transform duration-300 ease-in-out md:static md:z-auto md:h-full md:w-[280px] md:translate-x-0"
        data-sidebar
        aria-hidden="true"
      >
        ${renderSidebar()}
      </div>
      <main
        class="main-content-area w-full min-h-screen p-6 pt-20 md:p-12"
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
  const overlay = document.querySelector<HTMLElement>(MOBILE_NAV_OVERLAY);

  if (!sidebar || !trigger || !overlay) {
    return;
  }

  initSidebarInteractions();
  
  // Attach theme toggle listeners
  attachThemeToggleListeners();

  if (layoutState.activeNavItem) {
    setActiveNavItem(layoutState.activeNavItem, { silent: true });
  }

  setSidebarOpenState(sidebar, overlay, trigger, false);

  const toggleSidebar = () => {
    setSidebarOpenState(sidebar, overlay, trigger, !layoutState.isSidebarOpen);
  };

  const handleSidebarNavigate = (event: Event) => {
    const customEvent = event as CustomEvent<{ id: string }>;
    const navId = customEvent.detail?.id;

    if (!navId) {
      return;
    }

    layoutState.activeNavItem = navId;

    if (!isDesktop()) {
      closeSidebar(sidebar, overlay, trigger);
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
    close: () => closeSidebar(sidebar, overlay, trigger),
    sidebar,
  });

  window.addEventListener('resize', () => {
    if (isDesktop()) {
      closeSidebar(sidebar, overlay, trigger);
    }
  });
};
