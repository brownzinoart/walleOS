import { suggestionChips, mockResponses } from '@/config/content';
import type { ChatMessage, ChatState, Experience } from '@/types';

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

type ChatMessageMeta = Pick<ChatMessage, 'experienceContext'>;

const normalize = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const joinWithAnd = (items: string[] = []): string => {
  if (items.length === 0) {
    return '';
  }

  if (items.length === 1) {
    return items[0] ?? '';
  }

  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }

  const lastItem = items[items.length - 1];
  return `${items.slice(0, -1).join(', ')}, and ${lastItem}`;
};

const fillTemplate = (template: string, data: Record<string, string>): string =>
  template.replace(/\{(.*?)\}/g, (_, key: string) => {
    const replacement = data[key];
    return replacement !== undefined ? replacement : '';
  });

const pickAchievement = (experience: Experience): string => experience.achievements[0] ?? experience.description;

const pickImpact = (experience: Experience): string => {
  if (experience.achievements.length > 1) {
    return experience.achievements[experience.achievements.length - 1] ?? experience.description;
  }

  return experience.description;
};

const pickChallenge = (experience: Experience): string => {
  const explicitChallenge = experience.achievements.find((item) =>
    /(challenge|difficulty|obstacle|problem)/i.test(item),
  );

  return explicitChallenge ?? experience.description;
};

const EXPERIENCE_RESPONSE_KEYS = new Set([
  'experience-achievements',
  'experience-technologies',
  'experience-skills',
  'experience-challenges',
  'experience-impact',
  'experience-transition',
  'experience-default',
]);

const experienceKeywordMatchers: Array<{ key: string; pattern: RegExp }> = [
  { key: 'experience-achievements', pattern: /(achiev|accomplish|deliver|milestone)/i },
  { key: 'experience-skills', pattern: /(skill|learn|develop|grow)/i },
  { key: 'experience-technologies', pattern: /(tech|tool|stack|technology|platform)/i },
  { key: 'experience-challenges', pattern: /(challenge|obstacle|hurdle|difficult)/i },
  { key: 'experience-impact', pattern: /(impact|result|outcome|difference)/i },
  { key: 'experience-transition', pattern: /(why|reason|leave|move)/i },
];

const buildExperienceTemplateData = (experience: Experience): Record<string, string> => {
  const skillsList = joinWithAnd(experience.skills);
  const technologiesList = joinWithAnd(experience.technologies ?? []);

  return {
    company: experience.company,
    title: experience.title,
    period: experience.period,
    achievement: pickAchievement(experience),
    skills: skillsList || 'a blend of strategic and hands-on capabilities',
    skill: experience.skills[0] ?? 'strategic problem solving',
    technologies: technologiesList || 'a mix of trusted tools tuned to the project needs',
    challenge: pickChallenge(experience),
    impact: pickImpact(experience),
  };
};

const generateExperienceOverview = (experience: Experience): string => {
  const highlights = experience.achievements.slice(0, 2);
  const highlightSummary = highlights.length > 0 ? ` Highlights included ${joinWithAnd(highlights)}.` : '';
  const skillsSummary = joinWithAnd(experience.skills.slice(0, 3)) || 'strategy and execution';

  return `During my time as ${experience.title} at ${experience.company} (${experience.period}), I balanced ${skillsSummary} with hands-on experimentation.${highlightSummary}`.trim();
};

const generateExperienceContextResponse = (
  userMessage: string,
  chipId: string | undefined,
  experience: Experience,
): string | null => {
  const normalizedMessage = normalize(userMessage);
  const directKeywordMatch = experienceKeywordMatchers.find(({ pattern }) =>
    pattern.test(normalizedMessage),
  );

  const candidateKeyFromChip = chipId && EXPERIENCE_RESPONSE_KEYS.has(chipId) ? chipId : undefined;
  const selectedKey = candidateKeyFromChip ?? directKeywordMatch?.key ?? 'experience-default';

  const template = mockResponses[selectedKey] ?? mockResponses['experience-default'];

  if (!template) {
    return generateExperienceOverview(experience);
  }

  const data = buildExperienceTemplateData(experience);

  if (selectedKey === 'experience-technologies' && !experience.technologies?.length) {
    return generateExperienceOverview(experience);
  }

  if (
    selectedKey === 'experience-achievements' &&
    experience.achievements.length === 0 &&
    !/(achiev|accomplish)/.test(normalizedMessage)
  ) {
    return generateExperienceOverview(experience);
  }

  if (selectedKey === 'experience-transition' && !/(why|reason|leave|move)/i.test(userMessage)) {
    return generateExperienceOverview(experience);
  }

  const response = fillTemplate(template, data);

  if (response.trim().length === 0) {
    return generateExperienceOverview(experience);
  }

  return response;
};

export { generateExperienceOverview };

export const generateMockResponse = (
  userMessage: string,
  chipId?: string,
  experienceContext?: { experienceId: string; experience: Experience } | null,
): string => {
  if (experienceContext?.experience) {
    const contextAwareResponse = generateExperienceContextResponse(
      userMessage,
      chipId,
      experienceContext.experience,
    );

    if (contextAwareResponse) {
      return contextAwareResponse;
    }
  }

  if (chipId) {
    const chipResponse = mockResponses[chipId];
    if (chipResponse !== undefined) {
      return chipResponse;
    }
  }

  const normalizedMessage = normalize(userMessage);

  const chipMatch = suggestionChips.find((chip) => {
    const textMatch = normalizedMessage.includes(normalize(chip.text));
    const idMatch = normalizedMessage.includes(normalize(chip.id.replace(/-/g, ' ')));
    const categoryMatch = normalizedMessage.includes(normalize(chip.category));
    return textMatch || idMatch || categoryMatch;
  });

  if (chipMatch) {
    const matchedResponse = mockResponses[chipMatch.id];
    if (matchedResponse !== undefined) {
      return matchedResponse;
    }
  }

  const keywordMatch = Object.keys(mockResponses).find((key) => {
    if (key === 'default') {
      return false;
    }

    return normalizedMessage.includes(normalize(key.replace(/-/g, ' ')));
  });

  if (keywordMatch) {
    const response = mockResponses[keywordMatch];
    if (response !== undefined) {
      return response;
    }
  }

  return mockResponses['default'] ?? 'Appreciate the question—give me a second to sketch a thoughtful answer.';
};

export const createMessage = (
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

export const addChatMessage = (
  role: ChatMessage['role'],
  content: string,
  meta?: ChatMessageMeta,
): ChatMessage | null => {
  const trimmed = content.trim();

  if (!trimmed) {
    return null;
  }

  const message = createMessage(role, trimmed, meta);

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
