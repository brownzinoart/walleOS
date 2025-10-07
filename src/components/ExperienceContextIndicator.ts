import type { Experience } from '@/types';
import { clearExperienceContext } from '@/utils/experienceContext';

const CONTEXT_INDICATOR_SELECTOR = '[data-experience-context-indicator]';
const CONTEXT_CLEAR_BUTTON_SELECTOR = '[data-context-clear-button]';

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const renderExperienceContextIndicator = (experience: Experience | null): string => {
  if (!experience) {
    return '';
  }

  const title = `${experience.title}`.trim();
  const company = `${experience.company}`.trim();

  return `
    <div
      class="experience-context-indicator"
      data-experience-context-indicator
      role="status"
      aria-live="polite"
    >
      <div class="experience-context-content">
        <span class="experience-context-icon" aria-hidden="true">💼</span>
        <div class="experience-context-copy">
          <p class="experience-context-eyebrow">Context</p>
          <p class="experience-context-label">
            Asking about <span class="experience-context-strong">${escapeHtml(title)}</span>
            at <span class="experience-context-strong">${escapeHtml(company)}</span>
          </p>
        </div>
      </div>
      <button
        type="button"
        class="experience-context-clear"
        data-context-clear-button
        aria-label="Clear experience context"
      >
        <span aria-hidden="true">✕</span>
      </button>
    </div>
  `;
};

export const attachExperienceContextIndicatorListeners = (): void => {
  const indicators = Array.from(
    document.querySelectorAll<HTMLElement>(CONTEXT_INDICATOR_SELECTOR),
  );

  indicators.forEach((indicator) => {
    const dismissButton = indicator.querySelector<HTMLButtonElement>(CONTEXT_CLEAR_BUTTON_SELECTOR);
    if (!dismissButton || dismissButton.dataset['listenerAttached'] === 'true') {
      return;
    }

    dismissButton.dataset['listenerAttached'] = 'true';
    const clearContext = () => clearExperienceContext();

    dismissButton.addEventListener('click', (event) => {
      event.preventDefault();
      clearContext();
    });

    dismissButton.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        clearContext();
      }
    });

    dismissButton.addEventListener('pointerdown', () => {
      dismissButton.classList.add('is-active');
    });

    ['pointerup', 'pointerleave', 'pointercancel', 'blur'].forEach((eventName) => {
      dismissButton.addEventListener(eventName, () => {
        dismissButton.classList.remove('is-active');
      });
    });
  });
};
