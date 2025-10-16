import type { ChatMessage, MessageAnimationState } from '@/types';
import {
  createMessageAnimator,
  splitPreservingWhitespace,
  type MessageAnimator,
  type MessageAnimatorProgressPayload,
} from '@/utils/messageAnimator';
import { prefersReducedMotion } from '@/utils/performance';

export interface ExperienceChatState {
  experienceChats: Map<string, ChatMessage[]>;
  typingByExperience: Map<string, boolean>;
  inputValueByExperience: Map<string, string>;
  isAnyProcessing: boolean;
  processingExperienceId: string | null;
}

export type ExperienceChatStateListener = (
  state: ExperienceChatState,
  previousState: ExperienceChatState,
) => void;

let experienceChatState: ExperienceChatState = {
  experienceChats: new Map(),
  typingByExperience: new Map(),
  inputValueByExperience: new Map(),
  isAnyProcessing: false,
  processingExperienceId: null,
};

const listeners = new Set<ExperienceChatStateListener>();

const notifyListeners = (previousState: ExperienceChatState): void => {
  listeners.forEach((listener) => {
    listener(experienceChatState, previousState);
  });
};

const setState = (
  updater: ExperienceChatState | ((state: ExperienceChatState) => ExperienceChatState),
): ExperienceChatState => {
  const previousState = experienceChatState;
  const nextState =
    typeof updater === 'function'
      ? (updater as (state: ExperienceChatState) => ExperienceChatState)(experienceChatState)
      : updater;

  if (nextState === previousState) {
    return experienceChatState;
  }

  experienceChatState = nextState;
  notifyListeners(previousState);

  return experienceChatState;
};

const generateMessageId = () => `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`;

type ChatMessageMeta = Pick<ChatMessage, 'experienceContext'>;

const createExperienceMessage = (
  role: ChatMessage['role'],
  content: string,
  meta?: ChatMessageMeta,
): ChatMessage => ({
  id: generateMessageId(),
  role,
  content,
  timestamp: new Date(),
  ...(meta ?? {}),
});

export const addExperienceChatMessage = (
  experienceId: string,
  role: 'user' | 'assistant',
  content: string,
  meta?: ChatMessageMeta,
): ChatMessage | null => {
  const trimmed = content.trim();

  if (!trimmed) {
    return null;
  }

  const base = createExperienceMessage(role, trimmed, meta);
  const message: ChatMessage = {
    ...base,
    ...(role === 'user'
      ? { animationState: 'idle' as MessageAnimationState }
      : base.animationState !== undefined
      ? { animationState: base.animationState }
      : {}),
  };

  setState((state) => {
    const existingMessages = state.experienceChats.get(experienceId) ?? [];
    const nextMessages = [...existingMessages, message];
    const nextExperienceChats = new Map(state.experienceChats);
    nextExperienceChats.set(experienceId, nextMessages);

    return {
      ...state,
      experienceChats: nextExperienceChats,
    };
  });

  return message;
};

// Streaming helpers for experience chats
export const addExperienceAssistantPlaceholder = (
  experienceId: string,
  meta?: ChatMessageMeta,
): ChatMessage => {
  const message: ChatMessage = {
    ...createExperienceMessage('assistant', '', meta),
    animationState: 'buffering',
    bufferedContent: '',
    displayContent: '',
    animateThisMessage: !prefersReducedMotion(),
    initialEnter: true,
  };

  setState((state) => {
    const existingMessages = state.experienceChats.get(experienceId) ?? [];
    const nextMessages = [...existingMessages, message];
    const nextExperienceChats = new Map(state.experienceChats);
    nextExperienceChats.set(experienceId, nextMessages);
    return { ...state, experienceChats: nextExperienceChats };
  });

  return message;
};

// Consume one-shot initial-enter flags for a single experience chat.
export const consumeExperienceInitialEnterFlags = (experienceId: string): void => {
  setState((state) => {
    const list = state.experienceChats.get(experienceId) ?? [];
    if (!list.some((m) => m.initialEnter)) {
      return state;
    }
    const nextList = list.map((m) => (m.initialEnter ? { ...m, initialEnter: false } : m));
    const nextMap = new Map(state.experienceChats);
    nextMap.set(experienceId, nextList);
    return { ...state, experienceChats: nextMap };
  });
};

