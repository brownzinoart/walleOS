const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

const HTML_ESCAPE_REGEX = /[&<>"']/g;

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

type FocusTrapCleanup = () => void;

type ScrollLockSnapshot = {
  overflow: string;
  paddingRight: string;
  documentOverflow: string;
};

let scrollLockState: ScrollLockSnapshot | null = null;

export const escapeHtml = (value: string): string => {
  if (!value) {
    return '';
  }

  return value.replace(HTML_ESCAPE_REGEX, (match) => HTML_ESCAPE_MAP[match] ?? match);
};

export const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
  const candidates = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS));

  return candidates.filter((element) => {
    if (!element) {
      return false;
    }

    if (element.hasAttribute('disabled')) {
      return false;
    }

    if (element.getAttribute('aria-hidden') === 'true') {
      return false;
    }

    if (element.tabIndex === -1) {
      return false;
    }

    const isVisible = element.offsetParent !== null || element.getClientRects().length > 0;

    return isVisible;
  });
};

export const trapFocus = (container: HTMLElement): FocusTrapCleanup => {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') {
      return;
    }

    const activeElement = document.activeElement as HTMLElement | null;
    if (!activeElement || !container.contains(activeElement)) {
      return;
    }

    const focusableElements = getFocusableElements(container);
    if (focusableElements.length === 0) {
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (!firstElement || !lastElement) {
      return;
    }

    if (event.shiftKey) {
      if (activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus({ preventScroll: true });
      }
      return;
    }

    if (activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus({ preventScroll: true });
    }
  };

  document.addEventListener('keydown', handleKeyDown, true);

  return () => {
    document.removeEventListener('keydown', handleKeyDown, true);
  };
};

export const lockBodyScroll = (): void => {
  if (scrollLockState || typeof window === 'undefined') {
    return;
  }

  const { body, documentElement } = document;
  const { style } = body;
  const scrollbarWidth = Math.max(window.innerWidth - documentElement.clientWidth, 0);

  scrollLockState = {
    overflow: style.overflow,
    paddingRight: style.paddingRight,
    documentOverflow: documentElement.style.overflow,
  };

  style.overflow = 'hidden';
  documentElement.style.overflow = 'hidden';

  if (scrollbarWidth > 0) {
    style.paddingRight = `${scrollbarWidth}px`;
  }
};

export const unlockBodyScroll = (): void => {
  if (!scrollLockState || typeof window === 'undefined') {
    return;
  }

  const { body, documentElement } = document;
  const { style } = body;

  style.overflow = scrollLockState.overflow;
  style.paddingRight = scrollLockState.paddingRight;

  documentElement.style.overflow = scrollLockState.documentOverflow;

  scrollLockState = null;
};

export const isElementVisible = (element: HTMLElement | null): boolean => {
  if (!element) {
    return false;
  }

  if (!element.isConnected) {
    return false;
  }

  if (element.offsetParent !== null) {
    return true;
  }

  return element.getClientRects().length > 0;
};
