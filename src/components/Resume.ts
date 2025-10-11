import {
  attachExperienceChatListeners,
  cleanupExperienceChat,
  renderExperienceChat,
  EXPERIENCE_CHAT_CLOSE_SELECTOR,
} from '@/components/ExperienceChat';
import { resume } from '@/config/content';
import type { Experience } from '@/types';
import { escapeHtml } from '@/utils/dom';
import {
  addWillChange,
  removeWillChange,
  prefersReducedMotion,
  observeIntersection,
  isMobileViewport,
  subscribeToMobileViewportChange,
} from '@/utils/performance';

const RESUME_SECTION_SELECTOR = '.resume-section';
const RESUME_HEADER_SELECTOR = '.resume-header';
const RESUME_CONTEXT_INDICATOR_SELECTOR = '[data-resume-context-indicator]';
const RESUME_CONTEXT_SUGGESTIONS_SELECTOR = '[data-resume-context-suggestions]';
const RESUME_INTRO_DELAY_VAR = '--resume-intro-delay';
const RESUME_CARD_DELAY_VAR = '--resume-card-delay';
const EXPERIENCE_CARD_SELECTOR = '[data-experience-card]';
const EXPERIENCE_ROW_SELECTOR = '[data-experience-row]';
const EXPERIENCE_CHAT_TOGGLE_SELECTOR = '[data-experience-chat-toggle]';
const EXPERIENCE_CHAT_CONTAINER_SELECTOR = '[data-chat-container]';
const EXPERIENCE_CARD_CONTAINER_SELECTOR = '[data-card-container]';
const EXPERIENCE_ARIA_LIVE_SELECTOR = '[data-experience-aria-live]';

const CHAT_TOGGLE_TEXT_OPEN = 'Close Chat';
const CHAT_TOGGLE_TEXT_CLOSED = 'Chat About This Role';

const RESUME_CARD_PENDING_CLASS = 'resume-card-pending';
const RESUME_CARD_DELAY_STEP = 70;
const RESUME_CARD_DELAY_MAX = 280;
const RESUME_CARD_ANIMATED_KEY = 'resumeAnimated';
const RESUME_CARD_DELAY_KEY = 'resumeCardDelay';

type ResumeAnimationOptions = {
  className: string;
  delayVar?: string;
  delayMs?: number;
  onComplete?: () => void;
};

type ExperienceRowEntry = {
  experience: Experience;
  row: HTMLElement;
  cardContainer: HTMLElement;
  chatContainer: HTMLElement;
  toggleButton: HTMLButtonElement;
};

const experienceLookup = new Map<string, Experience>();
resume.experiences.forEach((experience) => {
  experienceLookup.set(experience.id, experience);
});

const experienceRowRegistry = new Map<string, ExperienceRowEntry>();
const experienceToggleHandlers = new Map<string, (event: Event) => void>();
const experienceCloseHandlers = new Map<string, (event: Event) => void>();
const experienceTouchHandlers = new Map<string, (event: TouchEvent) => void>();
const experienceEscapeHandlers = new Map<string, (event: KeyboardEvent) => void>();
let lastTouchInteractionTime = 0;
let mobileViewportUnsubscribe: (() => void) | null = null;

const getExperienceById = (experienceId: string): Experience | undefined =>
  experienceLookup.get(experienceId);

const animateElement = (element: HTMLElement | null, options: ResumeAnimationOptions): void => {
  if (!element) {
    return;
  }

  if (element.dataset['resumeAnimating'] === 'true') {
    return;
  }

  const { className, delayVar, delayMs, onComplete } = options;

  element.dataset['resumeAnimating'] = 'true';

  if (delayVar && typeof delayMs === 'number') {
    element.style.setProperty(delayVar, `${delayMs}ms`);
  }

  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);

  element.addEventListener(
    'animationend',
    () => {
      if (delayVar) {
        element.style.removeProperty(delayVar);
      }

      element.classList.remove(className);
      delete element.dataset['resumeAnimating'];
      onComplete?.();
    },
    { once: true },
  );
};

