import { featuredProjects } from '@/config/content';
import {
  caseStudyContent,
  type CaseStudyId,
  type CaseStudyToolkitCard,
} from '@/config/caseStudies';
import { escapeHtml } from '@/utils/dom';
import type { RouteComponentId } from '@/utils/router';

type BackListener = (event: MouseEvent) => void;

const CASE_STUDY_BACK_SELECTOR = '[data-case-study-back]';

const referrerRoutes = new Map<CaseStudyId, RouteComponentId | null>();
const backListeners = new Map<CaseStudyId, BackListener>();

const getProject = (id: CaseStudyId) =>
  featuredProjects.find((project) => project.id === id) ?? null;

const renderTags = (tags: string[] = []): string => {
  if (!tags.length) {
    return '';
  }

  return tags
    .map((tag) => `<li class="weready-tag">${escapeHtml(tag)}</li>`)
    .join('');
};

const renderMetaBlocks = (meta: { label: string; value: string }[]): string =>
  meta
    .map(
      (item) => `
          <div class="weready-hero__meta-block">
            <p class="weready-hero__meta-label">${escapeHtml(item.label)}</p>
            <p class="weready-hero__meta-value">${escapeHtml(item.value)}</p>
          </div>
        `,
    )
    .join('');

const renderSimpleCards = (cards: { title: string; description: string }[]): string =>
  cards
    .map(
      (card) => `
            <article class="weready-outro__card">
              <h3>${escapeHtml(card.title)}</h3>
              <p>${escapeHtml(card.description)}</p>
            </article>
          `,
    )
    .join('');

const renderOverviewCards = (cards: { title: string; description: string }[]): string =>
  cards
    .map(
      (card) => `
          <article class="weready-overview__card">
            <h3>${escapeHtml(card.title)}</h3>
            <p>${escapeHtml(card.description)}</p>
          </article>
        `,
    )
    .join('');

const renderToolkitIcon = (card: CaseStudyToolkitCard): string => {
  if (card.icon.type === 'image') {
    return `<img class="case-study-icon case-study-icon--image" src="${escapeHtml(card.icon.src)}" alt="${escapeHtml(card.icon.alt)}" loading="lazy" />`;
  }

  const [start, end] = card.icon.colors;
  const textColor = card.icon.textColor ?? '#ffffff';
  return `
    <div
      class="case-study-icon case-study-icon--gradient"
      style="--case-study-icon-start: ${escapeHtml(start)}; --case-study-icon-end: ${escapeHtml(end)}; --case-study-icon-color: ${escapeHtml(textColor)};"
      aria-hidden="true"
    >
      ${escapeHtml(card.icon.label)}
    </div>
  `;
};

const renderToolkitCards = (cards: CaseStudyToolkitCard[]): string =>
  cards
    .map(
      (card) => `
          <article class="weready-overview__card">
            ${renderToolkitIcon(card)}
            <h3>${escapeHtml(card.title)}</h3>
            <p>${escapeHtml(card.description)}</p>
          </article>
        `,
    )
    .join('');

const renderMilestones = (
  milestones: {
    number: string;
    title: string;
    copyHtml: string;
    stats: { label: string; value: string }[];
  }[],
): string =>
  milestones
    .map(
      (milestone) => `
            <article class="weready-process__milestone">
              <div class="weready-process__milestone-label">
                <span class="weready-process__milestone-number">${escapeHtml(milestone.number)}</span>
                <h3 class="weready-process__milestone-title">${escapeHtml(milestone.title)}</h3>
              </div>
              <div class="weready-process__milestone-content">
                <p>${milestone.copyHtml}</p>
                <ul class="weready-process__milestone-stats">
                  ${milestone.stats
                    .map(
                      (stat) => `
                      <li><strong>${escapeHtml(stat.label)}</strong> ${escapeHtml(stat.value)}</li>
                    `,
                    )
                    .join('')}
                </ul>
              </div>
            </article>
          `,
    )
    .join('');

const renderShowcaseItems = (
  items: { image: string; alt: string; caption: string }[],
): string =>
  items
    .map(
      (item) => `
          <figure class="weready-showcase__item">
            <img
              src="${escapeHtml(item.image)}"
              alt="${escapeHtml(item.alt)}"
              class="weready-showcase__image"
              loading="lazy"
              decoding="async"
            />
            <figcaption class="weready-showcase__caption">
              ${escapeHtml(item.caption)}
            </figcaption>
          </figure>
        `,
    )
    .join('');

