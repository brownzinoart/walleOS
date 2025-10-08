import { getTheme, toggleTheme, subscribeToTheme, type Theme } from '@/utils/theme';
import { addWillChange, removeWillChange, prefersReducedMotion } from '@/utils/performance';

// Data attribute selectors for the component
const SELECTORS = {
  button: '[data-theme-toggle-button]'
} as const;

let buttonEl: HTMLButtonElement | null = null;
let unsubscribeTheme: (() => void) | null = null;

// Track attachment per button to prevent duplicate listeners
const attachedButtons = new WeakSet<HTMLButtonElement>();

// Bound handlers for proper cleanup
let onClick: ((e: MouseEvent) => void) | null = null;
let onKeyDown: ((e: KeyboardEvent) => void) | null = null;
let onMouseEnter: ((e: MouseEvent) => void) | null = null;
let onMouseLeave: ((e: MouseEvent) => void) | null = null;
let onFocus: ((e: FocusEvent) => void) | null = null;
let onBlur: ((e: FocusEvent) => void) | null = null;

function cacheToggleElements(): void {
  buttonEl = document.querySelector(SELECTORS.button) as HTMLButtonElement | null;
}

function updateToggleUI(theme: Theme): void {
  if (!buttonEl) return;

  // Accessibility and state sync
  const isLight = theme === 'light';
  buttonEl.setAttribute('aria-checked', isLight ? 'true' : 'false');
  buttonEl.setAttribute('data-state', theme);

  // Update sr-only label for screen readers
  const srLabel = buttonEl.querySelector('[data-theme-toggle-label]') as HTMLElement | null;
  if (srLabel) {
    srLabel.textContent = theme === 'dark' ? 'Dark mode' : 'Light mode';
  }

  // Visual states primarily handled via CSS; ensure transient effects are clean
  buttonEl.classList.toggle('ring-2', false);
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
  cacheToggleElements();

  if (!buttonEl) return;

  // Guard against double attachment
  if (attachedButtons.has(buttonEl)) return;
  attachedButtons.add(buttonEl);

  // Subscribe to theme changes and update UI reactively
  unsubscribeTheme = subscribeToTheme((theme) => {
    updateToggleUI(theme);
  });

  // Initialize UI state
  updateToggleUI(getTheme());

  // Event handlers
  onClick = () => handleToggleClick();
  onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggleClick();
    }
  };

  const addWC = () => {
    if (!prefersReducedMotion() && buttonEl) {
      addWillChange(buttonEl, ['transform', 'box-shadow', 'border-color']);
    }
  };
  const removeWC = () => {
    if (buttonEl) removeWillChange(buttonEl);
  };

  // Typed wrapper functions to avoid unnecessary casts
  onMouseEnter = () => addWC();
  onMouseLeave = () => removeWC();
  onFocus = () => addWC();
  onBlur = () => removeWC();

  buttonEl.addEventListener('click', onClick);
  buttonEl.addEventListener('keydown', onKeyDown);
  buttonEl.addEventListener('mouseenter', onMouseEnter);
  buttonEl.addEventListener('mouseleave', onMouseLeave);
  buttonEl.addEventListener('focus', onFocus);
  buttonEl.addEventListener('blur', onBlur);
};

export const cleanupThemeToggle = (): void => {
  if (unsubscribeTheme) {
    unsubscribeTheme();
    unsubscribeTheme = null;
  }

  if (buttonEl) {
    if (onClick) buttonEl.removeEventListener('click', onClick);
    if (onKeyDown) buttonEl.removeEventListener('keydown', onKeyDown);
    if (onMouseEnter) buttonEl.removeEventListener('mouseenter', onMouseEnter);
    if (onMouseLeave) buttonEl.removeEventListener('mouseleave', onMouseLeave);
    if (onFocus) buttonEl.removeEventListener('focus', onFocus);
    if (onBlur) buttonEl.removeEventListener('blur', onBlur);

    removeWillChange(buttonEl);

    // Allow future re-attachment
    attachedButtons.delete(buttonEl);
  }

  buttonEl = null;
  onClick = null;
  onKeyDown = null;
  onMouseEnter = null;
  onMouseLeave = null;
  onFocus = null;
  onBlur = null;
};
