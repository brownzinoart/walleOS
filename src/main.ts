import '@/styles/main.css';
import '@/styles/games.css';
import { renderLayout, initLayout } from '@/components/Layout';
import { setActiveNavItem } from '@/components/Sidebar';
import { renderWelcomeCard } from '@/components/WelcomeCard';
import {
  renderChatInput,
  attachChatInputListeners,
  setChatInputValue,
  setButtonLoading,
} from '@/components/ChatInput';
import {
  renderChatContainer,
  scrollToBottom,
  CHAT_CONTAINER_SELECTOR,
  MESSAGE_LIST_SELECTOR,
  computeChatContainerView,
} from '@/components/ChatContainer';
import {
  renderSuggestionChips,
  attachSuggestionChipListeners,
  disableSuggestionChip,
} from '@/components/SuggestionChips';
import { renderProjectCards, attachProjectCardListeners } from '@/components/ProjectCard';
import { clearExperienceSelection } from '@/components/Resume';
import content, {
  experienceSuggestionChips,
  featuredProjects,
  getExperienceSuggestionChips,
  suggestionChips,
  validateContent,
} from '@/config/content';
import {
  streamChatResponse,
  ApiAbortError,
  /* checkHealth,*/
  type ChatRequest,
  type ChatStreamEvent,
} from '@/services/api';
import { getAppSettings } from '@/config/settings';
import type { ChatState } from '@/types';
import {
  debounce,
  rafThrottle,
  prefersReducedMotion,
  measurePerformance,
  measurePerformanceWithMonitoring,
} from '@/utils/performance';
import { logger, errorBoundary } from '@/utils/logger';
import {
  addChatMessage,
  generateMockResponse,
  getChatState,
  setChatInputValueState,
  setChatTyping,
  subscribeToChatState,
  addAssistantPlaceholder,
  appendToMessage,
  startMessageAnimation,
  consumeInitialEnterFlags,
} from '@/utils/chatState';
import {
  clearExperienceContext,
  getExperienceContext,
  hasActiveContext,
  subscribeToExperienceContext,
} from '@/utils/experienceContext';
import {
  attachExperienceContextIndicatorListeners,
  renderExperienceContextIndicator,
} from '@/components/ExperienceContextIndicator';
import { initRouter, getCurrentRoute } from '@/utils/router';
import type { RouteComponentId } from '@/utils/router';
import { initTheme, subscribeToTheme, getTheme } from '@/utils/theme';
import { getSelectedSuggestionChips } from '@/utils/suggestionChipSelector';
import { loadRouteModule, hasLazyRoute } from '@/routes/registry';
import type { RouteModule } from '@/routes/types';
import {
  MAIN_CONTENT_BASE_CLASSES,
  MAIN_CONTENT_DEFAULT_PADDING,
  MAIN_CONTENT_PLAYGROUND_PADDING,
  getMainContentPaddingClass,
} from '@/components/layoutConfig';
import { setCaseStudyReferrerRoute } from '@/components/ProjectCaseStudyPage';
import { setReferrerRoute as setClockItReferrerRoute } from '@/components/ProjectClockItPage';
import type { CaseStudyId } from '@/config/caseStudies';

const CHAT_ROOT_SELECTOR = '[data-chat-root]';
const WELCOME_SLOT_SELECTOR = '[data-chat-welcome]';
const SUGGESTION_SLOT_SELECTOR = '[data-chat-suggestions]';
const CHAT_INPUT_SELECTOR = '[data-chat-input]';
const CHAT_CONTEXT_INDICATOR_SELECTOR = '[data-chat-context-indicator]';
const RESUME_CONTEXT_INDICATOR_SELECTOR = '[data-resume-context-indicator]';
const RESUME_CONTEXT_SUGGESTIONS_SELECTOR = '[data-resume-context-suggestions]';
const MAIN_CONTENT_SELECTOR = '[data-main-content]';
const CHAT_NEW_MESSAGE_INDICATOR_SELECTOR = '[data-chat-new-messages]';
const CASE_STUDY_ROUTE_MAP: Partial<Record<RouteComponentId, CaseStudyId>> = {
  'project-weready': 'weready',
  'project-listingpal': 'listingpal',
  'project-echo': 'echo',
  'project-briefflow': 'briefflow',
};

