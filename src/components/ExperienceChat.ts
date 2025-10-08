import { renderChatMessage } from '@/components/ChatMessage';
import {
  attachSuggestionChipListeners,
  renderSuggestionChips,
} from '@/components/SuggestionChips';
import { getExperienceSuggestionChips } from '@/config/content';
import type { Experience } from '@/types';
import {
  addExperienceChatMessage,
  clearExperienceChat,
  getIsAnyExperienceChatProcessing,
  getExperienceChatInputValue,
  getExperienceChatMessages,
  getExperienceChatTyping,
  getProcessingExperienceId,
  setExperienceChatInputValue,
  setExperienceChatProcessing,
  setExperienceChatTyping,
  subscribeToExperienceChatState,
  type ExperienceChatState,
  type ExperienceChatStateListener,
} from '@/utils/experienceChatState';
import { generateMockResponse } from '@/utils/chatState';
import { addWillChange, debounce, removeWillChange, type DebouncedFunction } from '@/utils/performance';
import { escapeHtml } from '@/utils/dom';

const EXPERIENCE_CHAT_SELECTOR = '[data-experience-chat]';
const EXPERIENCE_MESSAGES_SELECTOR = '[data-experience-messages]';
const EXPERIENCE_TYPING_SELECTOR = '[data-experience-typing]';
const EXPERIENCE_SUGGESTIONS_SELECTOR = '[data-experience-suggestions]';
const EXPERIENCE_INPUT_SELECTOR = '[data-experience-input]';
const EXPERIENCE_TEXTAREA_SELECTOR = '[data-experience-textarea]';
const EXPERIENCE_SEND_BUTTON_SELECTOR = '[data-experience-send-button]';
const EXPERIENCE_SEND_LABEL_SELECTOR = '[data-experience-send-label]';
const EXPERIENCE_SEND_SPINNER_SELECTOR = '[data-experience-send-spinner]';
const EXPERIENCE_CHAR_COUNT_SELECTOR = '[data-experience-char-count]';
const EXPERIENCE_CHAT_CLOSE_SELECTOR = '[data-experience-chat-close]';
const EXPERIENCE_FOOTER_SELECTOR = '[data-experience-footer]';

const MESSAGE_LENGTH_LIMIT = 600;
const CHAR_COUNT_THRESHOLD = 0.8;
const MAX_TEXTAREA_HEIGHT = 200;
const RESPONSE_DELAY_MIN = 500;
const RESPONSE_DELAY_MAX = 800;

type ExperienceSuggestionChip = ReturnType<typeof getExperienceSuggestionChips>[number];

interface ExperienceChatRuntime {
  experience: Experience;
  container: HTMLElement;
  form: HTMLFormElement | null;
  textarea: HTMLTextAreaElement;
  sendButton: HTMLButtonElement;
  sendLabel: HTMLElement;
  sendSpinner: HTMLElement;
  charCount: HTMLElement | null;
  messagesContainer: HTMLElement;
  typingIndicator: HTMLElement | null;
  suggestionsContainer: HTMLElement | null;
  closeButton: HTMLButtonElement | null;
  closeButtonHandler?: (event: Event) => void;
  handleChipClick?: (chipText: string) => void;
  textareaResizer: DebouncedFunction<(textarea: HTMLTextAreaElement) => void>;
  inputHandler?: (event: Event) => void;
  keydownHandler?: (event: KeyboardEvent) => void;
  submitHandler?: (event: Event) => void;
  buttonClickHandler?: (event: MouseEvent) => void;
  pendingTimeouts: Set<number>;
  pendingAnimationFrame: number | null;
  unsubscribe?: () => void;
  isSending: boolean;
  lastChipText?: string;
  pendingChipId?: string;
  chipLookup: Map<string, ExperienceSuggestionChip>;
  processingErrorTimeoutId?: number;
}

const runtimeRegistry = new Map<string, ExperienceChatRuntime>();