const buildSectionId = (projectId: CaseStudyId, suffix: string) => `${projectId}-${suffix}`;

export const renderProjectCaseStudyPage = (projectId: CaseStudyId): string => {
  const content = caseStudyContent[projectId];
  const project = getProject(projectId);
  const heroTitle = escapeHtml(project?.title ?? content.heroTitleFallback);
  const heroDescription = escapeHtml(
    project?.description ?? content.heroDescriptionFallback,
  );
  const projectUrl = project?.url ?? '';
  const tagsMarkup = renderTags(project?.tags ?? []);
  const metaMarkup = renderMetaBlocks(content.heroMeta);
  const externalLinkMarkup = projectUrl
    ? `
          <a
            class="weready-cta"
            href="${escapeHtml(projectUrl)}"
            target="_blank"
            rel="noopener noreferrer"
          >
            View live build
          </a>
        `
    : '';

  const capabilitiesId = buildSectionId(projectId, 'capabilities-title');
  const toolkitId = buildSectionId(projectId, 'tools-title');
  const processId = buildSectionId(projectId, 'process-title');
  const showcaseId = buildSectionId(projectId, 'showcase-title');

  const overviewSection = content.overview ? `
    <section class="weready-outro">
      <div class="weready-outro__inner">
        <div class="weready-outro__content">
          <p class="weready-overview__eyebrow">${escapeHtml(content.overview.eyebrow)}</p>
          <h2 class="weready-outro__title">${escapeHtml(content.overview.title)}</h2>
          ${content.overview.copyHtml ? `<p class="weready-outro__copy">${content.overview.copyHtml}</p>` : ''}
        </div>
        ${content.overview.cards ? `<div class="weready-outro__grid">${renderSimpleCards(content.overview.cards)}</div>` : ''}
      </div>
    </section>
  ` : '';

  return `
    <article class="project-case-study-page project-case-study-page--${projectId}" data-project-case-study-page="${projectId}">
      <header class="weready-hero">
        <div class="weready-hero__heading">
          <button type="button" class="weready-backlink" data-case-study-back="${projectId}">
            <span aria-hidden="true">&#8592;</span>
            Back to projects
          </button>
          <p class="weready-hero__eyebrow">${escapeHtml(content.heroEyebrow)}</p>
          <h1 class="weready-hero__title">${heroTitle}</h1>
          <p class="weready-hero__lede">${heroDescription}</p>
        </div>
        <div class="weready-hero__meta">
          ${metaMarkup}
        </div>
        <div class="weready-hero__footer">
          <ul class="weready-hero__tags" aria-label="Project tags">
            ${tagsMarkup}
          </ul>
          ${externalLinkMarkup}
        </div>
      </header>

      ${overviewSection}

      <section class="weready-outro">
        <div class="weready-outro__inner">
          <div class="weready-outro__content">
            <p class="weready-overview__eyebrow">${escapeHtml(content.problem.eyebrow)}</p>
            <h2 class="weready-outro__title">${escapeHtml(content.problem.title)}</h2>
            <p class="weready-outro__copy">
              ${content.problem.copyHtml}
            </p>
          </div>
          <div class="weready-outro__grid">
            ${renderSimpleCards(content.problem.cards)}
          </div>
        </div>
      </section>

      <section class="weready-overview" aria-labelledby="${capabilitiesId}">
        <div class="weready-overview__header">
          <p class="weready-overview__eyebrow">${escapeHtml(content.capabilities.eyebrow)}</p>
          <h2 class="weready-overview__title" id="${capabilitiesId}">
            ${escapeHtml(content.capabilities.title)}
          </h2>
        </div>
        <div class="weready-overview__grid">
          ${renderOverviewCards(content.capabilities.cards)}
        </div>
      </section>

      <section class="weready-overview" aria-labelledby="${toolkitId}">
        <div class="weready-overview__header">
          <p class="weready-overview__eyebrow">${escapeHtml(content.toolkit.eyebrow)}</p>
          <h2 class="weready-overview__title" id="${toolkitId}">
            ${escapeHtml(content.toolkit.title)}
          </h2>
        </div>
        <div class="weready-overview__grid">
          ${renderToolkitCards(content.toolkit.cards)}
        </div>
      </section>

      <section class="weready-process" aria-labelledby="${processId}">
        <div class="weready-process__inner">
          <div class="weready-process__header">
            <p class="weready-process__eyebrow">${escapeHtml(content.process.eyebrow)}</p>
            <h2 class="weready-process__title" id="${processId}">
              ${escapeHtml(content.process.title)}
            </h2>
            <p class="weready-process__lede">
              ${escapeHtml(content.process.lede)}
            </p>
          </div>
          <div class="weready-process__timeline">
            ${renderMilestones(content.process.milestones)}
          </div>
        </div>
      </section>

      <section class="weready-showcase" aria-labelledby="${showcaseId}">
        <div class="weready-showcase__header">
          <p class="weready-showcase__eyebrow">${escapeHtml(content.showcase.eyebrow)}</p>
          <h2 class="weready-showcase__title" id="${showcaseId}">
            ${escapeHtml(content.showcase.title)}
          </h2>
        </div>
        <div class="weready-showcase__grid">
          ${renderShowcaseItems(content.showcase.items)}
        </div>
      </section>

      <section class="weready-outro">
        <div class="weready-outro__inner">
          <div class="weready-outro__content">
            <p class="weready-overview__eyebrow">${escapeHtml(content.results.eyebrow)}</p>
            <h2 class="weready-outro__title">${escapeHtml(content.results.title)}</h2>
            <p class="weready-outro__copy">
              ${content.results.copyHtml}
            </p>
          </div>
          <div class="weready-outro__grid">
            ${renderSimpleCards(content.results.cards)}
          </div>
          <button type="button" class="weready-backlink weready-backlink--footer" data-case-study-back="${projectId}">
            <span aria-hidden="true">&#8592;</span>
            Back to projects
          </button>
        </div>
      </section>
    </article>
  `;
};