export const appendToExperienceMessage = (
  experienceId: string,
  messageId: string,
  delta: string,
): void => {
  if (!delta) return;
  setState((state) => {
    const list = state.experienceChats.get(experienceId) ?? [];
    const next = list.map((m) => {
      if (m.id !== messageId) return m;
      const useBuffer = m.animateThisMessage ?? !prefersReducedMotion();
      if (useBuffer) {
        return { ...m, bufferedContent: (m.bufferedContent ?? '') + delta };
      }
      return { ...m, content: m.content + delta };
    });
    const nextMap = new Map(state.experienceChats);
    nextMap.set(experienceId, next);
    return { ...state, experienceChats: nextMap };
  });
};

export const setExperienceMessageContent = (
  experienceId: string,
  messageId: string,
  content: string,
): void => {
  setState((state) => {
    const list = state.experienceChats.get(experienceId) ?? [];
    const next = list.map((m) => (m.id === messageId ? { ...m, content } : m));
    const nextMap = new Map(state.experienceChats);
    nextMap.set(experienceId, next);
    return { ...state, experienceChats: nextMap };
  });
};

// Animation helpers for experience chats
const expAnimatorRegistry = new Map<string, MessageAnimator>(); // key: `${experienceId}::${messageId}`

const keyFor = (experienceId: string, messageId: string) => `${experienceId}::${messageId}`;

const toCompletedMessage = (message: ChatMessage, content: string): ChatMessage => ({
  ...message,
  content,
  displayContent: content,
  bufferedContent: content,
  animationState: 'complete' as MessageAnimationState,
});

interface ExperienceMessageDomTracker {
  contentEl: HTMLElement;
  pointer: number;
}

const experienceMessageDomTrackers = new Map<string, ExperienceMessageDomTracker>();
const EXPERIENCE_MESSAGE_WORD_CLASS = 'message-word';
const EXPERIENCE_MESSAGE_WORD_NEW_CLASS = 'message-word--new';
const experienceWhitespaceTokenPattern = /^\s+$/;

const escapeExperienceToken = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatExperienceTokenHtml = (token: string, index: number): string => {
  if (experienceWhitespaceTokenPattern.test(token)) {
    return token;
  }

  return `<span class="${EXPERIENCE_MESSAGE_WORD_CLASS}" data-index="${index}">${escapeExperienceToken(token)}</span>`;
};

const getExperienceMessageContentElement = (messageId: string): HTMLElement | null => {
  if (typeof document === 'undefined') {
    return null;
  }

  const root = document.querySelector<HTMLElement>(`[data-message-id="${messageId}"]`);

  if (!root) {
    return null;
  }

  return root.querySelector<HTMLElement>('p');
};

const ensureExperienceMessageDomTracker = (
  experienceId: string,
  messageId: string,
  expectedStartIndex: number,
): ExperienceMessageDomTracker | null => {
  if (typeof document === 'undefined') {
    return null;
  }

  const key = keyFor(experienceId, messageId);
  const cached = experienceMessageDomTrackers.get(key);

  if (cached && document.contains(cached.contentEl)) {
    return cached;
  }

  const contentEl = getExperienceMessageContentElement(messageId);

  if (!contentEl) {
    experienceMessageDomTrackers.delete(key);
    return null;
  }

  const tracker: ExperienceMessageDomTracker = {
    contentEl,
    pointer: expectedStartIndex,
  };

  experienceMessageDomTrackers.set(key, tracker);

  return tracker;
};

const rebuildExperienceMessageDomIfNeeded = (
  experienceId: string,
  messageId: string,
  tracker: ExperienceMessageDomTracker,
  expectedStartIndex: number,
): void => {
  if (tracker.pointer === expectedStartIndex) {
    return;
  }

  const messages = experienceChatState.experienceChats.get(experienceId);
  const message = messages?.find((m) => m.id === messageId);

  if (!message) {
    tracker.pointer = expectedStartIndex;
    return;
  }

  const source = message.bufferedContent ?? message.content ?? '';

  if (!source) {
    tracker.contentEl.textContent = '';
    tracker.pointer = expectedStartIndex;
    return;
  }

  const tokens = splitPreservingWhitespace(source);
  const html = tokens
    .slice(0, expectedStartIndex)
    .map((token, idx) => formatExperienceTokenHtml(token, idx))
    .join('');

  tracker.contentEl.innerHTML = html;
  tracker.pointer = expectedStartIndex;
};

const appendExperienceTokensToDisplayCache = (
  experienceId: string,
  messageId: string,
  payload: MessageAnimatorProgressPayload,
): void => {
  if (payload.newTokens.length === 0) {
    return;
  }

  const messages = experienceChatState.experienceChats.get(experienceId);
  const message = messages?.find((m) => m.id === messageId);

  if (!message) {
    return;
  }

  const addition = payload.newTokens
    .map((token, offset) => formatExperienceTokenHtml(token, payload.startIndex + offset))
    .join('');

  message.displayContent = `${message.displayContent ?? ''}${addition}`;
};