let pendingSuggestion: { id: string; text: string } | null = null;
let currentActiveNavItem: RouteComponentId =
  typeof window !== 'undefined' ? getCurrentRoute() : 'home';
let activeRouteModule: RouteModule | null = null;
let mainContentRoot: HTMLElement | null = null;
let navigationSequence = 0;
let initialHomeAnimationsApplied = false;
const reducedMotion = prefersReducedMotion();
const { clearExperienceContextOnRouteChange } = getAppSettings();

type ActiveChatRequest = {
  controller: AbortController;
  stream: AsyncGenerator<ChatStreamEvent>;
};

const CHAT_SCROLL_LOCK_THRESHOLD = 120;

let activeChatRequest: ActiveChatRequest | null = null;
let chatAutoScrollEnabled = true;
let chatScrollContainer: HTMLElement | null = null;
let chatScrollHandlerAttached = false;
let chatNewMessageIndicator: HTMLButtonElement | null = null;

const calculateDistanceFromBottom = (container: HTMLElement): number => {
  return container.scrollHeight - (container.scrollTop + container.clientHeight);
};

const isNearBottom = (container: HTMLElement): boolean => {
  return calculateDistanceFromBottom(container) <= CHAT_SCROLL_LOCK_THRESHOLD;
};

const handleChatScroll = () => {
  if (!chatScrollContainer) {
    return;
  }
  chatAutoScrollEnabled = isNearBottom(chatScrollContainer);
  if (chatAutoScrollEnabled) {
    hideNewMessageIndicator();
  }
};

const ensureChatScrollObserver = (container: HTMLElement): void => {
  if (chatScrollContainer !== container) {
    if (chatScrollContainer && chatScrollHandlerAttached) {
      chatScrollContainer.removeEventListener('scroll', handleChatScroll);
      chatScrollHandlerAttached = false;
    }
    chatScrollContainer = container;
  }

  if (!chatScrollHandlerAttached && chatScrollContainer) {
    chatScrollContainer.addEventListener('scroll', handleChatScroll, { passive: true });
    chatScrollHandlerAttached = true;
  }

  if (chatScrollContainer) {
    chatAutoScrollEnabled = isNearBottom(chatScrollContainer);
    if (chatAutoScrollEnabled) {
      hideNewMessageIndicator();
    }
  }
};

const hideNewMessageIndicator = (): void => {
  if (!chatNewMessageIndicator) {
    return;
  }

  chatNewMessageIndicator.classList.add('hidden');
  chatNewMessageIndicator.setAttribute('aria-hidden', 'true');
};

const ensureNewMessageIndicator = (root: HTMLElement): HTMLButtonElement => {
  if (chatNewMessageIndicator && root.contains(chatNewMessageIndicator)) {
    return chatNewMessageIndicator;
  }

  const existing = root.querySelector<HTMLButtonElement>(CHAT_NEW_MESSAGE_INDICATOR_SELECTOR);
  if (existing) {
    chatNewMessageIndicator = existing;
    return existing;
  }

  const indicator = document.createElement('button');
  indicator.type = 'button';
  indicator.className = 'chat-new-messages hidden self-center sticky bottom-6 mt-4 px-4 py-2 bg-surface-card border-2 border-neon-cyan rounded-full text-sm font-semibold shadow-brutal focus-ring-theme';
  indicator.setAttribute('data-chat-new-messages', 'true');
  indicator.setAttribute('aria-hidden', 'true');
  indicator.textContent = 'New response';
  indicator.dataset['handlerAttached'] = 'true';
  indicator.addEventListener('click', () => {
    chatAutoScrollEnabled = true;
    hideNewMessageIndicator();
    requestAnimationFrame(() => {
      scrollToBottom(reducedMotion ? 'auto' : 'smooth');
    });
  });

  root.appendChild(indicator);
  chatNewMessageIndicator = indicator;
  return indicator;
};

const showNewMessageIndicator = (root: HTMLElement): void => {
  const indicator = ensureNewMessageIndicator(root);
  indicator.classList.remove('hidden');
  indicator.setAttribute('aria-hidden', 'false');
  indicator.setAttribute('aria-live', 'polite');
};

const ensureMainContentRoot = (): HTMLElement | null => {
  if (!mainContentRoot) {
    mainContentRoot = document.querySelector<HTMLElement>(MAIN_CONTENT_SELECTOR);
  }

  return mainContentRoot;
};

