import '@/styles/main.css';
import { renderLayout, initLayout } from '@/components/Layout';
import { renderWelcomeCard } from '@/components/WelcomeCard';
import {
  renderChatInput,
  attachChatInputListeners,
  setChatInputValue,
} from '@/components/ChatInput';
import {
  renderChatContainer,
  scrollToBottom,
  CHAT_CONTAINER_SELECTOR,
} from '@/components/ChatContainer';
import {
  renderSuggestionChips,
  attachSuggestionChipListeners,
  disableSuggestionChip,
} from '@/components/SuggestionChips';
import { renderProjectCards, attachProjectCardListeners } from '@/components/ProjectCard';
import { renderResume, initResumeInteractions, clearExperienceSelection, cleanupResumeInteractions } from '@/components/Resume';
import content, {
  experienceSuggestionChips,
  featuredProjects,
  getExperienceSuggestionChips,
  suggestionChips,
  validateContent,
} from '@/config/content';
import { streamChatResponse, /* checkHealth,*/ type ChatRequest } from '@/services/api';
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
import {
  initRouter,
  getCurrentRoute,
} from '@/utils/router';
import {
  renderProjectsPage,
  initProjectsPageInteractions,
  cleanupProjectsPage,
} from '@/components/ProjectsPage';
import {
  renderProjectWeReadyPage,
  initProjectWeReadyPage,
  cleanupProjectWeReadyPage,
  setReferrerRoute,
} from '@/components/ProjectWeReadyPage';
import { renderForFunPage, initForFunPageInteractions, cleanupForFunPage } from '@/components/ForFunPage';
import { initTheme, subscribeToTheme, getTheme } from '@/utils/theme';
import { attachThemeToggleListeners, cleanupThemeToggle } from '@/components/ThemeToggle';
import { getSelectedSuggestionChips } from '@/utils/suggestionChipSelector';

const CHAT_ROOT_SELECTOR = '[data-chat-root]';
const WELCOME_SLOT_SELECTOR = '[data-chat-welcome]';
const SUGGESTION_SLOT_SELECTOR = '[data-chat-suggestions]';
const CHAT_INPUT_SELECTOR = '[data-chat-input]';
const CHAT_CONTEXT_INDICATOR_SELECTOR = '[data-chat-context-indicator]';
const RESUME_CONTEXT_INDICATOR_SELECTOR = '[data-resume-context-indicator]';
const RESUME_CONTEXT_SUGGESTIONS_SELECTOR = '[data-resume-context-suggestions]';

