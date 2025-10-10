import { addWillChange, removeWillChange, prefersReducedMotion } from '@/utils/performance';

const MOBILE_NAV_TRIGGER = '[data-mobile-nav-trigger]';
const MOBILE_NAV_CLOSE = '[data-mobile-nav-close]';
const SIDEBAR_DRAWER = '#sidebar-drawer';

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  "input[type='text']:not([disabled])",
  "input[type='radio']:not([disabled])",
  "input[type='checkbox']:not([disabled])",
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

type FocusTrapCleanup = () => void;

type MobileNavConfig = {
  getIsOpen?: () => boolean;
  close?: () => void;
  sidebar?: HTMLElement;
};

let focusTrapCleanup: FocusTrapCleanup | null = null;
let lastFocusedElement: HTMLElement | null = null;

const getSidebarElement = (provided?: HTMLElement | null): HTMLElement | null => {
  if (provided) {
    return provided;
  }

  return document.querySelector<HTMLElement>(SIDEBAR_DRAWER);
};

const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
  const elements = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS));

  return elements.filter((element) => {
    const isDisabled = element.hasAttribute('disabled') || element.getAttribute('aria-hidden') === 'true';
    const hasNegativeTabIndex = element.tabIndex === -1;
    const isVisible = element.offsetParent !== null || element.getClientRects().length > 0;

    return !isDisabled && !hasNegativeTabIndex && isVisible;
  });
};

const trapFocus = (container: HTMLElement): FocusTrapCleanup => {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') {
      return;
    }

    const focusable = getFocusableElements(container);

    if (focusable.length === 0) {
      return;
    }

    const firstElement = focusable[0];
    const lastElement = focusable[focusable.length - 1];

    if (!firstElement || !lastElement) {
      return;
    }
    const isShiftPressed = event.shiftKey;
    const activeElement = document.activeElement as HTMLElement | null;

    if (!isShiftPressed && activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus({ preventScroll: true });
    } else if (isShiftPressed && activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus({ preventScroll: true });
    }
  };

  document.addEventListener('keydown', handleKeyDown, true);

  return () => {
    document.removeEventListener('keydown', handleKeyDown, true);
  };
};

const applyFocusState = (sidebar: HTMLElement, trigger: HTMLElement, isOpen: boolean) => {
  if (isOpen) {
    lastFocusedElement = document.activeElement as HTMLElement | null;

    focusTrapCleanup?.();
    focusTrapCleanup = trapFocus(sidebar);

    const [firstFocusable] = getFocusableElements(sidebar);
    firstFocusable?.focus({ preventScroll: true });
    return;
  }

  focusTrapCleanup?.();
  focusTrapCleanup = null;

  const elementToFocus = lastFocusedElement ?? trigger;
  lastFocusedElement = null;

  requestAnimationFrame(() => {
    elementToFocus?.focus({ preventScroll: true });
  });
};

const manageWillChange = (sidebar: HTMLElement, isOpening: boolean) => {
  if (prefersReducedMotion()) {
    removeWillChange(sidebar);
    return;
  }

  if (isOpening) {
    addWillChange(sidebar, ['transform']);
    return;
  }

  const handleTransitionEnd = () => {
    removeWillChange(sidebar);
    sidebar.removeEventListener('transitionend', handleTransitionEnd);
  };

  sidebar.addEventListener('transitionend', handleTransitionEnd, { once: true });
};

export const renderMobileNav = (): string => `
  <button
    type="button"
    class="hamburger md:hidden lg:hidden focus:outline-none"
    data-mobile-nav-trigger
    aria-label="Toggle navigation menu"
    aria-expanded="false"
    aria-controls="sidebar-drawer"
  >
    <span class="hamburger-bar"></span>
    <span class="hamburger-bar"></span>
    <span class="hamburger-bar"></span>
  </button>
`;

export const attachMobileNavListeners = (
  toggleCallback: () => void,
  config: MobileNavConfig = {}
): void => {
  // Swipe-to-close was intentionally removed with the full-screen menu pattern.
  const trigger = document.querySelector<HTMLButtonElement>(MOBILE_NAV_TRIGGER);
  const closeButton = document.querySelector<HTMLButtonElement>(MOBILE_NAV_CLOSE);
  const sidebar = getSidebarElement(config.sidebar);

  if (!trigger || !sidebar) {
    return;
  }

  const getIsOpen = () => {
    if (typeof config.getIsOpen === 'function') {
      return config.getIsOpen();
    }

    return trigger.getAttribute('aria-expanded') === 'true';
  };

  const closeNav = () => {
    if (!getIsOpen()) {
      return;
    }

    manageWillChange(sidebar, false);

    if (typeof config.close === 'function') {
      config.close();
    } else {
      toggleCallback();
    }

    requestAnimationFrame(() => syncState());
  };

  let lastKnownState = getIsOpen();

  const syncState = (force = false) => {
    const isOpen = getIsOpen();

    if (!force && lastKnownState === isOpen) {
      return;
    }

    lastKnownState = isOpen;
    trigger.setAttribute('aria-expanded', String(isOpen));
    applyFocusState(sidebar, trigger, isOpen);

    if (!isOpen) {
      removeWillChange(sidebar);
    }
  };

  const handleToggle = () => {
    const currentlyOpen = getIsOpen();
    manageWillChange(sidebar, !currentlyOpen);
    toggleCallback();
    requestAnimationFrame(() => syncState());
  };

  trigger.addEventListener('click', handleToggle);

  if (closeButton) {
    closeButton.addEventListener('click', () => {
      closeNav();
    });

    closeButton.addEventListener(
      'touchstart',
      () => {
        closeNav();
      },
      { passive: true }
    );
  }

  window.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 'Escape' && getIsOpen()) {
      closeNav();
    }
  });

  syncState(true);
};