const applyMainContentPadding = (route: RouteComponentId) => {
  const root = ensureMainContentRoot();
  if (!root) {
    return;
  }

  const baseClasses = MAIN_CONTENT_BASE_CLASSES.split(' ').filter(Boolean);
  baseClasses.forEach((cls) => root.classList.add(cls));

  const removableClasses = [
    MAIN_CONTENT_DEFAULT_PADDING,
    MAIN_CONTENT_PLAYGROUND_PADDING,
  ];

  removableClasses.forEach((group) => {
    group.split(' ').forEach((cls) => {
      if (cls) {
        root.classList.remove(cls);
      }
    });
  });

  const paddingClass = getMainContentPaddingClass(route);
  paddingClass.split(' ').forEach((cls) => {
    if (cls) {
      root.classList.add(cls);
    }
  });
};

const setMainContentMarkup = (markup: string) => {
  const root = ensureMainContentRoot();
  if (!root) {
    return;
  }

  root.innerHTML = markup;
};

// streaming: attempt directly; fallback on error

const getActiveExperienceState = () => (hasActiveContext() ? getExperienceContext() : null);

const resolveSuggestionChips = () => {
  const experienceState = getActiveExperienceState();

  if (experienceState?.experience) {
    const contextualChips = getExperienceSuggestionChips(experienceState.experience);

    if (contextualChips.length > 0) {
      return contextualChips;
    }

    return experienceSuggestionChips;
  }

  return getSelectedSuggestionChips(suggestionChips, 4);
};

const updateExperienceContextIndicators = () => {
  const contextState = getActiveExperienceState();
  const indicatorMarkup = renderExperienceContextIndicator(contextState?.experience ?? null);

  const chatIndicatorSlot = document.querySelector<HTMLElement>(CHAT_CONTEXT_INDICATOR_SELECTOR);
  const resumeIndicatorSlot = document.querySelector<HTMLElement>(RESUME_CONTEXT_INDICATOR_SELECTOR);

  if (chatIndicatorSlot) {
    chatIndicatorSlot.innerHTML = indicatorMarkup;
  }

  if (resumeIndicatorSlot) {
    resumeIndicatorSlot.innerHTML = indicatorMarkup;
  }

  if (indicatorMarkup) {
    attachExperienceContextIndicatorListeners();
  }
};

const updateContextualSuggestionChips = () => {
  const experienceState = getActiveExperienceState();
  const activeChips = resolveSuggestionChips();
  const chatState = getChatState();

  const chatSuggestionSlot = document.querySelector<HTMLElement>(SUGGESTION_SLOT_SELECTOR);

  if (chatSuggestionSlot && chatState.messages.length === 0) {
    chatSuggestionSlot.innerHTML = renderSuggestionChips(activeChips);
    attachSuggestionChipListeners(handleSuggestionChipClick);
  }

  const resumeSuggestionSlot = document.querySelector<HTMLElement>(RESUME_CONTEXT_SUGGESTIONS_SELECTOR);

  if (resumeSuggestionSlot) {
    if (experienceState?.experience) {
      resumeSuggestionSlot.innerHTML = renderSuggestionChips(
        getExperienceSuggestionChips(experienceState.experience),
      );
      attachSuggestionChipListeners(handleSuggestionChipClick);
    } else {
      resumeSuggestionSlot.innerHTML = '';
    }
  }
};

const refreshExperienceContextUI = () => {
  updateExperienceContextIndicators();
  updateContextualSuggestionChips();
};

const showAppLoader = (): HTMLElement | null => {
  if (typeof document === 'undefined') {
    return null;
  }

  const loader = document.createElement('div');
  loader.className = 'app-loader';
  loader.setAttribute('role', 'status');
  loader.setAttribute('aria-live', 'polite');
  loader.dataset['appLoader'] = 'true';
  loader.innerHTML = `
    <span class="app-loader__spinner" aria-hidden="true"></span>
    <span class="app-loader__label">Warming up WalleOS&#8230;</span>
  `;

  document.body.appendChild(loader);
  return loader;
};

const hideAppLoader = (loader: HTMLElement | null) => {
  if (!loader) {
    return;
  }

  loader.classList.add('is-hidden');
  window.setTimeout(() => {
    loader.remove();
  }, 220);
};

