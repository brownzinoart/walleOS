import { featuredProjects, type FeaturedProject } from '@/config/content';
import type { RouteComponentId } from '@/utils/router';

const HQ_PROJECT_ID = 'hq';
const HQ_PAGE_SELECTOR = '[data-project-hq-page]';
const HQ_BACK_BUTTON_SELECTOR = '[data-hq-back]';

type BackButtonListener = (event: Event) => void;

let backButtonListener: BackButtonListener | null = null;
let referrerRoute: RouteComponentId | null = null;

const escapeHtml = (value: string): string => {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };

  return value.replace(/[&<>"']/g, (char) => map[char as keyof typeof map] ?? char);
};

const getProject = (): FeaturedProject | undefined => {
  return featuredProjects.find((project) => project.id === HQ_PROJECT_ID);
};

const renderTags = (tags: string[] = []): string => {
  if (!tags.length) {
    return '';
  }

  return tags
    .map((tag) => `<li class="weready-tag">${escapeHtml(tag)}</li>`)
    .join('');
};

const getBackDestination = (): RouteComponentId => {
  return referrerRoute === 'home' ? 'home' : 'projects';
};

const getBackLabel = (destination: RouteComponentId): string => {
  return destination === 'home' ? 'Back to home' : 'Back to projects';
};

const setupBackNavigation = (root: Element): void => {
  const backButtons = root.querySelectorAll<HTMLElement>(HQ_BACK_BUTTON_SELECTOR);

  if (!backButtons.length) {
    return;
  }

  const listener: BackButtonListener = async (event) => {
    event.preventDefault();
    const { navigateTo } = await import('@/utils/router');
    navigateTo(getBackDestination());
  };

  backButtons.forEach((element) => {
    const destination = getBackDestination();
    const label = getBackLabel(destination);

    element.setAttribute('aria-label', label);
    const textNode = Array.from(element.childNodes).find(
      (node) => node.nodeType === Node.TEXT_NODE,
    );
    if (textNode) {
      textNode.textContent = label;
    } else {
      element.append(label);
    }

    element.addEventListener('click', listener);
  });

  backButtonListener = listener;
};

const teardownBackNavigation = (root: Element): void => {
  const backButtons = root.querySelectorAll<HTMLElement>(HQ_BACK_BUTTON_SELECTOR);
  const listener = backButtonListener;

  if (!backButtons.length || !listener) {
    backButtonListener = null;
    return;
  }

  backButtons.forEach((element) => {
    element.removeEventListener('click', listener);
  });

  backButtonListener = null;
};

export const renderProjectHQPage = (): string => {
  const project = getProject();
  const title = escapeHtml(project?.title ?? 'HQ');
  const description = escapeHtml(
    project?.description ??
      'A webapp designed for myself and my business partner to communicate on the go and provide each other with up-to-the-minute updates organized by projects and initiatives',
  );
  const tagsMarkup = renderTags(project?.tags ?? []);
  const tagsSection = tagsMarkup
    ? `
        <div class="weready-hero__footer">
          <ul class="weready-hero__tags" aria-label="Project tags">
            ${tagsMarkup}
          </ul>
        </div>
      `
    : '';

  return `
    <article class="project-case-study-page project-case-study-page--hq" data-project-hq-page>
      <header class="weready-hero" aria-labelledby="hq-hero-title">
        <div class="weready-hero__heading">
          <button type="button" class="weready-backlink" data-hq-back>
            <span aria-hidden="true">&#8592;</span>
            Back to projects
          </button>
          <p class="weready-hero__eyebrow">Case Study</p>
          <h1 class="weready-hero__title" id="hq-hero-title">${title}</h1>
          <p class="weready-hero__lede">${description}</p>
        </div>
        <div class="weready-hero__meta">
          <div class="weready-hero__meta-block">
            <p class="weready-hero__meta-label">Role</p>
            <p class="weready-hero__meta-value">Product Developer, Business Operations Lead</p>
          </div>
          <div class="weready-hero__meta-block">
            <p class="weready-hero__meta-label">Focus</p>
            <p class="weready-hero__meta-value">Executive communication, sales pipeline visibility, project-based organization</p>
          </div>
          <div class="weready-hero__meta-block">
            <p class="weready-hero__meta-label">Built With</p>
            <p class="weready-hero__meta-value">React, Node.js, PostgreSQL, WebSocket API</p>
          </div>
        </div>
        ${tagsSection}
      </header>

      <section class="weready-outro" aria-labelledby="hq-challenge-title">
        <div class="weready-outro__inner">
          <div class="weready-outro__content">
            <p class="weready-overview__eyebrow">The Challenge</p>
            <h2 class="weready-outro__title" id="hq-challenge-title">Why I Built HQ</h2>
            <p class="weready-outro__copy">
              I needed a dedicated space for my CEO business partner to access the latest sales leads and deals information. HQ lets him review updates on his own time, see clear context on priorities, and make confident decisions without constant interruptions or scattered communication across chat, email, and spreadsheets.
            </p>
          </div>
          <div class="weready-outro__grid">
            <article class="weready-outro__card">
              <h3>Real-time Updates</h3>
              <p>Updates are organized by projects and initiatives for quick navigation, so the right context is always one click away.</p>
            </article>
            <article class="weready-outro__card">
              <h3>Sales Pipeline Visibility</h3>
              <p>Every lead and deal shows current status, priority, and next steps so decisions stay grounded in the latest data.</p>
            </article>
            <article class="weready-outro__card">
              <h3>Asynchronous Communication</h3>
              <p>The CEO can review and respond whenever he has focus time, reducing interruptions while keeping momentum high.</p>
            </article>
          </div>
        </div>
      </section>

      <section class="weready-showcase" aria-labelledby="hq-step1-title">
        <div class="weready-showcase__header">
          <p class="weready-showcase__eyebrow">Step 1</p>
          <h2 class="weready-showcase__title" id="hq-step1-title">Project-based organization system</h2>
        </div>
        <div class="weready-showcase__grid">
          <div class="weready-showcase__item weready-showcase__item--copy">
            <p class="weready-showcase__copy">
              HQ groups every update by project or initiative. Each section captures highlights, blockers, and requested decisions, so my partner can zero in on the workstream he cares about and understand the narrative without pinging me for missing context.
            </p>
          </div>
          <figure class="weready-showcase__item">
            <div class="weready-showcase__image weready-placeholder weready-placeholder--blue">
              [Image Placeholder: Project Organization View]
            </div>
            <figcaption class="weready-showcase__caption">
              Project-based update organization
            </figcaption>
          </figure>
        </div>
      </section>

      <section class="weready-showcase" aria-labelledby="hq-step2-title">
        <div class="weready-showcase__header">
          <p class="weready-showcase__eyebrow">Step 2</p>
          <h2 class="weready-showcase__title" id="hq-step2-title">Sales leads and deals dashboard</h2>
        </div>
        <div class="weready-showcase__grid">
          <figure class="weready-showcase__item">
            <div class="weready-showcase__image weready-placeholder weready-placeholder--green">
              [Image Placeholder: Sales Pipeline Dashboard]
            </div>
            <figcaption class="weready-showcase__caption">
              Sales pipeline visibility dashboard
            </figcaption>
          </figure>
          <div class="weready-showcase__item weready-showcase__item--copy">
            <p class="weready-showcase__copy">
              The dashboard centralizes every sales lead and deal: stage, owner, next action, and strategic priority. My partner can scan the pipeline, spot bottlenecks, and approve moves right away—no slide decks or ad hoc updates required.
            </p>
          </div>
        </div>
      </section>

      <section class="weready-showcase" aria-labelledby="hq-core-features-title">
        <div class="weready-showcase__header">
          <p class="weready-showcase__eyebrow">Core Features</p>
          <h2 class="weready-showcase__title" id="hq-core-features-title">Communication and visibility tools</h2>
        </div>
        <div class="weready-showcase__grid">
          <figure class="weready-showcase__item">
            <div class="weready-showcase__image weready-placeholder weready-placeholder--purple">
              [Image Placeholder: Update Composition Interface]
            </div>
          </figure>
          <figure class="weready-showcase__item">
            <div class="weready-showcase__image weready-placeholder weready-placeholder--orange">
              [Image Placeholder: Mobile Views]
            </div>
          </figure>
          <figure class="weready-showcase__item">
            <div class="weready-showcase__image weready-placeholder weready-placeholder--teal">
              [Image Placeholder: Notification Preferences]
            </div>
          </figure>
        </div>
        <p class="weready-showcase__caption">
          Left to right: Update composition interface for quick status sharing, mobile-optimized views for on-the-go access, and notification preferences for important updates.
        </p>
      </section>

      <section class="weready-showcase" aria-labelledby="hq-testing-title">
        <div class="weready-showcase__header">
          <p class="weready-showcase__eyebrow">Beta Testing</p>
          <h2 class="weready-showcase__title" id="hq-testing-title">Results from initial partner usage</h2>
        </div>
        <div class="weready-showcase__grid">
          <div class="weready-showcase__item weready-showcase__item--copy">
            <p class="weready-showcase__copy">
              During the first month of using HQ, decision turnaround time dropped from days to hours. We reduced standing syncs by half, and every critical update is documented in one place so we can reference history before jumping on a call.
            </p>
          </div>
          <figure class="weready-showcase__item">
            <div class="weready-showcase__image weready-placeholder weready-placeholder--pink">
              [Image Placeholder: Beta Testing Feedback]
            </div>
            <figcaption class="weready-showcase__caption">
              Feedback from initial partner testing
            </figcaption>
          </figure>
        </div>
      </section>

      <section class="weready-outro" aria-labelledby="hq-impact-title">
        <div class="weready-outro__inner">
          <div class="weready-outro__content">
            <p class="weready-overview__eyebrow">Impact</p>
            <h2 class="weready-outro__title" id="hq-impact-title">Enabling efficient executive communication</h2>
            <p class="weready-outro__copy">
              HQ gives my CEO business partner an isolated environment with the latest information on sales operations. He can consume updates, align on next moves, and provide approvals without waiting for a meeting, keeping our growth efforts moving quickly.
            </p>
          </div>
          <div class="weready-outro__grid">
            <article class="weready-outro__card">
              <h3>Phase 1 Rollout</h3>
              <p>Expand usage to additional partners and sales pods while refining notification settings for different urgency levels.</p>
            </article>
            <article class="weready-outro__card">
              <h3>Analytics Dashboard</h3>
              <p>Add insights into communication patterns, decision velocity, and engagement to spot where additional automation can help.</p>
            </article>
            <article class="weready-outro__card">
              <h3>Integration Expansion</h3>
              <p>Connect HQ with CRM systems and sales tools so updates can sync automatically and notify stakeholders instantly.</p>
            </article>
          </div>
        </div>
        <button type="button" class="weready-backlink weready-backlink--footer" data-hq-back>
          <span aria-hidden="true">&#8592;</span>
          Back to projects
        </button>
      </section>
    </article>
  `;
};

export const setReferrerRoute = (route: RouteComponentId | null): void => {
  referrerRoute = route;
};

export const initProjectHQPage = (): void => {
  const root = document.querySelector<HTMLElement>(HQ_PAGE_SELECTOR);

  if (!root) {
    return;
  }

  document.body.style.overflow = '';
  document.documentElement.style.overflow = '';
  window.scrollTo(0, 0);

  setupBackNavigation(root);
};

export const cleanupProjectHQPage = (): void => {
  const root = document.querySelector<HTMLElement>(HQ_PAGE_SELECTOR);

  if (root) {
    teardownBackNavigation(root);
  }

  referrerRoute = null;
};