let pendingSuggestion: { id: string; text: string } | null = null;
let currentActiveNavItem: string | null = 'home';
const reducedMotion = prefersReducedMotion();
const { clearExperienceContextOnRouteChange } = getAppSettings();

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
const getMainContent = (): string => {
  // Render projects page when projects nav item is active
  if (currentActiveNavItem === 'projects') {
    return renderProjectsPage();
  }

  if (currentActiveNavItem === 'project-weready') {
    return renderProjectWeReadyPage();
  }

  // Render resume section if resume nav item is active
  if (currentActiveNavItem === 'resume') {
    return renderResume();
  }

  if (currentActiveNavItem === 'for-fun') {
    return renderForFunPage();
  }

  // Show project cards on home tab for better UX
  const showProjectCards = currentActiveNavItem === 'home';
  const projectCardsMarkup = showProjectCards && featuredProjects.length > 0 ? renderProjectCards(featuredProjects) : '';

  // Default chat interface (home, projects, and all other nav items)
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
      ${suggestionsSection}
      ${renderChatContainer(state.messages, {
        showEmptyState: false,
        emptyStateContent: '',
        appendContent: typingMarkup,
      })}
      ${renderChatInput()}
    </section>
    ${projectCardsMarkup}
  `;
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

  try {
    const stream = streamChatResponse(chatRequest);
    for await (const event of stream) {
      if (event.token) {
        appendToMessage(placeholder.id, event.token);
      }
      if (event.done) break;
    }
    startMessageAnimation(placeholder.id);
    await waitForMessageCompletion(placeholder.id);
  } catch (err) {
    // Fallback to mock on error
    const response = generateMockResponse(trimmed, matchedSuggestion?.id, experienceContextPayload);
    appendToMessage(placeholder.id, response);
  } finally {
    setChatTyping(false);
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

      const insertionTarget = welcomeSlot ?? contextIndicatorSlot;

      if (insertionTarget) {
        insertionTarget.insertAdjacentElement('afterend', suggestionsContainer);
      } else {
        chatRoot.insertAdjacentElement('afterbegin', suggestionsContainer);
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

  if (chatContainer) {
    const nextMarkup = renderChatContainer(state.messages, {
      showEmptyState: false,
      emptyStateContent: '',
      appendContent: state.isTyping ? renderTypingIndicator() : '',
    });

    chatContainer.outerHTML = nextMarkup;

    // Remove one-shot initial-enter flags on next render
    consumeInitialEnterFlags();
  }
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
  const previousNavItem = currentActiveNavItem;
  const nextNavItem = getCurrentRoute();

  if (previousNavItem === nextNavItem) {
    return;
  }

  currentActiveNavItem = nextNavItem;

  // Set referrer route when navigating to project-weready
  if (nextNavItem === 'project-weready' && previousNavItem) {
    setReferrerRoute(previousNavItem);
  }

  if (previousNavItem === 'resume' && nextNavItem !== 'resume') {
    cleanupResumeInteractions();
  }

  if (previousNavItem === 'for-fun' && nextNavItem !== 'for-fun') {
    cleanupForFunPage();
  }

  if (previousNavItem === 'projects' && nextNavItem !== 'projects') {
    cleanupProjectsPage();
  }

  if (previousNavItem === 'project-weready' && nextNavItem !== 'project-weready') {
    cleanupProjectWeReadyPage();
  }

  const root = document.querySelector<HTMLDivElement>('#app');
  if (root) {
    // Cleanup theme toggle before re-render to prevent leaks
    cleanupThemeToggle();

    root.innerHTML = renderLayout(getMainContent());
    initLayout();
    refreshExperienceContextUI();
    
    // Reattach theme toggle listeners after route change
    attachThemeToggleListeners();

    // Defer route-specific interactions until DOM updates paint
    requestAnimationFrame(() => {
      const currentRoute = currentActiveNavItem;

      switch (currentRoute) {
        case 'projects':
          requestAnimationFrame(() => {
            initProjectsPageInteractions();
          });
          break;
        case 'project-weready':
          requestAnimationFrame(() => {
            initProjectWeReadyPage();
          });
          break;
        case 'resume':
          initResumeInteractions();
          refreshExperienceContextUI();
          attachExperienceContextIndicatorListeners();
          break;
        case 'for-fun':
          requestAnimationFrame(() => {
            initForFunPageInteractions();
          });
          break;
        case 'home':
        default:
          attachProjectCardListeners();
          break;
      }
    });
  }

  if (
    clearExperienceContextOnRouteChange &&
    previousNavItem === 'resume' &&
    currentActiveNavItem !== 'resume'
  ) {
    clearExperienceContext();
    clearExperienceSelection();
    refreshExperienceContextUI();
  }
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
      root.innerHTML = renderLayout(getMainContent());
      initLayout();
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
        root.innerHTML = renderLayout(getMainContent());
        initLayout();
      });

      attachChatInputListeners(handleUserMessage);
      observeChatInput();
      attachSuggestionChipListeners(handleSuggestionChipClick);
      attachProjectCardListeners();
      applyInitialAnimations();
      refreshExperienceContextUI();
      attachExperienceContextIndicatorListeners();

      // Initialize router first
      initRouter();

      // Initialize resume interactions if resume is active
      if (currentActiveNavItem === 'resume') {
        initResumeInteractions();
        refreshExperienceContextUI();
        attachExperienceContextIndicatorListeners();
      }
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
    scrollToBottom(reducedMotion ? 'auto' : 'smooth');
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
  if (!document.hidden) {
    scrollToBottom(reducedMotion ? 'auto' : 'smooth');
  }
});

// Handle navigation changes
const handleNavigationChange = (event: Event) => {
  const customEvent = event as CustomEvent<{ id: string }>;
  const navId = customEvent.detail?.id;

  if (!navId) {
    return;
  }

  const previousNavItem = currentActiveNavItem;
  currentActiveNavItem = navId;

  if (previousNavItem === 'resume' && currentActiveNavItem !== 'resume') {
    cleanupResumeInteractions();
  }

  if (previousNavItem === 'for-fun' && currentActiveNavItem !== 'for-fun') {
    cleanupForFunPage();
  }

  // Re-render the main content when navigation changes
  const root = document.querySelector<HTMLDivElement>('#app');
  if (root) {
    // Cleanup theme toggle before re-render to prevent leaks
    cleanupThemeToggle();

    root.innerHTML = renderLayout(getMainContent());
    initLayout();
    refreshExperienceContextUI();
    
    // Reattach theme toggle listeners
    attachThemeToggleListeners();

    // Defer interactions until after layout render completes
    requestAnimationFrame(() => {
      if (navId === 'resume') {
        initResumeInteractions();
        refreshExperienceContextUI();
        attachExperienceContextIndicatorListeners();
      }

      if (navId === 'projects') {
        requestAnimationFrame(() => {
          initProjectsPageInteractions();
        });
      }

      if (navId === 'for-fun') {
        requestAnimationFrame(() => {
          initForFunPageInteractions();
        });
      }

      if (navId === 'home') {
        attachProjectCardListeners();
      }
    });
  }

  if (previousNavItem === 'resume' && navId !== 'resume') {
    clearExperienceContext();
    clearExperienceSelection();
    refreshExperienceContextUI();
  }
};

document.addEventListener('sidebar:navigate', handleNavigationChange);

console.info('WallyGPT content configuration loaded:', content);