const applyInitialAnimations = () => {
  if (reducedMotion) {
    return;
  }

  requestAnimationFrame(() => {
    const welcomeCard = document.querySelector<HTMLElement>('.welcome-card');
    const chatShell = document.querySelector<HTMLElement>('.chat-input-container > div');

    welcomeCard?.classList.add('welcome-card-enter');
    chatShell?.classList.add('chat-input-entrance');
  });
};

const renderTypingIndicator = (): string => `
  <article
    class="chat-message chat-message-assistant mr-auto bg-surface-secondary text-primary border-2 border-neon-magenta rounded-lg rounded-bl-sm max-w-[80%] md:max-w-[70%] p-4"
    data-animation-state="buffering"
    data-typing-indicator
    aria-live="polite"
  >
    <div class="flex items-center gap-2 text-sm font-semibold">
      <span class="typing-dot"></span>
      <span class="typing-dot typing-dot-delay"></span>
      <span class="typing-dot typing-dot-delay-xl"></span>
      <span class="ml-3 uppercase tracking-widest text-xs text-secondary">thinking...</span>
    </div>
  </article>
`;
const renderHomeView = (): string => {
  const projectCardsMarkup = featuredProjects.length > 0 ? renderProjectCards(featuredProjects) : '';
  const state = getChatState();
  const hasMessages = state.messages.length > 0;
  const contextState = getActiveExperienceState();
  const indicatorMarkup = renderExperienceContextIndicator(contextState?.experience ?? null);
  const welcomeMarkup = hasMessages ? '' : renderWelcomeCard();
  const suggestionsMarkup = hasMessages ? '' : renderSuggestionChips(resolveSuggestionChips());
  const typingMarkup = state.isTyping ? renderTypingIndicator() : '';
  const welcomeSection = welcomeMarkup.trim().length > 0
    ? `
      <header class="chat-intro flex flex-col gap-4" data-chat-welcome>
        ${welcomeMarkup}
      </header>
    `
    : '';
  const suggestionsSection = suggestionsMarkup.trim().length > 0
    ? `
      <div class="chat-suggestions" data-chat-suggestions>
        ${suggestionsMarkup}
      </div>
    `
    : '';

  return `
    <section
      class="chat-root content-container flex flex-1 flex-col gap-5"
      data-chat-root
    >
      <div class="chat-context-indicator" data-chat-context-indicator>
        ${indicatorMarkup}
      </div>
      ${welcomeSection}
      ${renderChatInput()}
      ${suggestionsSection}
      ${renderChatContainer(state.messages, {
        showEmptyState: false,
        emptyStateContent: '',
        appendContent: typingMarkup,
      })}
    </section>
    ${projectCardsMarkup}
  `;
};

const initHomeRoute = () => {
  attachChatInputListeners(handleUserMessage);
  observeChatInput();
  attachSuggestionChipListeners(handleSuggestionChipClick);
  attachProjectCardListeners();
};

const cleanupHomeRoute = () => {
  pendingSuggestion = null;
};

const HOME_ROUTE_MODULE: RouteModule = {
  render: () => renderHomeView(),
  init: () => {
    initHomeRoute();
    if (!initialHomeAnimationsApplied) {
      applyInitialAnimations();
      initialHomeAnimationsApplied = true;
    }
  },
  cleanup: () => {
    cleanupHomeRoute();
  },
};

const getRouteModule = async (route: RouteComponentId): Promise<RouteModule> => {
  if (route === 'home') {
    return HOME_ROUTE_MODULE;
  }

  if (!hasLazyRoute(route)) {
    return HOME_ROUTE_MODULE;
  }

  try {
    const module = await loadRouteModule(route);
    if (module) {
      return module;
    }
  } catch (error) {
    logger.error('Failed to load route module', error as Error, {
      component: 'main',
      action: 'loadRouteModule',
      metadata: { route },
    });
  }

  return HOME_ROUTE_MODULE;
};

