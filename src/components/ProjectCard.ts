import { addWillChange, removeWillChange, rafThrottle, observeIntersection, prefersReducedMotion } from '@/utils/performance';
import type { FeaturedProject } from '@/config/content';

export const PROJECT_CARDS_CONTAINER_SELECTOR = '[data-project-cards]';
export const PROJECT_CARD_SELECTOR = '[data-project-card]';

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const slugify = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]+/g, '-');

const renderProjectTags = (tags: string[]): string => {
  if (!Array.isArray(tags) || tags.length === 0) {
    return '';
  }

  return tags
    .map((tag) => {
      const label = escapeHtml(tag);
      return `
        <button
          type="button"
          class="project-card-tag"
          data-project-tag
          data-project-tag-value="${label}"
          aria-pressed="false"
        >
          ${label}
        </button>
      `;
    })
    .join('');
};

const getCardClasses = () =>
  [
    'project-card',
    'group',
    'relative',
    'flex',
    'h-full',
    'flex-col',
    'border-2',
    'border-default',
    'bg-surface-card',
    'rounded-lg',
    'overflow-hidden',
    'cursor-pointer',
    'transition-all',
    'duration-200',
    'ease-brutal',
    'focus-ring-theme',
    'hover:-translate-y-1',
  ].join(' ');

export const renderProjectCard = (project: FeaturedProject, index = 0): string => {
  const thumbnail = project.thumbnail?.trim() ?? '';
  const url = project.url?.trim() ?? '';
  const descriptionId = `project-card-description-${slugify(project.id)}`;

  return `
    <article
      class="${getCardClasses()}"
      data-project-card
      data-project-id="${escapeHtml(project.id)}"
      data-project-url="${escapeHtml(url)}"
      data-animated="false"
      data-card-index="${index}"
      aria-label="Open project ${escapeHtml(project.title)}"
      aria-describedby="${descriptionId}"
      role="link"
      tabindex="0"
    >
      <div class="project-card-thumbnail" data-project-thumbnail-wrapper>
        ${
          thumbnail
            ? `<img
                src="${escapeHtml(thumbnail)}"
                alt="${escapeHtml(project.title)} thumbnail"
                loading="lazy"
                decoding="async"
                data-project-thumbnail
              />`
            : ''
        }
      </div>
      <div class="project-card-content">
        <h3 class="project-card-title">${escapeHtml(project.title)}</h3>
        <p class="project-card-description" id="${descriptionId}">${escapeHtml(project.description)}</p>
        <div class="project-card-tags">
          ${renderProjectTags(project.tags)}
        </div>
      </div>
    </article>
  `;
};

export const renderProjectCards = (projects: FeaturedProject[]): string => {
  if (!Array.isArray(projects) || projects.length === 0) {
    return '';
  }

  const cardsMarkup = projects.map((project, index) => renderProjectCard(project, index)).join('');

  return `
    <section class="project-cards-section mt-16" data-project-cards data-section-id="projects" id="projects">
      <div class="project-cards-inner content-container flex flex-col gap-8">
        <header class="flex flex-col gap-2">
          <p class="project-cards-eyebrow">Featured Work</p>
          <h2 class="project-cards-heading">Featured Projects</h2>
        </header>
        <div class="project-cards-grid grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          ${cardsMarkup}
        </div>
      </div>
    </section>
  `;
};

const registerCardListeners = (card: HTMLElement): void => {
  if (card.dataset['listenersAttached'] === 'true') {
    return;
  }

  card.dataset['listenersAttached'] = 'true';
  // Click and keyboard interactions are delegated in ProjectsPage.ts to power grid expansion.
};

const setupThumbnail = (card: HTMLElement) => {
  const image = card.querySelector<HTMLImageElement>('[data-project-thumbnail]');
  const wrapper = card.querySelector<HTMLElement>('[data-project-thumbnail-wrapper]');

  if (!image || !wrapper) {
    return;
  }

  const markLoaded = () => {
    image.classList.add('is-loaded');
    wrapper.setAttribute('data-loaded', 'true');
  };

  if (image.complete) {
    markLoaded();
    return;
  }

  image.addEventListener('load', markLoaded, { once: true });
  image.addEventListener('error', () => {
    wrapper.setAttribute('data-loaded', 'true');
  }, { once: true });
};

const setupTagListeners = (card: HTMLElement) => {
  const tags = card.querySelectorAll<HTMLButtonElement>('[data-project-tag]');

  if (!tags.length) {
    return;
  }

  tags.forEach((tag) => {
    if (tag.dataset['listenerAttached'] === 'true') {
      return;
    }

    tag.dataset['listenerAttached'] = 'true';

    const value = tag.dataset['projectTagValue'] ?? tag.textContent?.trim() ?? '';

    const emitSelection = () => {
      const event = new CustomEvent('project:tag-select', {
        detail: {
          tag: value,
          projectId: card.getAttribute('data-project-id'),
        },
        bubbles: true,
      });

      tag.setAttribute('aria-pressed', 'true');
      window.setTimeout(() => tag.setAttribute('aria-pressed', 'false'), 300);
      card.dispatchEvent(event);
    };

    tag.addEventListener('click', (event) => {
      event.stopPropagation();
      emitSelection();
    });

    tag.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        event.stopPropagation();
        emitSelection();
      }
    });
  });
};