const escapeSelectorValue = (value: string): string => {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value);
  }

  return value.replace(/["\\]/g, '\\$&');
};

const getExperienceChatContainer = (experienceId: string): HTMLElement | null => {
  const selectorValue = escapeSelectorValue(experienceId);
  return (
    document.querySelector<HTMLElement>(
      `${EXPERIENCE_CHAT_SELECTOR}[data-experience-id="${selectorValue}"]`
    ) ?? null
  );
};

const renderEmptyState = (experience: Experience): string => {
  const title = escapeHtml(experience.title);
  const company = escapeHtml(experience.company);

  return `
    <div class="experience-chat-empty">
      Pick a suggestion prompt below or ask anything about my time as ${title} at ${company} to get started.
    </div>
  `;
};

const performExperienceTextareaResize = (textarea: HTMLTextAreaElement): void => {
  addWillChange(textarea, ['height']);

  requestAnimationFrame(() => {
    textarea.style.height = 'auto';
    const nextHeight = Math.min(textarea.scrollHeight, MAX_TEXTAREA_HEIGHT);
    textarea.style.height = `${nextHeight}px`;

    requestAnimationFrame(() => {
      removeWillChange(textarea);
    });
  });
};

const createTextareaResizer = (): DebouncedFunction<
  (textarea: HTMLTextAreaElement) => void
> =>
  debounce((textarea: HTMLTextAreaElement) => {
    performExperienceTextareaResize(textarea);
  }, 80);

const showProcessingError = (experienceId: string, processingExperienceId: string | null): void => {
  if (!processingExperienceId) {
    return;
  }

  const runtime = runtimeRegistry.get(experienceId);

  if (!runtime) {
    return;
  }

  if (runtime.processingErrorTimeoutId) {
    window.clearTimeout(runtime.processingErrorTimeoutId);
    delete runtime.processingErrorTimeoutId;
  }

  const existing = runtime.container.querySelector<HTMLElement>('[data-processing-error]');
  existing?.remove();

  const processingRuntime = runtimeRegistry.get(processingExperienceId);
  const activeLabel = processingRuntime
    ? `${processingRuntime.experience.title} chat`
    : 'another chat';

  const errorElement = document.createElement('div');
  errorElement.className = 'experience-chat-processing-error';
  errorElement.dataset['processingError'] = 'true';
  errorElement.textContent = `Please wait - the ${activeLabel} is currently processing a response. Try again in a moment.`;

  runtime.container.insertBefore(errorElement, runtime.messagesContainer);

  runtime.processingErrorTimeoutId = window.setTimeout(() => {
    errorElement.remove();
    delete runtime.processingErrorTimeoutId;
  }, 4000);
};

const updateExperienceCharCount = (experienceId: string): void => {
  const runtime = runtimeRegistry.get(experienceId);

  if (!runtime || !runtime.charCount) {
    return;
  }

  const { textarea, charCount } = runtime;
  const length = textarea.value.length;
  const threshold = MESSAGE_LENGTH_LIMIT * CHAR_COUNT_THRESHOLD;
  const isVisible = length >= threshold || length >= MESSAGE_LENGTH_LIMIT;
  const isOverLimit = length > MESSAGE_LENGTH_LIMIT;

  charCount.textContent = `${length}/${MESSAGE_LENGTH_LIMIT}`;
  charCount.classList.toggle('is-visible', isVisible);
  charCount.classList.toggle('is-warning', isOverLimit);
  charCount.classList.toggle('text-neon-magenta', isOverLimit);
  charCount.classList.toggle('text-tertiary', !isOverLimit);

  if (isOverLimit) {
    textarea.setAttribute('aria-invalid', 'true');
  } else {
    textarea.removeAttribute('aria-invalid');
  }
};

const updateExperienceSendButtonState = (experienceId: string): void => {
  const runtime = runtimeRegistry.get(experienceId);

  if (!runtime) {
    return;
  }

  const { textarea, sendButton } = runtime;
  const trimmedLength = textarea.value.trim().length;
  const overLimit = textarea.value.length > MESSAGE_LENGTH_LIMIT;
  const isTyping = getExperienceChatTyping(experienceId);
  const isAnyProcessing = getIsAnyExperienceChatProcessing();
  const processingId = getProcessingExperienceId();
  const isBlockedByOtherChat =
    isAnyProcessing && processingId !== null && processingId !== experienceId;
  const shouldDisable =
    runtime.isSending || isTyping || trimmedLength === 0 || overLimit || isBlockedByOtherChat;

  sendButton.disabled = shouldDisable;
  sendButton.setAttribute('aria-disabled', String(shouldDisable));
  sendButton.setAttribute('aria-busy', String(runtime.isSending));
  sendButton.setAttribute(
    'aria-label',
    isBlockedByOtherChat
      ? 'Send disabled: another chat is processing a response'
      : 'Send experience message',
  );
};

const toggleExperienceSendButtonLoading = (experienceId: string, loading: boolean): void => {
  const runtime = runtimeRegistry.get(experienceId);

  if (!runtime) {
    return;
  }

  const { sendButton, sendLabel, sendSpinner } = runtime;

  runtime.isSending = loading;

  sendButton.classList.toggle('chat-input-send-button-loading', loading);
  sendLabel.textContent = loading ? 'Sending...' : 'Send';
  sendSpinner.hidden = !loading;

  updateExperienceSendButtonState(experienceId);
};

const updateExperienceTypingIndicator = (experienceId: string, isTyping: boolean): void => {
  const runtime = runtimeRegistry.get(experienceId);

  if (!runtime || !runtime.typingIndicator) {
    return;
  }

  runtime.typingIndicator.classList.toggle('hidden', !isTyping);
  runtime.typingIndicator.setAttribute('aria-hidden', String(!isTyping));
};

const scrollExperienceMessagesToBottom = (experienceId: string): void => {
  const runtime = runtimeRegistry.get(experienceId);

  if (!runtime) {
    return;
  }

  const { messagesContainer } = runtime;

  if (!messagesContainer) {
    return;
  }

  if (runtime.pendingAnimationFrame !== null) {
    cancelAnimationFrame(runtime.pendingAnimationFrame);
  }

  runtime.pendingAnimationFrame = requestAnimationFrame(() => {
    messagesContainer.scrollTo({
      top: messagesContainer.scrollHeight,
      behavior: 'smooth',
    });
    runtime.pendingAnimationFrame = null;
  });
};

const ensureExperienceSuggestionsState = (experienceId: string, hasMessages: boolean): void => {
  const runtime = runtimeRegistry.get(experienceId);

  if (!runtime) {
    return;
  }

  if (hasMessages) {
    if (runtime.suggestionsContainer) {
      runtime.suggestionsContainer
        .querySelectorAll<HTMLButtonElement>('[data-suggestion-chip]')
        .forEach((chip) => {
          const clone = chip.cloneNode(true) as HTMLButtonElement;
          chip.replaceWith(clone);
        });

      runtime.suggestionsContainer.remove();
      runtime.suggestionsContainer = null;
    }

    return;
  }

  if (runtime.suggestionsContainer) {
    return;
  }

  const footer = runtime.container.querySelector<HTMLElement>(EXPERIENCE_FOOTER_SELECTOR);

  if (!footer || !runtime.handleChipClick) {
    return;
  }

  const nextSuggestions = document.createElement('div');
  nextSuggestions.className = 'experience-chat-suggestions';
  nextSuggestions.dataset['experienceSuggestions'] = 'true';
  nextSuggestions.innerHTML = renderSuggestionChips(getExperienceSuggestionChips(runtime.experience));

  footer.insertBefore(nextSuggestions, footer.firstChild);

  runtime.suggestionsContainer = nextSuggestions;

  attachSuggestionChipListeners(runtime.handleChipClick, nextSuggestions);
};

const updateExperienceMessages = (experienceId: string): void => {
  const runtime = runtimeRegistry.get(experienceId);

  if (!runtime) {
    return;
  }

  const messagesContainer = runtime.messagesContainer;
  const messages = getExperienceChatMessages(experienceId);
  const hasMessages = messages.length > 0;
  const messageMarkup = hasMessages
    ? messages.map((message) => renderChatMessage(message)).join('')
    : renderEmptyState(runtime.experience);

  messagesContainer.innerHTML = messageMarkup;

  ensureExperienceSuggestionsState(experienceId, hasMessages);

  if (runtime.pendingAnimationFrame !== null) {
    cancelAnimationFrame(runtime.pendingAnimationFrame);
    runtime.pendingAnimationFrame = null;
  }

  scrollExperienceMessagesToBottom(experienceId);
};

const syncTextareaValueFromState = (experienceId: string, value: string): void => {
  const runtime = runtimeRegistry.get(experienceId);

  if (!runtime) {
    return;
  }

  const { textarea, textareaResizer } = runtime;

  if (textarea.value === value) {
    return;
  }

  textarea.value = value;
  textareaResizer.cancel();
  performExperienceTextareaResize(textarea);
  updateExperienceCharCount(experienceId);
  updateExperienceSendButtonState(experienceId);
};

const createResponseDelay = (): number =>
  RESPONSE_DELAY_MIN + Math.floor(Math.random() * (RESPONSE_DELAY_MAX - RESPONSE_DELAY_MIN + 1));

const handleExperienceMessageSubmit = (
  experienceId: string,
  runtime: ExperienceChatRuntime,
  chipId?: string,
): void => {
  const isAnyProcessing = getIsAnyExperienceChatProcessing();

  if (isAnyProcessing) {
    const processingId = getProcessingExperienceId();

    if (processingId && processingId !== experienceId) {
      showProcessingError(experienceId, processingId);
      return;
    }
  }

  const value = runtime.textarea.value;
  const trimmed = value.trim();

  if (!trimmed || trimmed.length > MESSAGE_LENGTH_LIMIT || runtime.isSending) {
    return;
  }

  const { experience, textarea, textareaResizer } = runtime;

  setExperienceChatProcessing(experienceId, true);
  toggleExperienceSendButtonLoading(experienceId, true);

  addExperienceChatMessage(experienceId, 'user', trimmed, {
    experienceContext: {
      experienceId,
      experienceTitle: experience.title,
    },
  });

  setExperienceChatInputValue(experienceId, '');
  textarea.value = '';
  delete runtime.lastChipText;
  delete runtime.pendingChipId;
  textareaResizer.cancel();
  performExperienceTextareaResize(textarea);
  updateExperienceCharCount(experienceId);
  updateExperienceSendButtonState(experienceId);
  scrollExperienceMessagesToBottom(experienceId);

  setExperienceChatTyping(experienceId, true);
  updateExperienceTypingIndicator(experienceId, true);

  const response = generateMockResponse(trimmed, chipId, {
    experienceId,
    experience,
  });

  const timeoutId = window.setTimeout(() => {
    addExperienceChatMessage(experienceId, 'assistant', response, {
      experienceContext: {
        experienceId,
        experienceTitle: experience.title,
      },
    });

    setExperienceChatTyping(experienceId, false);
    updateExperienceTypingIndicator(experienceId, false);
    toggleExperienceSendButtonLoading(experienceId, false);
    updateExperienceSendButtonState(experienceId);
    scrollExperienceMessagesToBottom(experienceId);

    runtime.pendingTimeouts.delete(timeoutId);
    setExperienceChatProcessing(null, false);
  }, createResponseDelay());

  runtime.pendingTimeouts.add(timeoutId);
};

const createStateListener = (
  experienceId: string,
): ExperienceChatStateListener =>
(state: ExperienceChatState, previousState: ExperienceChatState) => {
  const currentMessages = state.experienceChats.get(experienceId);
  const previousMessages = previousState.experienceChats.get(experienceId);

  if (currentMessages !== previousMessages) {
    updateExperienceMessages(experienceId);
  }

  const currentTyping = state.typingByExperience.get(experienceId) ?? false;
  const previousTyping = previousState.typingByExperience.get(experienceId) ?? false;

  if (currentTyping !== previousTyping) {
    updateExperienceTypingIndicator(experienceId, currentTyping);
    updateExperienceSendButtonState(experienceId);
  }

  const currentInput = state.inputValueByExperience.get(experienceId) ?? '';
  const previousInput = previousState.inputValueByExperience.get(experienceId) ?? '';

  if (currentInput !== previousInput) {
    syncTextareaValueFromState(experienceId, currentInput);
  }

  if (
    state.isAnyProcessing !== previousState.isAnyProcessing ||
    state.processingExperienceId !== previousState.processingExperienceId
  ) {
    updateExperienceSendButtonState(experienceId);
  }
};

const buildChipLookup = (chips: ExperienceSuggestionChip[]): Map<string, ExperienceSuggestionChip> => {
  const lookup = new Map<string, ExperienceSuggestionChip>();

  chips.forEach((chip) => {
    lookup.set(chip.text.trim(), chip);
  });

  return lookup;
};

export const renderExperienceChat = (experienceId: string, experience: Experience): string => {
  const messages = getExperienceChatMessages(experienceId);
  const chips = getExperienceSuggestionChips(experience);
  const inputValue = getExperienceChatInputValue(experienceId);
  const isTyping = getExperienceChatTyping(experienceId);
  const hasMessages = messages.length > 0;
  const messageMarkup = hasMessages
    ? messages.map((message) => renderChatMessage(message)).join('')
    : renderEmptyState(experience);
  const suggestionMarkup = renderSuggestionChips(chips);
  const escapedId = escapeHtml(experienceId);
  const experienceLabel = `Chat about ${experience.title} at ${experience.company}`;

  return `
    <section
      class="experience-chat grid h-full grid-rows-[auto_1fr_auto] overflow-hidden rounded-xl border border-default bg-surface-card backdrop-blur"
      data-experience-chat
      data-experience-id="${escapedId}"
      role="region"
      aria-label="${escapeHtml(experienceLabel)}"
    >
      <header class="experience-chat-header">
        <div class="experience-chat-header-content">
          <p class="experience-chat-header-title">${escapeHtml(experience.title)}</p>
          <p class="experience-chat-header-company">${escapeHtml(experience.company)}</p>
        </div>
        <button
          type="button"
          class="experience-chat-close-button"
          aria-label="Close chat"
          data-experience-chat-close
        >&times;</button>
      </header>
      <div class="experience-chat-body px-4 py-4">
        <div
          class="experience-chat-messages flex flex-col gap-3 overflow-y-auto px-3 py-4 border border-default rounded-lg bg-surface-muted ${hasMessages ? '' : 'is-empty'}"
          data-experience-messages
          role="log"
          aria-live="polite"
          aria-relevant="additions text"
        >
          ${messageMarkup}
        </div>
        <div
          class="experience-chat-typing text-sm text-secondary transition-opacity ${isTyping ? '' : 'hidden'}"
          data-experience-typing
          aria-live="polite"
          aria-hidden="${isTyping ? 'false' : 'true'}"
        >
          Thinking through this experience...
        </div>
      </div>
      <div class="experience-chat-footer border-t border-default bg-surface-muted px-4 py-4" data-experience-footer>
        ${
          hasMessages
            ? ''
            : `<div class="experience-chat-suggestions" data-experience-suggestions>${suggestionMarkup}</div>`
        }
        <form class="experience-chat-input space-y-2" data-experience-input novalidate>
          <div class="flex items-end gap-3 border border-default bg-surface-muted rounded-lg p-3 focus-within:border-neon-cyan focus-within:shadow-brutal transition-all">
            <textarea
              class="experience-chat-textarea chat-input-textarea flex-1 bg-transparent text-primary resize-none outline-none min-h-[44px] max-h-[200px] text-base leading-relaxed"
              placeholder="Ask something about this experience..."
              aria-label="Chat message input for experience"
              rows="1"
              maxlength="${MESSAGE_LENGTH_LIMIT}"
              inputmode="text"
              enterkeyhint="send"
              autocomplete="off"
              autocapitalize="sentences"
              spellcheck="true"
              data-experience-textarea>${escapeHtml(inputValue)}</textarea>
            <button
              type="submit"
              class="chat-input-send-button px-4 py-2 bg-surface-secondary text-primary font-bold rounded-md border-2 border-default hover:border-neon-cyan hover-surface transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              data-experience-send-button
              aria-label="Send experience message"
              aria-disabled="true"
              disabled
            >
              <span class="chat-input-send-button-label" data-experience-send-label>Send</span>
              <span class="chat-input-send-button-spinner" data-experience-send-spinner aria-hidden="true" hidden></span>
            </button>
          </div>
          <div class="flex justify-end">
            <span
              class="chat-input-char-count text-xs text-tertiary"
              data-experience-char-count
              role="status"
              aria-live="polite"
            ></span>
          </div>
        </form>
      </div>
    </section>
  `;
};

export const attachExperienceChatListeners = (
  experienceId: string,
  experience: Experience,
): void => {
  const container = getExperienceChatContainer(experienceId);

  if (!container) {
    return;
  }

  cleanupExperienceChat(experienceId);

  const textarea = container.querySelector<HTMLTextAreaElement>(EXPERIENCE_TEXTAREA_SELECTOR);
  const sendButton = container.querySelector<HTMLButtonElement>(EXPERIENCE_SEND_BUTTON_SELECTOR);
  const sendLabel = container.querySelector<HTMLElement>(EXPERIENCE_SEND_LABEL_SELECTOR);
  const sendSpinner = container.querySelector<HTMLElement>(EXPERIENCE_SEND_SPINNER_SELECTOR);
  const charCount = container.querySelector<HTMLElement>(EXPERIENCE_CHAR_COUNT_SELECTOR);
  const messagesContainer = container.querySelector<HTMLElement>(EXPERIENCE_MESSAGES_SELECTOR);
  const typingIndicator = container.querySelector<HTMLElement>(EXPERIENCE_TYPING_SELECTOR);
  const suggestionsContainer = container.querySelector<HTMLElement>(EXPERIENCE_SUGGESTIONS_SELECTOR);
  const closeButton = container.querySelector<HTMLButtonElement>(EXPERIENCE_CHAT_CLOSE_SELECTOR);
  const form = container.querySelector<HTMLFormElement>(EXPERIENCE_INPUT_SELECTOR);

  if (!textarea || !sendButton || !sendLabel || !sendSpinner || !messagesContainer) {
    return;
  }

  const textareaResizer = createTextareaResizer();
  const pendingTimeouts = new Set<number>();
  const chipLookup = buildChipLookup(getExperienceSuggestionChips(experience));

  const runtime: ExperienceChatRuntime = {
    experience,
    container,
    form,
    textarea,
    sendButton,
    sendLabel,
    sendSpinner,
    charCount,
    messagesContainer,
    typingIndicator,
    suggestionsContainer,
    closeButton,
    textareaResizer,
    pendingTimeouts,
    pendingAnimationFrame: null,
    isSending: false,
    chipLookup,
  };

  runtimeRegistry.set(experienceId, runtime);

  textarea.value = getExperienceChatInputValue(experienceId);
  textareaResizer.cancel();
  performExperienceTextareaResize(textarea);
  updateExperienceCharCount(experienceId);
  updateExperienceSendButtonState(experienceId);
  updateExperienceTypingIndicator(experienceId, getExperienceChatTyping(experienceId));

  const handleInput = (event: Event) => {
    const target = event.currentTarget as HTMLTextAreaElement;

    textareaResizer(target);
    updateExperienceCharCount(experienceId);

    const value = target.value;
    if (runtime.lastChipText && value.trim() !== runtime.lastChipText.trim()) {
      delete runtime.pendingChipId;
      delete runtime.lastChipText;
    }

    setExperienceChatInputValue(experienceId, value);
    updateExperienceSendButtonState(experienceId);
  };

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleExperienceMessageSubmit(experienceId, runtime, runtime.pendingChipId);
    }
  };

  const handleSubmit = (event: Event) => {
    event.preventDefault();
    handleExperienceMessageSubmit(experienceId, runtime, runtime.pendingChipId);
  };

  const handleButtonClick = (event: MouseEvent) => {
    event.preventDefault();
    handleExperienceMessageSubmit(experienceId, runtime, runtime.pendingChipId);
  };

  runtime.inputHandler = handleInput;
  runtime.keydownHandler = handleKeydown;
  runtime.submitHandler = handleSubmit;
  runtime.buttonClickHandler = handleButtonClick;

  textarea.addEventListener('input', handleInput);
  textarea.addEventListener('keydown', handleKeydown);

  if (form) {
    form.addEventListener('submit', handleSubmit);
  }

  sendButton.addEventListener('click', handleButtonClick);

  const handleChipClick = (chipText: string) => {
    textarea.value = chipText;
    runtime.lastChipText = chipText;

    const matchedChip = runtime.chipLookup.get(chipText.trim());
    if (matchedChip) {
      runtime.pendingChipId = matchedChip.id;
    } else {
      delete runtime.pendingChipId;
    }

    textareaResizer.cancel();
    performExperienceTextareaResize(textarea);
    setExperienceChatInputValue(experienceId, chipText);
    updateExperienceCharCount(experienceId);
    updateExperienceSendButtonState(experienceId);

    textarea.focus({ preventScroll: true });
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
  };

  if (suggestionsContainer) {
    attachSuggestionChipListeners(handleChipClick, suggestionsContainer);
  }

  runtime.handleChipClick = handleChipClick;

  if (closeButton) {
    const handleCloseClick = (event: Event) => {
      event.preventDefault();
      const closeEvent = new CustomEvent('experience-chat-close', {
        detail: { experienceId },
        bubbles: true,
      });
      container.dispatchEvent(closeEvent);
    };

    runtime.closeButtonHandler = handleCloseClick;
    closeButton.addEventListener('click', handleCloseClick);
  }

  runtime.unsubscribe = subscribeToExperienceChatState(createStateListener(experienceId));

  updateExperienceMessages(experienceId);
};