const renderRouteContent = async (
  route: RouteComponentId,
  previousRoute: RouteComponentId | null,
) => {
  navigationSequence += 1;
  const sequenceId = navigationSequence;

  if (activeRouteModule?.cleanup) {
    try {
      activeRouteModule.cleanup();
    } catch (error) {
      logger.error('Route cleanup failed', error as Error, {
        component: 'main',
        action: 'cleanupRoute',
        metadata: { route: previousRoute },
      });
    }
  }

  applyMainContentPadding(route);

  const module = await getRouteModule(route);

  if (sequenceId !== navigationSequence) {
    return;
  }

  activeRouteModule = module;

  measurePerformance(`route-render:${route}`, () => {
    setMainContentMarkup(module.render());
  });

  module.init?.();
  refreshExperienceContextUI();
  logger.info('Route render complete', {
    component: 'main',
    action: 'renderRoute',
    metadata: { route, from: previousRoute },
  });
};

const COMPLETION_TIMEOUT_MIN_MS = 10000;
const COMPLETION_TIMEOUT_MAX_MS = 18000;
const COMPLETION_TIMEOUT_PER_CHAR_MS = 20;

const computeMessageCompletionTimeout = (messageId: string): number => {
  const state = getChatState();
  const message = state.messages.find((m) => m.id === messageId);
  const contentLength = message
    ? (message.bufferedContent?.length ?? message.content.length ?? 0)
    : 0;

  const estimated = COMPLETION_TIMEOUT_MIN_MS + contentLength * COMPLETION_TIMEOUT_PER_CHAR_MS;

  return Math.min(COMPLETION_TIMEOUT_MAX_MS, Math.max(COMPLETION_TIMEOUT_MIN_MS, estimated));
};

const waitForMessageCompletion = (messageId: string): Promise<void> => {
  return new Promise((resolve) => {
    const state = getChatState();
    const existing = state.messages.find((m) => m.id === messageId);
    if (existing && existing.animationState === 'complete') {
      resolve();
      return;
    }

    let resolved = false;
    let timeoutId: number | null = null;
    let unsubscribe: (() => void) | null = null;

    const cleanup = () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
    };

    const finalize = () => {
      if (resolved) {
        return;
      }
      resolved = true;
      cleanup();
      resolve();
    };

    const timeout = computeMessageCompletionTimeout(messageId);
    timeoutId = window.setTimeout(() => {
      finalize();
    }, timeout);

    unsubscribe = subscribeToChatState((next) => {
      if (resolved) {
        return;
      }
      const found = next.messages.find((m) => m.id === messageId);
      if (found && found.animationState === 'complete') {
        finalize();
      }
    });
  });
};

const handleUserMessage = async (message: string) => {
  const trimmed = message.trim();

  if (!trimmed) {
    return;
  }

  const matchedSuggestion =
    pendingSuggestion && pendingSuggestion.text === trimmed ? pendingSuggestion : null;

  const activeExperience = getActiveExperienceState();
  const selectedExperience = activeExperience?.experience ?? null;
  const experienceContextPayload = selectedExperience
    ? {
        experienceId: selectedExperience.id,
        experience: selectedExperience,
      }
    : null;
  const experienceContextMeta = selectedExperience
    ? {
        experienceContext: {
          experienceId: selectedExperience.id,
          experienceTitle: `${selectedExperience.title} @ ${selectedExperience.company}`.trim(),
        },
      }
    : undefined;

  pendingSuggestion = null;
  setChatInputValueState('');

  const messageAdded = addChatMessage('user', trimmed, experienceContextMeta);

  if (!messageAdded) {
    return;
  }

  if (matchedSuggestion) {
    disableSuggestionChip(matchedSuggestion.id);
  }

  setChatTyping(true);
  setButtonLoading(true);

  if (activeChatRequest) {
    activeChatRequest.controller.abort();
    void activeChatRequest.stream.return?.(undefined);
    activeChatRequest = null;
  }

  // Build streaming request
  const chatRequest: ChatRequest = {
    message: trimmed,
    ...(selectedExperience && {
      experienceContext: {
        experienceId: selectedExperience.id,
        experienceTitle: `${selectedExperience.title} @ ${selectedExperience.company}`.trim(),
      },
    }),
    ...(matchedSuggestion?.id && { chipId: matchedSuggestion.id }),
  } as ChatRequest;

  const placeholder = addAssistantPlaceholder(
    selectedExperience
      ? {
          experienceContext: {
            experienceId: selectedExperience.id,
            experienceTitle: `${selectedExperience.title} @ ${selectedExperience.company}`.trim(),
          },
        }
      : undefined,
  );

  let abortController: AbortController | null = null;
  let currentStream: AsyncGenerator<ChatStreamEvent> | null = null;

  try {
    abortController = new AbortController();
    const stream = streamChatResponse(chatRequest, { signal: abortController.signal });
    currentStream = stream;
    activeChatRequest = {
      controller: abortController,
      stream,
    };

    for await (const event of stream) {
      if (event.token) {
        appendToMessage(placeholder.id, event.token);
      }
      if (event.done) break;
    }
    startMessageAnimation(placeholder.id);
    await waitForMessageCompletion(placeholder.id);
  } catch (error) {
    if (error instanceof ApiAbortError && abortController?.signal.aborted) {
      // Silent abort (likely due to navigation or explicit cancellation)
    } else {
      console.error('Failed to stream chat response', error);
      // Fallback to mock on error
      const response = generateMockResponse(trimmed, matchedSuggestion?.id, experienceContextPayload);
      appendToMessage(placeholder.id, response);
    }
  } finally {
    setChatTyping(false);
    setButtonLoading(false);
    if (abortController && !abortController.signal.aborted) {
      abortController.abort();
    }
    if (activeChatRequest && currentStream && activeChatRequest.stream === currentStream) {
      activeChatRequest = null;
    }
  }
};

