import { addWillChange, removeWillChange, rafThrottle, prefersReducedMotion } from '@/utils/performance';

const MOBILE_NAV_TRIGGER = '[data-mobile-nav-trigger]';
const MOBILE_NAV_OVERLAY = '[data-mobile-nav-overlay]';
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

const syncAriaAttributes = (trigger: HTMLElement, overlay: HTMLElement, isOpen: boolean) => {
  trigger.setAttribute('aria-expanded', String(isOpen));
  overlay.setAttribute('aria-hidden', String(!isOpen));
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

const createSwipeGesture = (
  sidebar: HTMLElement,
  overlay: HTMLElement,
  config: Required<Pick<MobileNavConfig, 'getIsOpen' | 'close'>>
) => {
  if (prefersReducedMotion()) {
    return;
  }

  let startX = 0;
  let startY = 0;
  let latestX = 0;
  let startTime = 0;
  let isDragging = false;
  let directionLocked: boolean | null = null;

  const sidebarWidth = () => sidebar.getBoundingClientRect().width || 1;

  const updatePosition = rafThrottle((translateX: number) => {
    sidebar.style.transform = `translate3d(${translateX}px, 0, 0)`;
    const opacity = Math.max(0, Math.min(1, 1 + translateX / sidebarWidth()));
    overlay.style.opacity = opacity.toString();
  });

  const resetStyles = () => {
    sidebar.style.transition = '';
    sidebar.style.transform = '';
    overlay.style.opacity = '';
    updatePosition.cancel?.();
  };

  const handleTouchStart = (event: TouchEvent) => {
    if (!config.getIsOpen()) {
      return;
    }

    const touch = event.touches[0];

    if (!touch) {
      return;
    }

    startX = touch.clientX;
    startY = touch.clientY;
    latestX = startX;
    startTime = event.timeStamp;
    isDragging = true;
    directionLocked = null;
    sidebar.style.transition = 'none';
    addWillChange(sidebar, ['transform']);
  };

  const handleTouchMove = (event: TouchEvent) => {
    if (!isDragging) {
      return;
    }

    const touch = event.touches[0];

    if (!touch) {
      return;
    }

    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;

    if (directionLocked === null) {
      directionLocked = Math.abs(deltaX) > Math.abs(deltaY);
    }

    if (directionLocked === false) {
      resetStyles();
      removeWillChange(sidebar);
      isDragging = false;
      return;
    }

    event.preventDefault();

    latestX = touch.clientX;

    if (deltaX >= 0) {
      updatePosition(0);
      return;
    }

    const translateX = Math.max(deltaX, -sidebarWidth());
    updatePosition(translateX);
  };

  const shouldCloseOnRelease = (deltaX: number, elapsed: number) => {
    const velocity = Math.abs(deltaX) / Math.max(elapsed, 1);
    return deltaX < -80 || velocity > 0.45;
  };

  const handleTouchEnd = (event: TouchEvent) => {
    if (!isDragging) {
      return;
    }

    const deltaX = latestX - startX;
    const elapsed = event.timeStamp - startTime;

    resetStyles();
    removeWillChange(sidebar);

    if (shouldCloseOnRelease(deltaX, elapsed)) {
      config.close();
    }

    isDragging = false;
  };

  const handleTouchCancel = () => {
    if (!isDragging) {
      return;
    }

    resetStyles();
    removeWillChange(sidebar);
    isDragging = false;
  };

  sidebar.addEventListener('touchstart', handleTouchStart, { passive: true });
  sidebar.addEventListener('touchmove', handleTouchMove, { passive: false });
  sidebar.addEventListener('touchend', handleTouchEnd);
  sidebar.addEventListener('touchcancel', handleTouchCancel);
};

export const renderMobileNav = (): string => `
  <button
    type="button"
    class="hamburger md:hidden focus:outline-none"
    data-mobile-nav-trigger
    aria-label="Toggle navigation menu"
    aria-expanded="false"
    aria-controls="sidebar-drawer"
  >
    <span class="hamburger-bar"></span>
    <span class="hamburger-bar"></span>
    <span class="hamburger-bar"></span>
  </button>
  <div
    class="mobile-overlay md:hidden overlay-hidden"
    data-mobile-nav-overlay
    aria-hidden="true"
    aria-label="Close navigation menu"
  ></div>
`;

export const attachMobileNavListeners = (
  toggleCallback: () => void,
  config: MobileNavConfig = {}
): void => {
  const trigger = document.querySelector<HTMLButtonElement>(MOBILE_NAV_TRIGGER);
  const overlay = document.querySelector<HTMLDivElement>(MOBILE_NAV_OVERLAY);
  const sidebar = getSidebarElement(config.sidebar);

  if (!trigger || !overlay || !sidebar) {
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
    syncAriaAttributes(trigger, overlay, isOpen);
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

  overlay.addEventListener('click', () => {
    closeNav();
  });

  overlay.addEventListener('touchstart', () => {
    // Ensure overlay taps register quickly on touch devices
    closeNav();
  });

  window.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 'Escape' && getIsOpen()) {
      closeNav();
    }
  });

  createSwipeGesture(sidebar, overlay, {
    getIsOpen,
    close: closeNav,
  });

  syncState(true);
};