const clearExperienceMessageDomTracker = (experienceId: string, messageId: string): void => {
  const key = keyFor(experienceId, messageId);
  experienceMessageDomTrackers.delete(key);
};

const handleExperienceMessageAnimationProgress = (
  experienceId: string,
  messageId: string,
  payload: MessageAnimatorProgressPayload,
): void => {
  appendExperienceTokensToDisplayCache(experienceId, messageId, payload);

  if (typeof document === 'undefined') {
    return;
  }

  const tracker = ensureExperienceMessageDomTracker(
    experienceId,
    messageId,
    payload.startIndex,
  );

  if (!tracker) {
    return;
  }

  rebuildExperienceMessageDomIfNeeded(experienceId, messageId, tracker, payload.startIndex);

  const { contentEl } = tracker;
  const existingNewTokens = contentEl.querySelectorAll<HTMLElement>(`.${EXPERIENCE_MESSAGE_WORD_NEW_CLASS}`);
  existingNewTokens.forEach((node) => node.classList.remove(EXPERIENCE_MESSAGE_WORD_NEW_CLASS));

  if (payload.newTokens.length === 0) {
    tracker.pointer = payload.revealedTokens;
    return;
  }

  const fragment = document.createDocumentFragment();

  payload.newTokens.forEach((token, offset) => {
    const index = payload.startIndex + offset;

    if (experienceWhitespaceTokenPattern.test(token)) {
      fragment.appendChild(document.createTextNode(token));
      return;
    }

    const span = document.createElement('span');
    span.className = `${EXPERIENCE_MESSAGE_WORD_CLASS} ${EXPERIENCE_MESSAGE_WORD_NEW_CLASS}`;
    span.dataset['index'] = String(index);
    span.textContent = token;
    fragment.appendChild(span);

    requestAnimationFrame(() => {
      span.classList.remove(EXPERIENCE_MESSAGE_WORD_NEW_CLASS);
    });
  });

  if (fragment.childNodes.length > 0) {
    contentEl.appendChild(fragment);
  }

  tracker.pointer = payload.revealedTokens;
};

export const setExperienceMessageBufferedContent = (
  experienceId: string,
  messageId: string,
  content: string,
): void => {
  setState((state) => {
    const list = state.experienceChats.get(experienceId) ?? [];
    const next = list.map((m) => (m.id === messageId ? { ...m, bufferedContent: content } : m));
    const map = new Map(state.experienceChats);
    map.set(experienceId, next);
    return { ...state, experienceChats: map };
  });
};

const setExperienceMessageDisplayContentState = (
  experienceId: string,
  messageId: string,
  displayContent: string,
): void => {
  setState((state) => {
    const list = state.experienceChats.get(experienceId) ?? [];
    const next = list.map((m) => (m.id === messageId ? { ...m, displayContent } : m));
    const map = new Map(state.experienceChats);
    map.set(experienceId, next);
    return { ...state, experienceChats: map };
  });
};

export const setExperienceMessageAnimationState = (
  experienceId: string,
  messageId: string,
  state: MessageAnimationState,
): void => {
  setState((s) => {
    const list = s.experienceChats.get(experienceId) ?? [];
    const next = list.map((m) => (m.id === messageId ? { ...m, animationState: state } : m));
    const map = new Map(s.experienceChats);
    map.set(experienceId, next);
    return { ...s, experienceChats: map };
  });
};

export const startExperienceMessageAnimation = (
  experienceId: string,
  messageId: string,
): void => {
  const list = getExperienceChatMessages(experienceId);
  const message = list.find((m) => m.id === messageId);
  if (!message) return;

  const key = keyFor(experienceId, messageId);
  const reduceMotion = prefersReducedMotion();
  const full = message.bufferedContent ?? message.content ?? '';
  const shouldAnimate = (message.animateThisMessage ?? !reduceMotion) && !reduceMotion;

  if (!shouldAnimate) {
    setState((s) => {
      const l = s.experienceChats.get(experienceId) ?? [];
      const n = l.map((m) => (m.id === messageId ? toCompletedMessage(m, full) : m));
      const map = new Map(s.experienceChats);
      map.set(experienceId, n);
      return { ...s, experienceChats: map };
    });
    expAnimatorRegistry.delete(key);
    clearExperienceMessageDomTracker(experienceId, messageId);
    return;
  }

  setExperienceMessageAnimationState(experienceId, messageId, 'animating');
  setExperienceMessageDisplayContentState(experienceId, messageId, '');
  clearExperienceMessageDomTracker(experienceId, messageId);

  const animator = createMessageAnimator({
    id: key,
    content: full,
    callbacks: {
      onProgress: (payload) =>
        handleExperienceMessageAnimationProgress(experienceId, messageId, payload),
      onComplete: () => {
        setState((s) => {
          const l = s.experienceChats.get(experienceId) ?? [];
          const n = l.map((m) => (m.id === messageId ? toCompletedMessage(m, full) : m));
          const map = new Map(s.experienceChats);
          map.set(experienceId, n);
          return { ...s, experienceChats: map };
        });
        expAnimatorRegistry.delete(key);
        clearExperienceMessageDomTracker(experienceId, messageId);
      },
      onCancel: () => {
        expAnimatorRegistry.delete(key);
        clearExperienceMessageDomTracker(experienceId, messageId);
      },
    },
  });

  expAnimatorRegistry.set(key, animator);
  animator.start();
};