const handleSuggestionChipClick = (chipText: string) => {
  const chip = resolveSuggestionChips().find((item) => item.text === chipText) ?? null;
  pendingSuggestion = chip ? { id: chip.id, text: chip.text } : null;

  setChatInputValue(chipText);
  setChatInputValueState(chipText);
};

const observeChatInput = () => {
  const textarea = document.querySelector<HTMLTextAreaElement>(CHAT_INPUT_SELECTOR);

  if (!textarea) {
    return;
  }

  textarea.addEventListener('input', () => {
    setChatInputValueState(textarea.value);

    if (pendingSuggestion && textarea.value.trim() !== pendingSuggestion.text.trim()) {
      pendingSuggestion = null;
    }
  });
};

const renderChatView = (state: ChatState) => {
  const chatRoot = document.querySelector<HTMLElement>(CHAT_ROOT_SELECTOR);

  if (!chatRoot) {
    return;
  }

  const hasMessages = state.messages.length > 0;
  let welcomeSlot = chatRoot.querySelector<HTMLElement>(WELCOME_SLOT_SELECTOR);
  let suggestionSlot = chatRoot.querySelector<HTMLElement>(SUGGESTION_SLOT_SELECTOR);
  const contextIndicatorSlot = chatRoot.querySelector<HTMLElement>(CHAT_CONTEXT_INDICATOR_SELECTOR);

  if (contextIndicatorSlot) {
    contextIndicatorSlot.innerHTML = renderExperienceContextIndicator(getActiveExperienceState()?.experience ?? null);
    attachExperienceContextIndicatorListeners();
  }

  const welcomeMarkup = hasMessages ? '' : renderWelcomeCard();
  const hasWelcomeContent = welcomeMarkup.trim().length > 0;

  if (hasWelcomeContent) {
    if (!welcomeSlot) {
      const header = document.createElement('header');
      header.className = 'chat-intro flex flex-col gap-4';
      header.setAttribute('data-chat-welcome', '');

      if (contextIndicatorSlot) {
        contextIndicatorSlot.insertAdjacentElement('afterend', header);
      } else {
        chatRoot.insertAdjacentElement('afterbegin', header);
      }

      welcomeSlot = header;
    }

    welcomeSlot.innerHTML = welcomeMarkup;
  } else if (welcomeSlot) {
    welcomeSlot.remove();
    welcomeSlot = null;
  }

  const suggestionsMarkup = hasMessages ? '' : renderSuggestionChips(resolveSuggestionChips());
  const hasSuggestionContent = suggestionsMarkup.trim().length > 0;

  if (hasSuggestionContent) {
    if (!suggestionSlot) {
      const suggestionsContainer = document.createElement('div');
      suggestionsContainer.className = 'chat-suggestions';
      suggestionsContainer.setAttribute('data-chat-suggestions', '');

      // Insert after chat input (which should come after welcome)
      const chatInput = chatRoot.querySelector('[data-chat-input-container]');
      if (chatInput) {
        chatInput.insertAdjacentElement('afterend', suggestionsContainer);
      } else {
        const insertionTarget = welcomeSlot ?? contextIndicatorSlot;
        if (insertionTarget) {
          insertionTarget.insertAdjacentElement('afterend', suggestionsContainer);
        } else {
          chatRoot.insertAdjacentElement('afterbegin', suggestionsContainer);
        }
      }

      suggestionSlot = suggestionsContainer;
    }

    suggestionSlot.innerHTML = suggestionsMarkup;
    attachSuggestionChipListeners(handleSuggestionChipClick);
  } else if (suggestionSlot) {
    suggestionSlot.remove();
    suggestionSlot = null;
  }

  const chatContainer = chatRoot.querySelector<HTMLElement>(CHAT_CONTAINER_SELECTOR);
  const shouldMaintainAutoScroll = chatAutoScrollEnabled && (!chatContainer || isNearBottom(chatContainer));
  const containerOptions = {
    showEmptyState: false,
    emptyStateContent: '',
    appendContent: state.isTyping ? renderTypingIndicator() : '',
  } as const;

  if (!chatContainer) {
    chatRoot.insertAdjacentHTML('beforeend', renderChatContainer(state.messages, containerOptions));
    const insertedContainer = chatRoot.querySelector<HTMLElement>(CHAT_CONTAINER_SELECTOR);
    if (insertedContainer) {
      ensureChatScrollObserver(insertedContainer);
    }
  } else {
    const view = computeChatContainerView(state.messages, containerOptions);
    chatContainer.setAttribute('aria-live', view.ariaLive);
    const messageList = chatContainer.querySelector<HTMLElement>(MESSAGE_LIST_SELECTOR);
    if (messageList) {
      messageList.innerHTML = view.combinedMarkup;
    }
    ensureChatScrollObserver(chatContainer);
  }

  const updatedContainer = chatRoot.querySelector<HTMLElement>(CHAT_CONTAINER_SELECTOR);
  if (updatedContainer) {
    if (shouldMaintainAutoScroll) {
      chatAutoScrollEnabled = true;
    } else {
      chatAutoScrollEnabled = isNearBottom(updatedContainer);
    }
  }

  if (updatedContainer && state.messages.length > 0) {
    if (!chatAutoScrollEnabled) {
      showNewMessageIndicator(chatRoot);
    } else {
      hideNewMessageIndicator();
    }
  } else {
    hideNewMessageIndicator();
  }

  // Remove one-shot initial-enter flags on next render
  consumeInitialEnterFlags();
};