const prepareResumeCards = (cards: HTMLElement[]): void => {
  cards.forEach((card, index) => {
    const delay = Math.min(index * RESUME_CARD_DELAY_STEP, RESUME_CARD_DELAY_MAX);
    card.dataset[RESUME_CARD_ANIMATED_KEY] = 'false';
    card.dataset[RESUME_CARD_DELAY_KEY] = String(delay);
    card.classList.add(RESUME_CARD_PENDING_CLASS);
    card.style.setProperty(RESUME_CARD_DELAY_VAR, `${delay}ms`);
  });
};

const animateResumeCard = (card: HTMLElement): void => {
  const delay = Number(card.dataset[RESUME_CARD_DELAY_KEY] ?? '0');
  card.classList.remove(RESUME_CARD_PENDING_CLASS);
  addWillChange(card, ['transform', 'opacity']);
  animateElement(card, {
    className: 'resume-card-enter',
    delayVar: RESUME_CARD_DELAY_VAR,
    delayMs: delay,
    onComplete: () => {
      removeWillChange(card);
      card.style.removeProperty(RESUME_CARD_DELAY_VAR);
      delete card.dataset[RESUME_CARD_DELAY_KEY];
    },
  });
};

const initResumeCardScrollAnimations = (cards: HTMLElement[]): void => {
  if (!cards.length) {
    return;
  }

  const triggerAnimation = (card: HTMLElement) => {
    if (card.dataset[RESUME_CARD_ANIMATED_KEY] === 'true') {
      return;
    }

    card.dataset[RESUME_CARD_ANIMATED_KEY] = 'true';
    animateResumeCard(card);
  };

  observeIntersection(
    cards,
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        const target = entry.target as HTMLElement;
        triggerAnimation(target);
        observer.unobserve(target);
      });
    },
    {
      rootMargin: '0px 0px -15% 0px',
      threshold: 0.2,
    },
  );

  cards.forEach((card) => {
    const rect = card.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      triggerAnimation(card);
    }
  });
};

export const applyResumeEntryAnimations = (): void => {
  const resumeSection = document.querySelector<HTMLElement>(RESUME_SECTION_SELECTOR);

  if (!resumeSection) {
    return;
  }

  if (prefersReducedMotion()) {
    return;
  }

  const contextIndicator = document.querySelector<HTMLElement>(RESUME_CONTEXT_INDICATOR_SELECTOR);
  const suggestions = document.querySelector<HTMLElement>(RESUME_CONTEXT_SUGGESTIONS_SELECTOR);
  const header = resumeSection.querySelector<HTMLElement>(RESUME_HEADER_SELECTOR);
  const experienceCards = Array.from(
    resumeSection.querySelectorAll<HTMLElement>(EXPERIENCE_CARD_SELECTOR),
  );

  requestAnimationFrame(() => {
    prepareResumeCards(experienceCards);

    animateElement(contextIndicator, {
      className: 'resume-intro-enter',
      delayVar: RESUME_INTRO_DELAY_VAR,
      delayMs: 0,
    });

    animateElement(suggestions, {
      className: 'resume-intro-enter',
      delayVar: RESUME_INTRO_DELAY_VAR,
      delayMs: 40,
    });

    animateElement(header, {
      className: 'resume-intro-enter',
      delayVar: RESUME_INTRO_DELAY_VAR,
      delayMs: 80,
    });

    initResumeCardScrollAnimations(experienceCards);
  });
};