const resolveBackDestination = (
  projectId: CaseStudyId,
  contentFallback: RouteComponentId,
): RouteComponentId => {
  const referrer = referrerRoutes.get(projectId);
  if (referrer === 'home') {
    return 'home';
  }

  return contentFallback;
};

const updateBackButtonLabels = (
  buttons: HTMLButtonElement[],
  label: string,
) => {
  buttons.forEach((button) => {
    const textNode = Array.from(button.childNodes).find(
      (node) => node.nodeType === Node.TEXT_NODE,
    );
    if (textNode) {
      textNode.textContent = label;
    }
  });
};

const setupBackNavigation = (projectId: CaseStudyId, root: HTMLElement) => {
  const buttons = Array.from(
    root.querySelectorAll<HTMLButtonElement>(CASE_STUDY_BACK_SELECTOR),
  ).filter((button) => button.dataset['caseStudyBack'] === projectId);

  if (!buttons.length) {
    return;
  }

  const content = caseStudyContent[projectId];
  const destination = resolveBackDestination(projectId, content.backLinkFallback);
  const label = destination === 'home' ? 'Back to home' : 'Back to projects';

  updateBackButtonLabels(buttons, label);

  const listener: BackListener = (event) => {
    event.preventDefault();
    import('@/utils/router').then(({ navigateTo }) => {
      navigateTo(destination);
    });
  };

  buttons.forEach((button) => {
    button.addEventListener('click', listener);
  });

  backListeners.set(projectId, listener);
};

const teardownBackNavigation = (projectId: CaseStudyId, root: HTMLElement) => {
  const listener = backListeners.get(projectId);
  if (!listener) {
    return;
  }

  const buttons = Array.from(
    root.querySelectorAll<HTMLButtonElement>(CASE_STUDY_BACK_SELECTOR),
  ).filter((button) => button.dataset['caseStudyBack'] === projectId);

  buttons.forEach((button) => {
    button.removeEventListener('click', listener);
  });

  backListeners.delete(projectId);
};

export const setCaseStudyReferrerRoute = (
  projectId: CaseStudyId,
  route: RouteComponentId | null,
): void => {
  referrerRoutes.set(projectId, route);
};

export const initProjectCaseStudyPage = (projectId: CaseStudyId): void => {
  const root = document.querySelector<HTMLElement>(
    `[data-project-case-study-page="${projectId}"]`,
  );

  if (!root) {
    return;
  }

  document.body.style.overflow = '';
  document.documentElement.style.overflow = '';
  window.scrollTo(0, 0);

  setupBackNavigation(projectId, root);
};

export const cleanupProjectCaseStudyPage = (projectId: CaseStudyId): void => {
  const root = document.querySelector<HTMLElement>(
    `[data-project-case-study-page="${projectId}"]`,
  );

  if (root) {
    teardownBackNavigation(projectId, root);
  }

  referrerRoutes.set(projectId, null);
};
