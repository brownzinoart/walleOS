import { addWillChange, removeWillChange, debounce } from '@/utils/performance';

const CHAT_INPUT_CONTAINER_SELECTOR = '[data-chat-input-container]';
const CHAT_TEXTAREA_SELECTOR = '[data-chat-input]';
const CHAT_SEND_BUTTON_SELECTOR = '[data-chat-send]';
const CHAT_SEND_LABEL_SELECTOR = '[data-chat-send-label]';
const CHAT_SEND_SPINNER_SELECTOR = '[data-chat-send-spinner]';
const CHAT_CHAR_COUNT_SELECTOR = '[data-chat-char-count]';

const MAX_TEXTAREA_HEIGHT = 200;
const MESSAGE_LENGTH_LIMIT = 600;
const CHAR_COUNT_THRESHOLD = 0.8;
const BUTTON_ANIMATION_DURATION = 220;

let containerRef: HTMLElement | null = null;
let textareaRef: HTMLTextAreaElement | null = null;
let sendButtonRef: HTMLButtonElement | null = null;
let sendLabelRef: HTMLElement | null = null;
let sendSpinnerRef: HTMLElement | null = null;
let charCountRef: HTMLElement | null = null;

let isLoading = false;
let sendAnimationTimeoutId: number | null = null;
let keyboardCleanup: (() => void) | null = null;

const ensureRefs = () => {
  if (!containerRef) {
    containerRef = document.querySelector<HTMLElement>(CHAT_INPUT_CONTAINER_SELECTOR);
  }

  if (!containerRef) {
    return;
  }

  textareaRef = containerRef.querySelector<HTMLTextAreaElement>(CHAT_TEXTAREA_SELECTOR);
  sendButtonRef = containerRef.querySelector<HTMLButtonElement>(CHAT_SEND_BUTTON_SELECTOR);
  sendLabelRef = containerRef.querySelector<HTMLElement>(CHAT_SEND_LABEL_SELECTOR);
  sendSpinnerRef = containerRef.querySelector<HTMLElement>(CHAT_SEND_SPINNER_SELECTOR);
  charCountRef = containerRef.querySelector<HTMLElement>(CHAT_CHAR_COUNT_SELECTOR);
};

