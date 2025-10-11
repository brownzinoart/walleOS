import { getTheme, toggleTheme, subscribeToTheme, type Theme } from '@/utils/theme';
import { addWillChange, removeWillChange, prefersReducedMotion } from '@/utils/performance';

// Data attribute selectors for the component
const SELECTORS = {
  button: '[data-theme-toggle-button]'
} as const;

type ToggleHandlers = {
  onClick: (event: MouseEvent) => void;
  onKeyDown: (event: KeyboardEvent) => void;
  onMouseEnter: (event: MouseEvent) => void;
  onMouseLeave: (event: MouseEvent) => void;
  onFocus: (event: FocusEvent) => void;
  onBlur: (event: FocusEvent) => void;
};

type ToggleInstance = {
  handlers: ToggleHandlers;
  unsubscribe: () => void;
};

const toggleInstances = new Map<HTMLButtonElement, ToggleInstance>();
let unsubscribeTheme: (() => void) | null = null;

function updateToggleUI(button: HTMLButtonElement, theme: Theme): void {
  // Accessibility and state sync
  const isLight = theme === 'light';
  button.setAttribute('aria-checked', isLight ? 'true' : 'false');
  button.setAttribute('data-state', theme);

  // Update sr-only label for screen readers
  const srLabel = button.querySelector('[data-theme-toggle-label]') as HTMLElement | null;
  if (srLabel) {
    srLabel.textContent = theme === 'dark' ? 'Dark mode' : 'Light mode';
  }

  // Visual states primarily handled via CSS; ensure transient effects are clean
  button.classList.toggle('ring-2', false);
}

function handleToggleClick(): void {
  toggleTheme();
}

export const renderThemeToggle = (): string => {
  const theme = getTheme();
  const ariaChecked = theme === 'light' ? 'true' : 'false';

  // CodePen-inspired structure: track + thumb + icons, driven by [data-state]
  return `
    <div class="theme-toggle" data-theme-toggle>
      <button
        type="button"
        class="theme-toggle-button border-2 rounded-lg transition-all duration-200 p-0 min-w-[44px] min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        role="switch"
        aria-checked="${ariaChecked}"
        aria-label="Toggle theme"
        data-state="${theme}"
        data-theme-toggle-button
      >
        <span class="theme-toggle-track" aria-hidden="true">
          <span class="theme-toggle-icon theme-toggle-icon--sun" aria-hidden="true"></span>
          <span class="theme-toggle-icon theme-toggle-icon--moon" aria-hidden="true"></span>
        </span>
        <span class="theme-toggle-thumb" aria-hidden="true"></span>
        <span class="sr-only" data-theme-toggle-label></span>
      </button>
    </div>
  `;
};

export const attachThemeToggleListeners = (): void => {
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>(SELECTORS.button));

  if (!buttons.length) return;

  if (!unsubscribeTheme) {
    unsubscribeTheme = subscribeToTheme((theme) => {
      for (const button of toggleInstances.keys()) {
        updateToggleUI(button, theme);
      }
    });
  }

  const theme = getTheme();

  for (const button of buttons) {
    if (toggleInstances.has(button)) {
      updateToggleUI(button, theme);
      continue;
    }

    const onClick = () => handleToggleClick();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleToggleClick();
      }
    };

    const addWC = () => {
      if (!prefersReducedMotion()) {
        addWillChange(button, ['transform', 'box-shadow', 'border-color']);
      }
    };

    const removeWC = () => {
      removeWillChange(button);
    };

    const onMouseEnter = () => addWC();
    const onMouseLeave = () => removeWC();
    const onFocus = () => addWC();
    const onBlur = () => removeWC();

    button.addEventListener('click', onClick);
    button.addEventListener('keydown', onKeyDown);
    button.addEventListener('mouseenter', onMouseEnter);
    button.addEventListener('mouseleave', onMouseLeave);
    button.addEventListener('focus', onFocus);
    button.addEventListener('blur', onBlur);

    const unsubscribe = () => {
      button.removeEventListener('click', onClick);
      button.removeEventListener('keydown', onKeyDown);
      button.removeEventListener('mouseenter', onMouseEnter);
      button.removeEventListener('mouseleave', onMouseLeave);
      button.removeEventListener('focus', onFocus);
      button.removeEventListener('blur', onBlur);
      removeWillChange(button);
    };

    toggleInstances.set(button, {
      handlers: { onClick, onKeyDown, onMouseEnter, onMouseLeave, onFocus, onBlur },
      unsubscribe
    });

    updateToggleUI(button, theme);
  }
};

export const cleanupThemeToggle = (): void => {
  if (unsubscribeTheme) {
    unsubscribeTheme();
    unsubscribeTheme = null;
  }

  for (const instance of toggleInstances.values()) {
    instance.unsubscribe();
  }

  toggleInstances.clear();
};
