import { addWillChange, removeWillChange, prefersReducedMotion } from '@/utils/performance';
import type { SuggestionChip } from '@/config/content';

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const SUGGESTION_CHIPS_CONTAINER_SELECTOR = '[data-suggestion-chips]';
const SUGGESTION_CHIP_SELECTOR = '[data-suggestion-chip]';

const RIPPLE_DURATION = 500;
const ENTRANCE_DELAY = 70;

const disabledSuggestionChipIds = new Set<string>();

const setChipDisabledState = (chip: HTMLButtonElement, disabled: boolean) => {
  chip.dataset['disabled'] = disabled ? 'true' : 'false';
  chip.setAttribute('aria-disabled', String(disabled));
  chip.setAttribute('tabindex', disabled ? '-1' : '0');
  chip.classList.toggle('disabled', disabled);
};

const disableChipElement = (chip: HTMLButtonElement): void => {
  setChipDisabledState(chip, true);
};

const escapeAttributeSelectorValue = (value: string): string => {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value);
  }

  return value.replace(/["\\]/g, '\\$&');
};

const getSuggestionChipElement = (chipId: string): HTMLButtonElement | null => {
  const container = document.querySelector<HTMLDivElement>(SUGGESTION_CHIPS_CONTAINER_SELECTOR);

  if (!container) {
    return null;
  }

  const selectorValue = escapeAttributeSelectorValue(chipId);
  return (
    container.querySelector<HTMLButtonElement>(
      `${SUGGESTION_CHIP_SELECTOR}[data-chip-id="${selectorValue}"]`
    ) ?? null
  );
};

const SUGGESTION_CHIP_BASE_CLASSES =
  'suggestion-chip px-3 py-2 md:px-4 border-2 border-gray-700 bg-gray-900 text-white rounded-full text-sm md:text-base font-semibold transition-all duration-200 cursor-pointer';

type SuggestionChipScope = Document | DocumentFragment | Element;

export const renderSuggestionChips = (chips: SuggestionChip[]): string => {
  if (!chips.length) {
    return '';
  }

  const chipMarkup = chips
    .map((chip, index) => {
      const isDisabled = disabledSuggestionChipIds.has(chip.id);
      const classes = `${SUGGESTION_CHIP_BASE_CLASSES}${isDisabled ? ' disabled' : ''}`;
      const ariaDisabled = isDisabled ? 'true' : 'false';
      const tabindex = isDisabled ? '-1' : '0';

      return `
        <button
          type="button"
          class="${classes}"
          data-suggestion-chip
          data-chip-id="${escapeHtml(chip.id)}"
          data-chip-index="${index}"
          aria-pressed="false"
          aria-disabled="${ariaDisabled}"
          tabindex="${tabindex}"
          data-disabled="${isDisabled}"
        >
          ${escapeHtml(chip.text)}
        </button>
      `;
    })
    .join('');

  return `
    <div class="suggestion-chip-container flex flex-wrap gap-3 justify-center md:justify-start" data-suggestion-chips>
      ${chipMarkup}
    </div>
  `;
};

const createRipple = (chip: HTMLButtonElement, clientX: number, clientY: number) => {
  const ripple = document.createElement('span');
  ripple.className = 'suggestion-chip__ripple';

  const rect = chip.getBoundingClientRect();
  const diameter = Math.max(rect.width, rect.height) * 2;
  const x = clientX - rect.left;
  const y = clientY - rect.top;

  ripple.style.width = `${diameter}px`;
  ripple.style.height = `${diameter}px`;
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;

  chip.appendChild(ripple);

  ripple.addEventListener(
    'animationend',
    () => {
      ripple.remove();
    },
    { once: true }
  );
};

const togglePressedState = (chip: HTMLButtonElement) => {
  chip.setAttribute('aria-pressed', 'true');
  window.setTimeout(() => {
    chip.setAttribute('aria-pressed', 'false');
  }, 320);
};

const triggerDisabledFeedback = (chip: HTMLButtonElement) => {
  chip.classList.add('suggestion-chip--denied');
  chip.addEventListener(
    'animationend',
    () => {
      chip.classList.remove('suggestion-chip--denied');
    },
    { once: true }
  );
};

const handleChipSelection = (
  chip: HTMLButtonElement,
  onClick: (chipText: string) => void,
  event: PointerEvent | MouseEvent | KeyboardEvent
) => {
  if (chip.dataset['disabled'] === 'true') {
    if (event instanceof PointerEvent || event instanceof MouseEvent) {
      triggerDisabledFeedback(chip);
    }
    if ('preventDefault' in event) {
      event.preventDefault();
    }
    if ('stopPropagation' in event) {
      event.stopPropagation();
    }
    return;
  }

  const chipText = chip.textContent?.trim() ?? '';

  if (!chipText) {
    return;
  }

  togglePressedState(chip);
  onClick(chipText);
};

const applyEntranceAnimation = (chip: HTMLButtonElement, index: number, reducedMotion: boolean) => {
  if (reducedMotion) {
    return;
  }

  chip.style.animationDelay = `${index * ENTRANCE_DELAY}ms`;
  chip.classList.add('suggestion-chip--enter');
  chip.addEventListener(
    'animationend',
    () => {
      chip.classList.remove('suggestion-chip--enter');
      chip.style.removeProperty('animation-delay');
    },
    { once: true }
  );
};

const setupInteractionEffects = (
  chip: HTMLButtonElement,
  onClick: (chipText: string) => void,
  reducedMotion: boolean
) => {
  let interactionLock = false;

  chip.addEventListener('pointerenter', () => {
    addWillChange(chip, ['transform', 'box-shadow']);
  });

  chip.addEventListener('pointerleave', () => {
    removeWillChange(chip);
  });

  chip.addEventListener('focus', () => {
    addWillChange(chip, ['transform', 'box-shadow']);
  });

  chip.addEventListener('blur', () => {
    removeWillChange(chip);
  });

  chip.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' || event.pointerType === 'touch' || event.pointerType === 'pen') {
      if (!interactionLock && !reducedMotion) {
        createRipple(chip, event.clientX, event.clientY);
      }

      if (chip.dataset['disabled'] === 'true') {
        triggerDisabledFeedback(chip);
      }

      interactionLock = true;
      window.setTimeout(() => {
        interactionLock = false;
      }, RIPPLE_DURATION);
    }
  });

  chip.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!reducedMotion) {
        const rect = chip.getBoundingClientRect();
        createRipple(chip, rect.left + rect.width / 2, rect.top + rect.height / 2);
      }
      handleChipSelection(chip, onClick, event);
    }
  });

  chip.addEventListener('click', (event) => {
    handleChipSelection(chip, onClick, event);
  });
};

export const attachSuggestionChipListeners = (
  onClick: (chipText: string) => void,
  root?: SuggestionChipScope
): void => {
  const scope = root ?? document;
  const container = scope.querySelector<HTMLDivElement>(SUGGESTION_CHIPS_CONTAINER_SELECTOR);

  if (!container) {
    return;
  }

  const reducedMotion = prefersReducedMotion();

  container.querySelectorAll<HTMLButtonElement>(SUGGESTION_CHIP_SELECTOR).forEach((chip, index) => {
    const isDisabled = chip.dataset['disabled'] === 'true';

    if (isDisabled) {
      disableChipElement(chip);
    } else {
      setChipDisabledState(chip, false);
    }

    applyEntranceAnimation(chip, index, reducedMotion);
    setupInteractionEffects(chip, onClick, reducedMotion);
  });
};

export const disableSuggestionChip = (chipId: string): void => {
  if (!chipId) {
    return;
  }

  disabledSuggestionChipIds.add(chipId);

  const chip = getSuggestionChipElement(chipId);

  if (!chip) {
    return;
  }

  disableChipElement(chip);
};