export const cleanupExperienceChat = (
  experienceId: string,
  options?: { resetState?: boolean },
): void => {
  const runtime = runtimeRegistry.get(experienceId);

  if (!runtime) {
    if (options?.resetState) {
      clearExperienceChat(experienceId);
    }
    return;
  }

  const { textarea, sendButton, form, textareaResizer, suggestionsContainer, closeButton } = runtime;

  if (runtime.inputHandler) {
    textarea.removeEventListener('input', runtime.inputHandler);
  }

  if (runtime.keydownHandler) {
    textarea.removeEventListener('keydown', runtime.keydownHandler);
  }

  if (form && runtime.submitHandler) {
    form.removeEventListener('submit', runtime.submitHandler);
  }

  if (runtime.buttonClickHandler) {
    sendButton.removeEventListener('click', runtime.buttonClickHandler);
  }

  if (closeButton && runtime.closeButtonHandler) {
    closeButton.removeEventListener('click', runtime.closeButtonHandler);
  }

  textareaResizer.cancel();

  runtime.pendingTimeouts.forEach((timeoutId) => {
    window.clearTimeout(timeoutId);
  });
  runtime.pendingTimeouts.clear();

  if (runtime.processingErrorTimeoutId) {
    window.clearTimeout(runtime.processingErrorTimeoutId);
    delete runtime.processingErrorTimeoutId;
  }

  const processingError = runtime.container.querySelector<HTMLElement>('[data-processing-error]');
  processingError?.remove();

  if (getProcessingExperienceId() === experienceId) {
    setExperienceChatProcessing(null, false);
  }

  if (runtime.pendingAnimationFrame !== null) {
    cancelAnimationFrame(runtime.pendingAnimationFrame);
  }

  runtime.unsubscribe?.();

  if (suggestionsContainer) {
    suggestionsContainer
      .querySelectorAll<HTMLButtonElement>('[data-suggestion-chip]')
      .forEach((chip) => {
        const clone = chip.cloneNode(true) as HTMLButtonElement;
        chip.replaceWith(clone);
      });
  }

  runtimeRegistry.delete(experienceId);

  if (options?.resetState) {
    clearExperienceChat(experienceId);
  }
};