const setupPressFeedback = (card: HTMLElement) => {
  if (card.dataset['expanded'] === 'true') {
    return;
  }

  const applyPress = () => {
    if (card.dataset['expanded'] === 'true') {
      return;
    }

    addWillChange(card, ['transform']);
    card.style.setProperty('--card-scale', '0.98');
  };

  const releasePress = (event?: PointerEvent) => {
    card.style.setProperty('--card-scale', '1');

    if (card.dataset['expanded'] === 'true') {
      removeWillChange(card);
      return;
    }

    if (!event || event.pointerType !== 'mouse') {
      removeWillChange(card);
    }
  };

  card.addEventListener('pointerdown', (event) => {
    if (card.dataset['expanded'] === 'true') {
      return;
    }

    if (event.pointerType === 'mouse' || event.pointerType === 'touch' || event.pointerType === 'pen') {
      applyPress();
    }
  });

  card.addEventListener('pointerup', (event) => releasePress(event));
  card.addEventListener('pointerleave', () => releasePress());
  card.addEventListener('pointercancel', () => releasePress());
};

const setupTiltEffect = (card: HTMLElement) => {
  if (card.dataset['expanded'] === 'true') {
    return;
  }

  if (prefersReducedMotion()) {
    return;
  }

  const updateTilt = rafThrottle((event: PointerEvent) => {
    if (card.dataset['expanded'] === 'true') {
      return;
    }

    const rect = card.getBoundingClientRect();
    const relativeX = event.clientX - rect.left;
    const relativeY = event.clientY - rect.top;
    const rotateRange = 6;
    const rotateY = ((relativeX / rect.width) * 2 - 1) * rotateRange;
    const rotateX = ((relativeY / rect.height) * -2 + 1) * rotateRange;

    card.style.setProperty('--card-rotate-x', `${rotateX.toFixed(2)}deg`);
    card.style.setProperty('--card-rotate-y', `${rotateY.toFixed(2)}deg`);
    card.style.setProperty('--card-scale', '1.02');
  });

  const resetTilt = () => {
    updateTilt.cancel?.();
    card.style.setProperty('--card-rotate-x', '0deg');
    card.style.setProperty('--card-rotate-y', '0deg');
    card.style.setProperty('--card-scale', '1');
    removeWillChange(card);
  };

  card.addEventListener('pointerenter', (event) => {
    if (event.pointerType !== 'mouse' || card.dataset['expanded'] === 'true') {
      return;
    }

    addWillChange(card, ['transform']);
  });

  card.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse' || card.dataset['expanded'] === 'true') {
      return;
    }

    updateTilt(event);
  });

  card.addEventListener('pointerleave', resetTilt);
  card.addEventListener('pointercancel', resetTilt);

  card.addEventListener('focus', () => {
    if (card.dataset['expanded'] === 'true') {
      return;
    }

    addWillChange(card, ['transform']);
    card.style.setProperty('--card-scale', '1.02');
  });

  card.addEventListener('blur', resetTilt);
};

const initializeCard = (card: HTMLElement, index: number, reducedMotion: boolean) => {
  card.dataset['cardIndex'] = String(index);
  card.style.setProperty('--card-delay', `${Math.min(index * 80, 320)}ms`);

  registerCardListeners(card);
  setupThumbnail(card);
  setupTagListeners(card);
  setupPressFeedback(card);
  setupTiltEffect(card);

  if (!reducedMotion) {
    addWillChange(card, ['transform', 'opacity']);

    const handleAnimationEnd = () => {
      removeWillChange(card);
      card.removeEventListener('animationend', handleAnimationEnd);
    };

    card.addEventListener('animationend', handleAnimationEnd);
  } else {
    card.dataset['animated'] = 'true';
    card.classList.add('project-card--enter');
  }
};

export const attachProjectCardListeners = (): void => {
   const container = document.querySelector<HTMLElement>(PROJECT_CARDS_CONTAINER_SELECTOR);

   if (!container) {
     return;
   }

   const cards = Array.from(container.querySelectorAll<HTMLElement>(PROJECT_CARD_SELECTOR));

   if (cards.length === 0) {
     return;
   }

   const reducedMotion = prefersReducedMotion();

   cards.forEach((card, index) => {
     card.setAttribute('tabindex', card.getAttribute('tabindex') ?? '0');
     initializeCard(card, index, reducedMotion);
   });

   if (reducedMotion) {
     return;
   }

   observeIntersection(
     cards,
     (entries, observer) => {
       entries.forEach((entry) => {
         if (!entry.isIntersecting) {
           return;
         }

         const card = entry.target as HTMLElement;

         if (card.dataset['animated'] === 'true') {
           observer.unobserve(card);
           return;
         }

         card.dataset['animated'] = 'true';
         card.classList.add('project-card--enter');
         observer.unobserve(card);
       });
     },
     {
       rootMargin: '0px 0px -10% 0px',
       threshold: 0.2,
     }
   );

   // Immediately animate cards that are already in view on page load
   cards.forEach((card) => {
     if (card.dataset['animated'] === 'true') {
       return;
     }

     const rect = card.getBoundingClientRect();
     const isInView = rect.top < window.innerHeight && rect.bottom > 0;

     if (isInView) {
       card.dataset['animated'] = 'true';
       card.classList.add('project-card--enter');
     }
   });
 };