const renderExperienceContent = (experience: Experience): string => {
  const titleId = `resume-detail-title-${experience.id}`;
  const descriptionId = `resume-detail-description-${experience.id}`;
  const achievementsHeadingId = `${titleId}-achievements`;
  const skillsHeadingId = `${titleId}-skills`;
  const techHeadingId = `${titleId}-technologies`;
  const safeTitle = escapeHtml(experience.title);
  const safeCompany = escapeHtml(experience.company);
  const safeDescription = escapeHtml(experience.description);

  const achievementsSection = experience.achievements?.length
    ? `
      <section class="resume-detail-section" aria-labelledby="${achievementsHeadingId}">
        <h3 class="resume-detail-section-title" id="${achievementsHeadingId}">Key Achievements</h3>
        <ul class="resume-detail-achievements">
          ${experience.achievements.map((achievement) => `
            <li class="resume-detail-achievement-item">
              <span class="resume-detail-achievement-icon" aria-hidden="true">&#10003;</span>
              <span class="resume-detail-achievement-text">${escapeHtml(achievement)}</span>
            </li>
          `).join('')}
        </ul>
      </section>
    `
    : '';

  const skillsSection = experience.skills?.length
    ? `
      <section class="resume-detail-section" aria-labelledby="${skillsHeadingId}">
        <h3 class="resume-detail-section-title" id="${skillsHeadingId}">Core Skills</h3>
        <div class="resume-detail-skills" role="list">
          ${experience.skills.map((skill) => `
            <span class="resume-detail-skill-tag" role="listitem">${escapeHtml(skill)}</span>
          `).join('')}
        </div>
      </section>
    `
    : '';

  const technologiesSection = experience.technologies?.length
    ? `
      <section class="resume-detail-section" aria-labelledby="${techHeadingId}">
        <h3 class="resume-detail-section-title" id="${techHeadingId}">Technologies</h3>
        <div class="resume-detail-technologies" role="list">
          ${experience.technologies.map((tech) => `
            <span class="resume-detail-tech-badge" role="listitem">${escapeHtml(tech)}</span>
          `).join('')}
        </div>
      </section>
    `
    : '';

  return `
    <div
      class="experience-row"
      data-experience-row
      data-experience-id="${experience.id}"
      data-chat-open="false"
    >
      <div
        class="sr-only"
        data-experience-aria-live
        role="status"
        aria-live="polite"
        aria-atomic="true"
      ></div>
      <div class="experience-card-container" data-card-container>
        <article
          class="resume-detail-content transition-all duration-200 ease-brutal focus-ring-theme hover:border-neon-cyan"
          data-experience-card
          data-experience-id="${experience.id}"
          aria-labelledby="${titleId}"
          aria-describedby="${descriptionId}"
          aria-label="Details about ${safeTitle} at ${safeCompany}"
          tabindex="0"
        >
          <header class="resume-detail-header">
            <div class="resume-detail-heading-row">
              <div class="resume-medium-card-level" data-experience-level="${experience.experienceLevel}">
                <span class="text-xs font-bold uppercase tracking-wider">${experience.experienceLevel}</span>
              </div>
              <span class="resume-detail-period">${experience.period}</span>
              <button
                type="button"
                class="resume-detail-chat-button ml-auto"
                data-experience-chat-toggle
                data-experience-id="${experience.id}"
                aria-label="Open chat to ask questions and learn more about this role"
                aria-expanded="false"
              >
                <span class="resume-detail-chat-button-icon" aria-hidden="true">💬</span>
                <span class="resume-detail-chat-button-text">${CHAT_TOGGLE_TEXT_CLOSED}</span>
              </button>
            </div>
            <h2 class="resume-detail-title" id="${titleId}">${safeTitle}</h2>
            <p class="resume-detail-company">${safeCompany}</p>
          </header>
          <p class="resume-detail-description" id="${descriptionId}">
            ${safeDescription}
          </p>
          ${achievementsSection}
          ${skillsSection}
          ${technologiesSection}
        </article>
      </div>
      <div
        class="experience-chat-container"
        data-chat-container
        data-experience-id="${experience.id}"
        hidden
        aria-hidden="true"
      ></div>
    </div>
  `;
};

