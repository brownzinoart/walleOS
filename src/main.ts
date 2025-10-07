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
import { renderProjectsPage, initProjectsPageInteractions } from '@/components/ProjectsPage';

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

  return suggestionChips;
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
    class="chat-message chat-message-assistant mr-auto bg-gray-800 text-white border-2 border-neon-magenta rounded-lg rounded-bl-sm max-w-[80%] md:max-w-[70%] p-4"
    data-typing-indicator
    aria-live="polite"
  >
    <div class="flex items-center gap-2 text-sm font-semibold">
      <span class="typing-dot"></span>
      <span class="typing-dot typing-dot-delay"></span>
      <span class="typing-dot typing-dot-delay-xl"></span>
      <span class="ml-3 uppercase tracking-widest text-xs text-gray-300">Typing</span>
    </div>
  </article>
`;
const getMainContent = (): string => {
  // Render projects page when projects nav item is active
  if (currentActiveNavItem === 'projects') {
    return renderProjectsPage();
  }

  // Render resume section if resume nav item is active
  if (currentActiveNavItem === 'resume') {
    return renderResume();
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

  return `
    <section
      class="chat-root content-container flex flex-1 flex-col gap-8"
      data-chat-root
    >
      <div class="chat-context-indicator" data-chat-context-indicator>
        ${indicatorMarkup}
      </div>
      <header class="chat-intro flex flex-col gap-6" data-chat-welcome>
        ${welcomeMarkup}
      </header>
      <div class="chat-suggestions" data-chat-suggestions>
        ${suggestionsMarkup}
      </div>
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

const handleUserMessage = (message: string) => {
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

  const responseDelay = 500 + Math.random() * 500;
  window.setTimeout(() => {
    const response = generateMockResponse(trimmed, matchedSuggestion?.id, experienceContextPayload);
    setChatTyping(false);
    addChatMessage('assistant', response);
  }, responseDelay);
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
  const welcomeSlot = chatRoot.querySelector<HTMLElement>(WELCOME_SLOT_SELECTOR);
  const suggestionSlot = chatRoot.querySelector<HTMLElement>(SUGGESTION_SLOT_SELECTOR);
  const contextIndicatorSlot = chatRoot.querySelector<HTMLElement>(CHAT_CONTEXT_INDICATOR_SELECTOR);

  if (contextIndicatorSlot) {
    contextIndicatorSlot.innerHTML = renderExperienceContextIndicator(getActiveExperienceState()?.experience ?? null);
    attachExperienceContextIndicatorListeners();
  }

  if (welcomeSlot) {
    welcomeSlot.innerHTML = hasMessages ? '' : renderWelcomeCard();
  }

  if (suggestionSlot) {
    suggestionSlot.innerHTML = hasMessages ? '' : renderSuggestionChips(resolveSuggestionChips());

    if (!hasMessages) {
      attachSuggestionChipListeners(handleSuggestionChipClick);
    }
  }

  const chatContainer = chatRoot.querySelector<HTMLElement>(CHAT_CONTAINER_SELECTOR);

  if (chatContainer) {
    const nextMarkup = renderChatContainer(state.messages, {
      showEmptyState: false,
      emptyStateContent: '',
      appendContent: state.isTyping ? renderTypingIndicator() : '',
    });

    chatContainer.outerHTML = nextMarkup;
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
  currentActiveNavItem = getCurrentRoute();
  const nextNavItem = currentActiveNavItem;

  if (previousNavItem === 'resume' && nextNavItem !== 'resume') {
    cleanupResumeInteractions();
  }

  const root = document.querySelector<HTMLDivElement>('#app');
  if (root) {
    root.innerHTML = renderLayout(getMainContent());
    initLayout();
    refreshExperienceContextUI();

    // Defer route-specific interactions until DOM updates paint
    requestAnimationFrame(() => {
      const currentRoute = currentActiveNavItem;

      switch (currentRoute) {
        case 'projects':
          requestAnimationFrame(() => {
            initProjectsPageInteractions();
          });
          break;
        case 'resume':
          initResumeInteractions();
          refreshExperienceContextUI();
          attachExperienceContextIndicatorListeners();
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
  rerenderChat(state);

  const messagesChanged = state.messages.length !== previousState.messages.length;
  const typingChanged = state.isTyping !== previousState.isTyping;

  if (messagesChanged || typingChanged) {
    scrollToBottom(reducedMotion ? 'auto' : 'smooth');
  }
});

subscribeToExperienceContext((context, previousContext) => {
  refreshExperienceContextUI();

  if (!context.experience && previousContext.experience) {
    clearExperienceSelection();
  }
});

validateContent();
mount();

// Listen for route changes
document.addEventListener('route:change', handleRouteChange);

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

  // Re-render the main content when navigation changes
  const root = document.querySelector<HTMLDivElement>('#app');
  if (root) {
    root.innerHTML = renderLayout(getMainContent());
    initLayout();
    refreshExperienceContextUI();

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

console.info('WalleGPT content configuration loaded:', content);