export const cancelExperienceMessageAnimation = (
  experienceId: string,
  messageId: string,
): void => {
  const k = keyFor(experienceId, messageId);
  const animator = expAnimatorRegistry.get(k);
  animator?.cancel();
  expAnimatorRegistry.delete(k);
  clearExperienceMessageDomTracker(experienceId, messageId);
};

export const getExperienceChatMessages = (experienceId: string): ChatMessage[] => {
  const messages = experienceChatState.experienceChats.get(experienceId);
  return messages ? [...messages] : [];
};

export const getExperienceChatState = (): ExperienceChatState => experienceChatState;

export const setExperienceChatTyping = (experienceId: string, isTyping: boolean): void => {
  setState((state) => {
    const currentValue = state.typingByExperience.get(experienceId);

    if (currentValue === isTyping) {
      return state;
    }

    const nextTypingByExperience = new Map(state.typingByExperience);
    nextTypingByExperience.set(experienceId, isTyping);

    return {
      ...state,
      typingByExperience: nextTypingByExperience,
    };
  });
};

export const getExperienceChatTyping = (experienceId: string): boolean =>
  experienceChatState.typingByExperience.get(experienceId) ?? false;

export const setExperienceChatInputValue = (experienceId: string, inputValue: string): void => {
  setState((state) => {
    const currentValue = state.inputValueByExperience.get(experienceId) ?? '';

    if (currentValue === inputValue) {
      return state;
    }

    const nextInputValueByExperience = new Map(state.inputValueByExperience);
    nextInputValueByExperience.set(experienceId, inputValue);

    return {
      ...state,
      inputValueByExperience: nextInputValueByExperience,
    };
  });
};

export const getExperienceChatInputValue = (experienceId: string): string => {
  return experienceChatState.inputValueByExperience.get(experienceId) ?? '';
};

export const clearExperienceChat = (experienceId: string): void => {
  setState((state) => {
    const hasMessages = state.experienceChats.has(experienceId);
    const hasTyping = state.typingByExperience.has(experienceId);
    const hasInput = state.inputValueByExperience.has(experienceId);

    if (!hasMessages && !hasTyping && !hasInput) {
      return state;
    }

    const nextExperienceChats = new Map(state.experienceChats);
    nextExperienceChats.delete(experienceId);

    const nextTypingByExperience = new Map(state.typingByExperience);
    nextTypingByExperience.delete(experienceId);

    const nextInputValueByExperience = new Map(state.inputValueByExperience);
    nextInputValueByExperience.delete(experienceId);

    return {
      ...state,
      experienceChats: nextExperienceChats,
      typingByExperience: nextTypingByExperience,
      inputValueByExperience: nextInputValueByExperience,
    };
  });
};

export const resetAllExperienceChats = (): void => {
  setState({
    experienceChats: new Map(),
    typingByExperience: new Map(),
    inputValueByExperience: new Map(),
    isAnyProcessing: false,
    processingExperienceId: null,
  });
};

export const getIsAnyExperienceChatProcessing = (): boolean => experienceChatState.isAnyProcessing;

export const getProcessingExperienceId = (): string | null =>
  experienceChatState.processingExperienceId;

export const setExperienceChatProcessing = (
  experienceId: string | null,
  isProcessing: boolean,
): void => {
  setState((state) => {
    const nextProcessingId = isProcessing ? experienceId : null;

    if (
      state.isAnyProcessing === isProcessing &&
      state.processingExperienceId === nextProcessingId
    ) {
      return state;
    }

    return {
      ...state,
      isAnyProcessing: isProcessing,
      processingExperienceId: nextProcessingId,
    };
  });
};

export const subscribeToExperienceChatState = (
  listener: ExperienceChatStateListener,
): (() => void) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};