export const renderResume = (): string => `
  <section class="resume-section" data-section-id="resume">
    <div class="resume-container max-w-7xl mx-auto">
      <div class="resume-header mb-12">
        <h1 class="resume-title text-4xl md:text-5xl font-black text-primary mb-6">
          Professional Journey
        </h1>
        <p class="resume-summary text-lg text-secondary max-w-3xl leading-relaxed">
          ${resume.summary}
        </p>
        <div class="resume-header-actions mt-8">
          <a
            href="${resume.resumeFileUrl || '/resume.pdf'}"
            download="Wally_Resume.pdf"
            class="resume-download-button inline-flex items-center gap-2 px-6 py-3 bg-surface-secondary text-primary font-bold rounded-md border-2 border-default hover:border-neon-cyan transition-all"
            aria-label="Download resume as PDF"
          >
            <span aria-hidden="true">⬇️</span>
            <span>Download Resume</span>
          </a>
        </div>
      </div>

      <div class="resume-full-experience-list">
        ${resume.experiences.map(renderExperienceContent).join('')}
      </div>
    </div>
  </section>
`;

const ensureChatContainerHidden = (chatContainer: HTMLElement): void => {
  chatContainer.setAttribute('aria-hidden', 'true');
  if (!chatContainer.hasAttribute('hidden')) {
    chatContainer.setAttribute('hidden', '');
  }
};

const revealChatContainer = (chatContainer: HTMLElement): void => {
  chatContainer.removeAttribute('hidden');
  chatContainer.setAttribute('aria-hidden', 'false');
};

const updateChatToggleButton = (entry: ExperienceRowEntry, isOpen: boolean): void => {
  const { toggleButton } = entry;
  const label = isOpen
    ? 'Close chat panel'
    : 'Open chat to ask questions and learn more about this role';
  const text = toggleButton.querySelector<HTMLElement>('.resume-detail-chat-button-text');

  if (text) {
    text.textContent = isOpen ? CHAT_TOGGLE_TEXT_OPEN : CHAT_TOGGLE_TEXT_CLOSED;
  }

  toggleButton.setAttribute('aria-label', label);
  toggleButton.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
};

const openExperienceChatRow = (entry: ExperienceRowEntry): void => {
  const { experience, row, chatContainer } = entry;

  if (row.dataset['chatOpen'] === 'true') {
    return;
  }

  row.dataset['chatOpen'] = 'true';
  row.classList.add('is-chat-open');
  revealChatContainer(chatContainer);
  chatContainer.innerHTML = renderExperienceChat(experience.id, experience);
  attachExperienceChatListeners(experience.id, experience);
  updateChatToggleButton(entry, true);
  const mobileViewportActive = isMobileViewport();

  if (mobileViewportActive) {
    const closeButton = chatContainer.querySelector<HTMLButtonElement>(EXPERIENCE_CHAT_CLOSE_SELECTOR);

    if (closeButton) {
      const focusCloseButton = () => closeButton.focus({ preventScroll: false });

      if (prefersReducedMotion()) {
        focusCloseButton();
      } else {
        requestAnimationFrame(() => {
          focusCloseButton();
        });
      }
    }

    const liveRegion = row.querySelector<HTMLElement>(EXPERIENCE_ARIA_LIVE_SELECTOR);

    if (liveRegion) {
      liveRegion.textContent = `Chat opened for ${experience.title}`;
      window.setTimeout(() => {
        if (liveRegion.textContent === `Chat opened for ${experience.title}`) {
          liveRegion.textContent = '';
        }
      }, 1000);
    }

    const originalRole = chatContainer.getAttribute('role');
    chatContainer.dataset['originalRole'] = originalRole ?? '';
    chatContainer.setAttribute('role', 'dialog');
    chatContainer.setAttribute('aria-modal', 'true');
    chatContainer.setAttribute('aria-labelledby', `experience-chat-title-${experience.id}`);
  }

  attachEscapeKeyHandlerForMobile(experience.id, entry);

  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate?.([8, 12, 8]);
  }
};

