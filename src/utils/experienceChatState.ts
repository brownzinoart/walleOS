import type { ChatMessage } from '@/types';

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

  const message = createExperienceMessage(role, trimmed, meta);

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