const performTextareaResize = (textarea: HTMLTextAreaElement) => {
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

const scheduleTextareaResize = debounce((textarea: HTMLTextAreaElement) => {
  performTextareaResize(textarea);
}, 80);

const stopPendingResize = () => {
  if ('cancel' in scheduleTextareaResize && typeof scheduleTextareaResize.cancel === 'function') {
    scheduleTextareaResize.cancel();
  }
};

const triggerButtonFeedback = () => {
  if (!sendButtonRef) {
    return;
  }

  sendButtonRef.classList.add('chat-input-send-button-active');

  if (sendAnimationTimeoutId) {
    window.clearTimeout(sendAnimationTimeoutId);
  }

  sendAnimationTimeoutId = window.setTimeout(() => {
    sendButtonRef?.classList.remove('chat-input-send-button-active');
    sendAnimationTimeoutId = null;
  }, BUTTON_ANIMATION_DURATION);
};

const updateCharCount = () => {
  if (!textareaRef || !charCountRef) {
    return;
  }

  const length = textareaRef.value.length;
  const threshold = MESSAGE_LENGTH_LIMIT * CHAR_COUNT_THRESHOLD;
  const isVisible = length >= threshold || length >= MESSAGE_LENGTH_LIMIT;
  const isOverLimit = length > MESSAGE_LENGTH_LIMIT;

  charCountRef.textContent = `${length}/${MESSAGE_LENGTH_LIMIT}`;
  charCountRef.classList.toggle('is-visible', isVisible);
  charCountRef.classList.toggle('is-warning', isOverLimit);

  if (isOverLimit) {
    textareaRef.setAttribute('aria-invalid', 'true');
  } else {
    textareaRef.removeAttribute('aria-invalid');
  }
};

const updateSendButtonState = () => {
  if (!textareaRef || !sendButtonRef) {
    return;
  }

  const value = textareaRef.value;
  const trimmedLength = value.trim().length;
  const overLimit = value.length > MESSAGE_LENGTH_LIMIT;
  const shouldDisable = isLoading || trimmedLength === 0 || overLimit;

  sendButtonRef.disabled = shouldDisable;
  sendButtonRef.setAttribute('aria-disabled', String(shouldDisable));
};

const attachKeyboardVisibilityListeners = () => {
  if (!containerRef || !textareaRef) {
    return;
  }

  keyboardCleanup?.();

  const viewport = window.visualViewport;

  if (!viewport) {
    requestAnimationFrame(() => {
      textareaRef?.scrollIntoView({ block: 'end', behavior: 'smooth' });
    });
    return;
  }

  const updateOffset = () => {
    if (!containerRef) {
      return;
    }

    const offset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
    containerRef.style.setProperty('--keyboard-offset', `${offset}px`);
  };

  const handleViewportChange = () => {
    requestAnimationFrame(updateOffset);
  };

  viewport.addEventListener('resize', handleViewportChange);
  viewport.addEventListener('scroll', handleViewportChange);
  updateOffset();

  keyboardCleanup = () => {
    containerRef?.style.removeProperty('--keyboard-offset');
    viewport.removeEventListener('resize', handleViewportChange);
    viewport.removeEventListener('scroll', handleViewportChange);
    keyboardCleanup = null;
  };
};

const clearKeyboardOffset = () => {
  keyboardCleanup?.();
};

const handleSubmit = (onSubmit: (message: string) => void) => {
  if (!textareaRef) {
    return;
  }

  const value = textareaRef.value.trim();

  if (!value || value.length > MESSAGE_LENGTH_LIMIT || isLoading) {
    return;
  }

  triggerButtonFeedback();
  onSubmit(value);

  textareaRef.value = '';
  stopPendingResize();
  performTextareaResize(textareaRef);
  updateCharCount();
  updateSendButtonState();
};

export const renderChatInput = (): string => `
  <div
    class="chat-input-container fixed inset-x-0 bottom-0 z-10 w-full max-w-3xl mx-auto px-4 pb-4 md:static md:px-0 md:pb-0"
    data-chat-input-container
  >
    <div class="flex gap-2 border-2 border-gray-800 bg-gray-900 rounded-lg p-3 focus-within:border-neon-cyan focus-within:shadow-brutal transition-all">
      <textarea
        class="chat-input-textarea flex-1 bg-transparent text-white resize-none outline-none min-h-[44px] max-h-[200px] text-base leading-relaxed placeholder-gray-500"
        placeholder="Ask me anything..."
        aria-label="Chat message input"
        rows="1"
        maxlength="${MESSAGE_LENGTH_LIMIT}"
        inputmode="text"
        enterkeyhint="send"
        autocomplete="off"
        autocapitalize="sentences"
        spellcheck="true"
        data-chat-input
      ></textarea>
      <button
        type="button"
        class="chat-input-send-button px-4 py-2 bg-neon-cyan text-black font-bold rounded-md hover:bg-neon-lime transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        data-chat-send
        aria-label="Send message"
        aria-disabled="true"
        disabled
      >
        <span class="chat-input-send-button-label" data-chat-send-label>Send</span>
        <span class="chat-input-send-button-spinner" data-chat-send-spinner aria-hidden="true" hidden></span>
      </button>
      <span
        class="chat-input-char-count"
        data-chat-char-count
        role="status"
        aria-live="polite"
      ></span>
    </div>
  </div>
`;

export const attachChatInputListeners = (onSubmit: (message: string) => void): void => {
  containerRef = document.querySelector<HTMLElement>(CHAT_INPUT_CONTAINER_SELECTOR);
  textareaRef = containerRef?.querySelector<HTMLTextAreaElement>(CHAT_TEXTAREA_SELECTOR) ?? null;
  sendButtonRef = containerRef?.querySelector<HTMLButtonElement>(CHAT_SEND_BUTTON_SELECTOR) ?? null;
  sendLabelRef = containerRef?.querySelector<HTMLElement>(CHAT_SEND_LABEL_SELECTOR) ?? null;
  sendSpinnerRef = containerRef?.querySelector<HTMLElement>(CHAT_SEND_SPINNER_SELECTOR) ?? null;
  charCountRef = containerRef?.querySelector<HTMLElement>(CHAT_CHAR_COUNT_SELECTOR) ?? null;

  if (!containerRef || !textareaRef || !sendButtonRef || !sendLabelRef || !sendSpinnerRef) {
    return;
  }

  performTextareaResize(textareaRef);
  updateCharCount();
  updateSendButtonState();

  const handleInput = () => {
    scheduleTextareaResize(textareaRef as HTMLTextAreaElement);
    updateCharCount();
    updateSendButtonState();
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(onSubmit);
    }
  };

  const handleClick = () => {
    handleSubmit(onSubmit);
  };

  const handleFocus = () => {
    attachKeyboardVisibilityListeners();
  };

  textareaRef.addEventListener('input', handleInput);
  textareaRef.addEventListener('keydown', handleKeyDown);
  textareaRef.addEventListener('focus', handleFocus);
  textareaRef.addEventListener('blur', clearKeyboardOffset);

  sendButtonRef.addEventListener('click', handleClick);
};

export const setChatInputValue = (value: string): void => {
  if (!textareaRef || !sendButtonRef) {
    ensureRefs();
  }

  if (!textareaRef || !sendButtonRef) {
    return;
  }

  textareaRef.value = value;
  stopPendingResize();
  performTextareaResize(textareaRef);
  updateCharCount();
  updateSendButtonState();

  textareaRef.focus({ preventScroll: true });
  textareaRef.setSelectionRange(textareaRef.value.length, textareaRef.value.length);
};

export const setButtonLoading = (loading: boolean): void => {
  if (!sendButtonRef || !sendLabelRef || !sendSpinnerRef) {
    ensureRefs();
  }

  if (!sendButtonRef || !sendLabelRef || !sendSpinnerRef) {
    return;
  }

  isLoading = loading;

  if (sendAnimationTimeoutId) {
    window.clearTimeout(sendAnimationTimeoutId);
    sendAnimationTimeoutId = null;
    sendButtonRef.classList.remove('chat-input-send-button-active');
  }

  sendButtonRef.classList.toggle('chat-input-send-button-loading', loading);
  sendButtonRef.setAttribute('aria-busy', String(loading));

  if (loading) {
    sendLabelRef.textContent = 'Sending...';
    sendSpinnerRef.hidden = false;
  } else {
    sendLabelRef.textContent = 'Send';
    sendSpinnerRef.hidden = true;
  }

  updateSendButtonState();
};