const closeExperienceChatRow = (
  entry: ExperienceRowEntry,
  options?: { immediate?: boolean },
): void => {
  const { experience, row, chatContainer } = entry;
  const wasOpen = row.dataset['chatOpen'] === 'true';

  updateChatToggleButton(entry, false);

  if (!wasOpen && !options?.immediate) {
    ensureChatContainerHidden(chatContainer);
    return;
  }

  const mobileViewportActive = isMobileViewport();

  if (mobileViewportActive && (wasOpen || options?.immediate)) {
    entry.toggleButton.focus({ preventScroll: true });

    const liveRegion = row.querySelector<HTMLElement>(EXPERIENCE_ARIA_LIVE_SELECTOR);

    if (liveRegion) {
      liveRegion.textContent = 'Chat closed';
      window.setTimeout(() => {
        if (liveRegion.textContent === 'Chat closed') {
          liveRegion.textContent = '';
        }
      }, 1000);
    }

    const originalRole = chatContainer.dataset['originalRole'] ?? '';

    chatContainer.removeAttribute('aria-modal');
    chatContainer.removeAttribute('aria-labelledby');

    if (originalRole) {
      chatContainer.setAttribute('role', originalRole);
    } else {
      chatContainer.removeAttribute('role');
    }

    delete chatContainer.dataset['originalRole'];
  }

  const finalizeClose = () => {
    removeEscapeKeyHandlerForMobile(experience.id);
    cleanupExperienceChat(experience.id);
    chatContainer.innerHTML = '';
    ensureChatContainerHidden(chatContainer);
    row.dataset['chatOpen'] = 'false';
  };

  row.classList.remove('is-chat-open');

  if (options?.immediate || prefersReducedMotion()) {
    finalizeClose();
    return;
  }

  let fallbackTimeoutId: number | null = null;

  const cleanupTransitionListeners = () => {
    row.removeEventListener('transitionend', onTransitionEnd);
    chatContainer.removeEventListener('transitionend', onTransitionEnd);
  };

  const onTransitionEnd = (event: TransitionEvent) => {
    if (event.target !== event.currentTarget) {
      return;
    }

    cleanupTransitionListeners();

    if (fallbackTimeoutId !== null) {
      window.clearTimeout(fallbackTimeoutId);
    }

    finalizeClose();
  };

  row.addEventListener('transitionend', onTransitionEnd, { once: true });
  chatContainer.addEventListener('transitionend', onTransitionEnd, { once: true });

  fallbackTimeoutId = window.setTimeout(() => {
    cleanupTransitionListeners();
    finalizeClose();
  }, 450);
};

/**
 * Attach touchstart listeners for quick chat toggling on mobile viewports.
 * Ensures touch interactions receive immediate feedback without duplicating click handlers.
 */
const attachTouchListenersForMobile = (experienceId: string, entry: ExperienceRowEntry): void => {
  if (!isMobileViewport()) {
    return;
  }

  if (experienceTouchHandlers.has(experienceId)) {
    return;
  }

  const handler = (event: TouchEvent) => {
    event.preventDefault();
    lastTouchInteractionTime = Date.now();

    if (entry.row.dataset['chatOpen'] === 'true') {
      closeExperienceChatRow(entry);
      return;
    }

    openExperienceChatRow(entry);
  };

  entry.toggleButton.addEventListener('touchstart', handler, { passive: false });
  experienceTouchHandlers.set(experienceId, handler);
};

/**
 * Remove touchstart listeners when the viewport exceeds the mobile breakpoint.
 * Prevents lingering listeners when users resize or rotate their device.
 */