const frameRender = rafThrottle((state: ChatState) => {
  measurePerformance('chat-render', () => {
    renderChatView(state);
  });
});

const scheduleChatRender = debounce((state: ChatState) => {
  frameRender(state);
}, 48);

const rerenderChat = (state: ChatState = getChatState()) => {
  scheduleChatRender(state);
};

const handleRouteChange = () => {
  const previousRoute = currentActiveNavItem;
  const nextRoute = getCurrentRoute();

  if (previousRoute === nextRoute) {
    return;
  }

  // Scroll to top when navigating to home route
  if (nextRoute === 'home') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  chatAutoScrollEnabled = true;
  hideNewMessageIndicator();
  chatNewMessageIndicator = null;
  if (chatScrollContainer && chatScrollHandlerAttached) {
    chatScrollContainer.removeEventListener('scroll', handleChatScroll);
    chatScrollHandlerAttached = false;
  }
  chatScrollContainer = null;

  currentActiveNavItem = nextRoute;
  setActiveNavItem(nextRoute, { silent: true });

  const caseStudyId = CASE_STUDY_ROUTE_MAP[nextRoute];
  if (caseStudyId && previousRoute) {
    setCaseStudyReferrerRoute(caseStudyId, previousRoute);
  }

  if (nextRoute === 'project-clockit') {
    setClockItReferrerRoute(previousRoute ?? null);
  }

  if (
    clearExperienceContextOnRouteChange &&
    previousRoute === 'resume' &&
    nextRoute !== 'resume'
  ) {
    clearExperienceContext();
    clearExperienceSelection();
  }

  void renderRouteContent(nextRoute, previousRoute);
};

