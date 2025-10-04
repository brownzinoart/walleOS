import { suggestionChips, mockResponses } from '@/config/content';
import type { ChatMessage, ChatState } from '@/types';

export type ChatStateListener = (state: ChatState, previousState: ChatState) => void;

let chatState: ChatState = {
  messages: [],
  isTyping: false,
  inputValue: '',
};

const listeners = new Set<ChatStateListener>();

const notifyListeners = (previousState: ChatState) => {
  listeners.forEach((listener) => {
    listener(chatState, previousState);
  });
};

const setState = (updater: ChatState | ((state: ChatState) => ChatState)): ChatState => {
  const previousState = chatState;
  const nextState =
    typeof updater === 'function' ? (updater as (state: ChatState) => ChatState)(chatState) : updater;

  if (nextState === previousState) {
    return chatState;
  }

  chatState = nextState;
  notifyListeners(previousState);

  return chatState;
};

const generateMessageId = () => `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const normalize = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const generateMockResponse = (userMessage: string, chipId?: string): string => {
  if (chipId && mockResponses[chipId]) {
    return mockResponses[chipId];
  }

  const normalizedMessage = normalize(userMessage);

  const chipMatch = suggestionChips.find((chip) => {
    const textMatch = normalizedMessage.includes(normalize(chip.text));
    const idMatch = normalizedMessage.includes(normalize(chip.id.replace(/-/g, ' ')));
    const categoryMatch = normalizedMessage.includes(normalize(chip.category));
    return textMatch || idMatch || categoryMatch;
  });

  if (chipMatch && mockResponses[chipMatch.id]) {
    return mockResponses[chipMatch.id];
  }

  const keywordMatch = Object.keys(mockResponses).find((key) => {
    if (key === 'default') {
      return false;
    }

    return normalizedMessage.includes(normalize(key.replace(/-/g, ' ')));
  });

  if (keywordMatch) {
    return mockResponses[keywordMatch];
  }

  return mockResponses.default ?? 'Appreciate the question—give me a second to sketch a thoughtful answer.';
};

export const createMessage = (role: ChatMessage['role'], content: string): ChatMessage => ({
  id: generateMessageId(),
  role,
  content,
  timestamp: new Date(),
});

export const addChatMessage = (
  role: ChatMessage['role'],
  content: string,
): ChatMessage | null => {
  const trimmed = content.trim();

  if (!trimmed) {
    return null;
  }

  const message = createMessage(role, trimmed);

  setState((state) => ({
    ...state,
    messages: [...state.messages, message],
  }));

  return message;
};

export const setChatTyping = (isTyping: boolean): void => {
  setState((state) => {
    if (state.isTyping === isTyping) {
      return state;
    }

    return {
      ...state,
      isTyping,
    };
  });
};

export const setChatInputValueState = (inputValue: string): void => {
  setState((state) => {
    if (state.inputValue === inputValue) {
      return state;
    }

    return {
      ...state,
      inputValue,
    };
  });
};

export const resetChatState = (): void => {
  setState({
    messages: [],
    isTyping: false,
    inputValue: '',
  });
};

export const getChatState = (): ChatState => chatState;

export const subscribeToChatState = (listener: ChatStateListener): (() => void) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};