const removeTouchListenersForMobile = (experienceId: string, entry: ExperienceRowEntry): void => {
  const handler = experienceTouchHandlers.get(experienceId);

  if (!handler) {
    return;
  }

  entry.toggleButton.removeEventListener('touchstart', handler);
  experienceTouchHandlers.delete(experienceId);
};

/**
 * Attach an Escape key listener that closes the mobile chat overlay and restores
 * focus to the toggle button for improved keyboard accessibility on small screens.
 * This listener is only active while the viewport matches the mobile breakpoint.
 */
const attachEscapeKeyHandlerForMobile = (experienceId: string, entry: ExperienceRowEntry): void => {
  if (!isMobileViewport()) {
    return;
  }

  if (experienceEscapeHandlers.has(experienceId)) {
    return;
  }

  const handler = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') {
      return;
    }

    if (entry.row.dataset['chatOpen'] !== 'true') {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    closeExperienceChatRow(entry);
  };

  document.addEventListener('keydown', handler);
  experienceEscapeHandlers.set(experienceId, handler);
};

/**
 * Remove the Escape key listener that is scoped to the mobile chat overlay when the
 * viewport changes or the chat row unmounts, preventing orphaned handlers.
 */
const removeEscapeKeyHandlerForMobile = (experienceId: string): void => {
  const handler = experienceEscapeHandlers.get(experienceId);

  if (!handler) {
    return;
  }

  document.removeEventListener('keydown', handler);
  experienceEscapeHandlers.delete(experienceId);
};

export const initResumeInteractions = (): void => {
  applyResumeEntryAnimations();

  const cardElements = Array.from(
    document.querySelectorAll<HTMLElement>(EXPERIENCE_CARD_SELECTOR),
  );

  cardElements.forEach((card) => {
    if (card.dataset['listenersAttached'] === 'true') {
      return;
    }

    card.dataset['listenersAttached'] = 'true';

    card.addEventListener('mouseenter', () =>
      addWillChange(card, ['transform', 'box-shadow', 'border-color']),
    );
    card.addEventListener('mouseleave', () => removeWillChange(card));
    card.addEventListener('focus', () => addWillChange(card, ['transform', 'box-shadow', 'border-color']));
    card.addEventListener('blur', () => removeWillChange(card));
  });

  const experienceRows = Array.from(
    document.querySelectorAll<HTMLElement>(EXPERIENCE_ROW_SELECTOR),
  );

  experienceRows.forEach((row) => {
    const experienceId = row.dataset['experienceId'];

    if (!experienceId) {
      return;
    }

    const experience = getExperienceById(experienceId);

    if (!experience) {
      return;
    }

    const toggleButton = row.querySelector<HTMLButtonElement>(EXPERIENCE_CHAT_TOGGLE_SELECTOR);
    const cardContainer = row.querySelector<HTMLElement>(EXPERIENCE_CARD_CONTAINER_SELECTOR);
    const chatContainer = row.querySelector<HTMLElement>(EXPERIENCE_CHAT_CONTAINER_SELECTOR);

    if (!toggleButton || !cardContainer || !chatContainer) {
      return;
    }

    const existingHandler = experienceToggleHandlers.get(experienceId);

    if (existingHandler) {
      toggleButton.removeEventListener('click', existingHandler);
      experienceToggleHandlers.delete(experienceId);
    }

    const existingCloseHandler = experienceCloseHandlers.get(experienceId);

    if (existingCloseHandler) {
      row.removeEventListener('experience-chat-close', existingCloseHandler);
      experienceCloseHandlers.delete(experienceId);
    }

    const entry: ExperienceRowEntry = {
      experience,
      row,
      cardContainer,
      chatContainer,
      toggleButton,
    };

    experienceRowRegistry.set(experienceId, entry);

    const handleToggle = (event: Event) => {
      event.preventDefault();
      const timeSinceLastTouch = Date.now() - lastTouchInteractionTime;

      if (timeSinceLastTouch < 500) {
        return;
      }

      if (row.dataset['chatOpen'] === 'true') {
        closeExperienceChatRow(entry);
      } else {
        openExperienceChatRow(entry);
      }
    };

    toggleButton.addEventListener('click', handleToggle);
    experienceToggleHandlers.set(experienceId, handleToggle);

    const handleCloseEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{ experienceId?: string }>;

      if (customEvent.detail?.experienceId === experienceId) {
        closeExperienceChatRow(entry);
      }
    };

    row.addEventListener('experience-chat-close', handleCloseEvent);
    experienceCloseHandlers.set(experienceId, handleCloseEvent);
  });

  if (mobileViewportUnsubscribe) {
    mobileViewportUnsubscribe();
    mobileViewportUnsubscribe = null;
  }

  mobileViewportUnsubscribe = subscribeToMobileViewportChange((isMobile) => {
    experienceRowRegistry.forEach((entry, experienceId) => {
      if (entry.row.dataset['chatOpen'] === 'true') {
        if (!isMobile) {
          const { chatContainer } = entry;
          const originalRole = chatContainer.dataset['originalRole'] ?? '';
          chatContainer.removeAttribute('aria-modal');
          chatContainer.removeAttribute('aria-labelledby');
          if (originalRole) chatContainer.setAttribute('role', originalRole);
          else chatContainer.removeAttribute('role');
        } else {
          const { chatContainer, experience } = entry;
          if (!chatContainer.dataset['originalRole']) {
            const originalRole = chatContainer.getAttribute('role');
            chatContainer.dataset['originalRole'] = originalRole ?? '';
          }
          chatContainer.setAttribute('role', 'dialog');
          chatContainer.setAttribute('aria-modal', 'true');
          chatContainer.setAttribute('aria-labelledby', `experience-chat-title-${experience.id}`);
        }
      }

      if (isMobile) {
        attachTouchListenersForMobile(experienceId, entry);
        if (entry.row.dataset['chatOpen'] === 'true') {
          attachEscapeKeyHandlerForMobile(experienceId, entry);
        } else {
          removeEscapeKeyHandlerForMobile(experienceId);
        }
      } else {
        removeTouchListenersForMobile(experienceId, entry);
        removeEscapeKeyHandlerForMobile(experienceId);
      }
    });
  });
};