const mount = async () => {
  const loader = showAppLoader();
  
  // Initialize theme before any rendering
  initTheme();

  // Register error recovery strategies
  errorBoundary.registerRecoveryStrategy('mount', () => {
    logger.info('Attempting to recover from mount error');
    window.location.reload();
  });

  errorBoundary.registerRecoveryStrategy('render', () => {
    logger.info('Attempting to recover from render error');
    const root = document.querySelector<HTMLDivElement>('#app');
    if (root) {
      root.innerHTML = renderLayout('');
      initLayout();
      mainContentRoot = root.querySelector<HTMLElement>(MAIN_CONTENT_SELECTOR);
      applyMainContentPadding(currentActiveNavItem);
      void renderRouteContent(currentActiveNavItem, null);
    }
  });

  try {
    await errorBoundary.executeWithErrorBoundary(async () => {
      const root = document.querySelector<HTMLDivElement>('#app');

      if (!root) {
        throw new Error('Root element #app not found.');
      }

      if (reducedMotion) {
        document.body.setAttribute('data-reduced-motion', 'true');
      }

      logger.info('Starting WalleOS initialization', {
        component: 'main',
        action: 'mount',
        metadata: { reducedMotion, userAgent: navigator.userAgent }
      });

      // Use enhanced performance monitoring
      await measurePerformanceWithMonitoring('app-render', () => {
        root.innerHTML = renderLayout('');
        initLayout();
      });

      mainContentRoot = root.querySelector<HTMLElement>(MAIN_CONTENT_SELECTOR);
      setActiveNavItem(currentActiveNavItem, { silent: true });
      applyMainContentPadding(currentActiveNavItem);
      await renderRouteContent(currentActiveNavItem, null);

      initRouter();
    }, {
      component: 'main',
      action: 'mount'
    });

    const docWithFonts = document as Document & { fonts?: FontFaceSet };
    const fontsReady = docWithFonts.fonts?.ready ?? Promise.resolve();
    fontsReady.finally(() => hideAppLoader(loader));

    logger.info('WalleOS initialization completed successfully');

  } catch (error) {
    hideAppLoader(loader);

    const fallback = document.createElement('div');
    fallback.className = 'app-error';
    fallback.innerHTML = `
      <h2>Initialization Error</h2>
      <p>We hit a snag while loading the experience. Please refresh and try again.</p>
      <button onclick="window.location.reload()" class="btn-retry">
        Retry
      </button>
    `;

    document.body.appendChild(fallback);

    logger.fatal('Failed to initialise WalleOS', error as Error, {
      component: 'main',
      action: 'mount'
    });
  }
};

subscribeToChatState((state, previousState) => {
  const messagesChanged =
    state.messages.length !== previousState.messages.length ||
    state.messages !== previousState.messages;
  const typingChanged = state.isTyping !== previousState.isTyping;

  if (messagesChanged || typingChanged) {
    rerenderChat(state);
    if (chatAutoScrollEnabled) {
      scrollToBottom(reducedMotion ? 'auto' : 'smooth');
      chatAutoScrollEnabled = true;
      hideNewMessageIndicator();
    }
  }
});

subscribeToExperienceContext((context, previousContext) => {
  refreshExperienceContextUI();

  if (!context.experience && previousContext.experience) {
    clearExperienceSelection();
  }
});

// Subscribe to theme changes and update DOM
subscribeToTheme((theme) => {
  document.documentElement.dataset['theme'] = theme;
});

// Initialize theme attribute on mount
if (typeof document !== 'undefined') {
  document.documentElement.dataset['theme'] = getTheme();
}

// Listen for route changes before mount so direct hash loads are handled
document.addEventListener('route:change', handleRouteChange);

validateContent();
mount();

document.addEventListener('visibilitychange', () => {
  if (!document.hidden && chatAutoScrollEnabled) {
    scrollToBottom(reducedMotion ? 'auto' : 'smooth');
  }
});

document.addEventListener('sidebar:navigate', (event) => {
  const customEvent = event as CustomEvent<{ id: string }>;
  const navId = customEvent.detail?.id as RouteComponentId | undefined;

  if (!navId) {
    return;
  }

  if (navId === 'home' || navId === 'projects' || navId === 'resume' || navId === 'playground') {
    setActiveNavItem(navId, { silent: true });
  }
});

console.info('WallyGPT content configuration loaded:', content);
