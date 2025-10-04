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
import { renderResume, initResumeInteractions } from '@/components/Resume';
import content, { featuredProjects, suggestionChips, validateContent } from '@/config/content';
import type { ChatState } from '@/types';
import {
  debounce,
  rafThrottle,
  prefersReducedMotion,
  measurePerformance,
} from '@/utils/performance';
import {
  addChatMessage,
  generateMockResponse,
  getChatState,
  setChatInputValueState,
  setChatTyping,
  subscribeToChatState,
} from '@/utils/chatState';
 import {
   initRouter,
   getCurrentRoute,
   getRouteTitle,
   navigateTo,
   isRouteActive,
 } from '@/utils/router';
 import { renderProjectsPage, initProjectsPageInteractions } from '@/components/ProjectsPage';

const CHAT_ROOT_SELECTOR = '[data-chat-root]';
const WELCOME_SLOT_SELECTOR = '[data-chat-welcome]';
const SUGGESTION_SLOT_SELECTOR = '[data-chat-suggestions]';
const CHAT_INPUT_SELECTOR = '[data-chat-input]';

let pendingSuggestion: { id: string; text: string } | null = null;
let currentActiveNavItem: string | null = 'home';
const reducedMotion = prefersReducedMotion();

const showAppLoader = (): HTMLElement | null => {
  if (typeof document === 'undefined') {
    return null;
  }

  const loader = document.createElement('div');
  loader.className = 'app-loader';
  loader.setAttribute('role', 'status');
  loader.setAttribute('aria-live', 'polite');
  loader.dataset.appLoader = 'true';
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
  const welcomeMarkup = hasMessages ? '' : renderWelcomeCard();
  const suggestionsMarkup = hasMessages ? '' : renderSuggestionChips(suggestionChips);
  const typingMarkup = state.isTyping ? renderTypingIndicator() : '';

  return `
    <section
      class="chat-root mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8"
      data-chat-root
    >
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

  pendingSuggestion = null;
  setChatInputValueState('');

  const messageAdded = addChatMessage('user', trimmed);

  if (!messageAdded) {
    return;
  }

  if (matchedSuggestion) {
    disableSuggestionChip(matchedSuggestion.id);
  }

  setChatTyping(true);

  const responseDelay = 500 + Math.random() * 500;
  window.setTimeout(() => {
    const response = generateMockResponse(trimmed, matchedSuggestion?.id);
    setChatTyping(false);
    addChatMessage('assistant', response);
  }, responseDelay);
};

const handleSuggestionChipClick = (chipText: string) => {
  const chip = suggestionChips.find((item) => item.text === chipText) ?? null;
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

  if (welcomeSlot) {
    welcomeSlot.innerHTML = hasMessages ? '' : renderWelcomeCard();
  }

  if (suggestionSlot) {
    suggestionSlot.innerHTML = hasMessages ? '' : renderSuggestionChips(suggestionChips);

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
  currentActiveNavItem = getCurrentRoute();
  const root = document.querySelector<HTMLDivElement>('#app');
  if (root) {
    root.innerHTML = renderLayout(getMainContent());
    initLayout();

    // Initialize interactions based on current route
    const currentRoute = currentActiveNavItem;
    switch (currentRoute) {
      case 'projects':
        initProjectsPageInteractions();
        break;
      case 'resume':
        initResumeInteractions();
        break;
      case 'home':
      default:
        attachProjectCardListeners();
        break;
    }
  }
};

const mount = () => {
  const loader = showAppLoader();

  try {
    const root = document.querySelector<HTMLDivElement>('#app');

    if (!root) {
      throw new Error('Root element #app not found.');
    }

    if (reducedMotion) {
      document.body.setAttribute('data-reduced-motion', 'true');
    }

    root.innerHTML = renderLayout(getMainContent());
    initLayout();

    attachChatInputListeners(handleUserMessage);
    observeChatInput();

    attachSuggestionChipListeners(handleSuggestionChipClick);
    attachProjectCardListeners();
    applyInitialAnimations();

    // Initialize router first
    initRouter();

    // Initialize resume interactions if resume is active
    if (currentActiveNavItem === 'resume') {
      initResumeInteractions();
    }

    const fontsReady = (document as any).fonts?.ready ?? Promise.resolve();
    fontsReady.finally(() => hideAppLoader(loader));
  } catch (error) {
    hideAppLoader(loader);
    // eslint-disable-next-line no-console
    console.error('Failed to initialise WalleOS:', error);
    const fallback = document.createElement('div');
    fallback.className = 'app-error';
    fallback.textContent = 'We hit a snag while loading the experience. Please refresh and try again.';
    document.body.appendChild(fallback);
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

  currentActiveNavItem = navId;

  // Re-render the main content when navigation changes
  const root = document.querySelector<HTMLDivElement>('#app');
  if (root) {
    root.innerHTML = renderLayout(getMainContent());
    initLayout();

    // Initialize resume interactions if resume is now active
    if (navId === 'resume') {
      initResumeInteractions();
    }

    if (navId === 'projects') {
      initProjectsPageInteractions();
    }

    // Initialize project card interactions if home tab is now active
    if (navId === 'home') {
      attachProjectCardListeners();
    }
  }
};

document.addEventListener('sidebar:navigate', handleNavigationChange);

console.info('WalleGPT content configuration loaded:', content);