export const clearExperienceSelection = (): void => {
  experienceRowRegistry.forEach((entry) => {
    if (entry.row.dataset['chatOpen'] === 'true') {
      closeExperienceChatRow(entry);
    }
  });
};

export const cleanupResumeInteractions = (): void => {
  if (mobileViewportUnsubscribe) {
    mobileViewportUnsubscribe();
    mobileViewportUnsubscribe = null;
  }

  experienceToggleHandlers.forEach((handler, experienceId) => {
    const entry = experienceRowRegistry.get(experienceId);

    if (!entry) {
      return;
    }

    entry.toggleButton.removeEventListener('click', handler);

    const closeHandler = experienceCloseHandlers.get(experienceId);

    if (closeHandler) {
      entry.row.removeEventListener('experience-chat-close', closeHandler);
      experienceCloseHandlers.delete(experienceId);
    }

    if (entry.row.dataset['chatOpen'] === 'true') {
      closeExperienceChatRow(entry, { immediate: true });
    } else {
      cleanupExperienceChat(experienceId);
      ensureChatContainerHidden(entry.chatContainer);
      entry.chatContainer.innerHTML = '';
    }

    removeTouchListenersForMobile(experienceId, entry);
    removeEscapeKeyHandlerForMobile(experienceId);
  });

  experienceToggleHandlers.clear();
  experienceCloseHandlers.clear();
  experienceTouchHandlers.clear();
  Array.from(experienceEscapeHandlers.keys()).forEach((experienceId) => {
    removeEscapeKeyHandlerForMobile(experienceId);
  });
  experienceEscapeHandlers.clear();
  experienceRowRegistry.clear();
};
