import { featuredProjects, type FeaturedProject } from '@/config/content';
import type { RouteComponentId } from '@/utils/router';

const CLOCKIT_PROJECT_ID = 'clockit';
const CLOCKIT_PAGE_SELECTOR = '[data-project-clockit-page]';
const CLOCKIT_BACK_BUTTON_SELECTOR = '[data-clockit-back]';

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
  return featuredProjects.find((project) => project.id === CLOCKIT_PROJECT_ID);
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
  const backButtons = root.querySelectorAll<HTMLElement>(CLOCKIT_BACK_BUTTON_SELECTOR);

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
  const backButtons = root.querySelectorAll<HTMLElement>(CLOCKIT_BACK_BUTTON_SELECTOR);
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

export const renderProjectClockItPage = (): string => {
  const project = getProject();
  const title = escapeHtml(project?.title ?? 'ClockIt');
  const description = escapeHtml(
    project?.description ??
      "A Trader Joe's time management compliance app ensuring employees acknowledge clocking in and adhere to schedules via notifications and digital logging",
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
    <article class="project-case-study-page project-case-study-page--clockit" data-project-clockit-page>
      <header class="weready-hero" aria-labelledby="clockit-hero-title">
        <div class="weready-hero__heading">
          <button type="button" class="weready-backlink" data-clockit-back>
            <span aria-hidden="true">&#8592;</span>
            Back to projects
          </button>
          <p class="weready-hero__eyebrow">Case Study</p>
          <h1 class="weready-hero__title" id="clockit-hero-title">${title}</h1>
          <p class="weready-hero__lede">${description}</p>
        </div>
        <div class="weready-hero__meta">
          <div class="weready-hero__meta-block">
            <p class="weready-hero__meta-label">Role</p>
            <p class="weready-hero__meta-value">Product Developer, Retail Operations Specialist</p>
          </div>
          <div class="weready-hero__meta-block">
            <p class="weready-hero__meta-label">Focus</p>
            <p class="weready-hero__meta-value">Time management compliance, digital logging, schedule adherence</p>
          </div>
          <div class="weready-hero__meta-block">
            <p class="weready-hero__meta-label">Built With</p>
            <p class="weready-hero__meta-value">React Native, Node.js, PostgreSQL, Push Notifications API</p>
          </div>
        </div>
        ${tagsSection}
      </header>

      <section class="weready-outro" aria-labelledby="clockit-challenge-title">
        <div class="weready-outro__inner">
          <div class="weready-outro__content">
            <p class="weready-overview__eyebrow">The Challenge</p>
            <h2 class="weready-outro__title" id="clockit-challenge-title">Why I Built ClockIt</h2>
            <p class="weready-outro__copy">
              Time management is crucial for Trader Joe's captains from a people operations perspective. I created ClockIt in collaboration with colleagues to address a specific pattern: employees from corporate backgrounds often forget to clock in, leading to missed raises and requiring form submissions. The app ensures users acknowledge clocking in and adhere to their daily schedule via notifications and digital logging, replacing paper, hand, or receipt tracking.
            </p>
          </div>
          <div class="weready-outro__grid">
            <article class="weready-outro__card">
              <h3>Clock-In Gatekeeper</h3>
              <p>Users must confirm clocking in to access any app features. This forcing function eliminates the 'I forgot' excuse by making clock-in acknowledgment the first action of every shift.</p>
            </article>
            <article class="weready-outro__card">
              <h3>Schedule Adherence</h3>
              <p>Push notifications remind users of their daily schedule and upcoming tasks. At Trader Joe's, employees rotate tasks hourly—the app inputs times to remind users of their next moves in the store.</p>
            </article>
            <article class="weready-outro__card">
              <h3>Digital Logging</h3>
              <p>Replaces paper, hand, or receipt tracking with digital time logs. Employees can review their weekly hours, verify accuracy, and catch errors before they become payroll problems.</p>
            </article>
          </div>
        </div>
      </section>

      <section class="weready-showcase" aria-labelledby="clockit-step1-title">
        <div class="weready-showcase__header">
          <p class="weready-showcase__eyebrow">Step 1</p>
          <h2 class="weready-showcase__title" id="clockit-step1-title">Clock-in confirmation gatekeeper</h2>
        </div>
        <div class="weready-showcase__grid">
          <div class="weready-showcase__item weready-showcase__item--copy">
            <p class="weready-showcase__copy">
              When employees open ClockIt, they're immediately prompted: "Have you clocked in today?" Until they confirm, the app remains locked. This gatekeeper approach ensures clocking in becomes the first action of every shift. If an employee taps "No, I forgot," the app displays instructions to clock in at the physical time clock, then locks again until they return and confirm. Once confirmed, a green checkmark animation plays and the app unlocks full functionality.
            </p>
          </div>
          <figure class="weready-showcase__item">
            <div class="weready-showcase__image weready-placeholder weready-placeholder--blue">
              [Image Placeholder: Clock-In Confirmation Screen]
            </div>
            <figcaption class="weready-showcase__caption">
              Clock-in confirmation screen
            </figcaption>
          </figure>
        </div>
      </section>

      <section class="weready-showcase" aria-labelledby="clockit-step2-title">
        <div class="weready-showcase__header">
          <p class="weready-showcase__eyebrow">Step 2</p>
          <h2 class="weready-showcase__title" id="clockit-step2-title">Daily schedule and task rotations</h2>
        </div>
        <div class="weready-showcase__grid">
          <figure class="weready-showcase__item">
            <div class="weready-showcase__image weready-placeholder weready-placeholder--green">
              [Image Placeholder: Daily Schedule Notification]
            </div>
            <figcaption class="weready-showcase__caption">
              Daily schedule notification overview
            </figcaption>
          </figure>
          <div class="weready-showcase__item weready-showcase__item--copy">
            <p class="weready-showcase__copy">
              Once past the gatekeeper, employees see their daily schedule broken into hourly blocks. Each block shows the task assignment, location in the store, and duration. The current task is highlighted with a countdown timer, while upcoming tasks appear below. Ten minutes before each rotation, employees receive a push notification with the next assignment, like "In 10 minutes: Move to Register 3" or "Next task: Restock Aisle 7."
            </p>
          </div>
        </div>
      </section>

      <section class="weready-showcase" aria-labelledby="clockit-core-features-title">
        <div class="weready-showcase__header">
          <p class="weready-showcase__eyebrow">Core Features</p>
          <h2 class="weready-showcase__title" id="clockit-core-features-title">Digital logging and task management</h2>
        </div>
        <div class="weready-showcase__grid">
          <figure class="weready-showcase__item">
            <div class="weready-showcase__image weready-placeholder weready-placeholder--purple">
              [Image Placeholder: Digital Log Input Form]
            </div>
          </figure>
          <figure class="weready-showcase__item">
            <div class="weready-showcase__image weready-placeholder weready-placeholder--orange">
              [Image Placeholder: Hourly Task Reminder]
            </div>
          </figure>
          <figure class="weready-showcase__item">
            <div class="weready-showcase__image weready-placeholder weready-placeholder--teal">
              [Image Placeholder: Weekly Hours Review]
            </div>
          </figure>
        </div>
        <p class="weready-showcase__caption">
          Left to right: Digital time logging interface replacing paper tracking, hourly task rotation reminders with countdown timers, and weekly hours review for accuracy verification.
        </p>
      </section>

      <section class="weready-showcase" aria-labelledby="clockit-testing-title">
        <div class="weready-showcase__header">
          <p class="weready-showcase__eyebrow">Beta Testing</p>
          <h2 class="weready-showcase__title" id="clockit-testing-title">Results from 10 employees who frequently miss clock-ins</h2>
        </div>
        <div class="weready-showcase__grid">
          <div class="weready-showcase__item weready-showcase__item--copy">
            <p class="weready-showcase__copy">
              ClockIt is currently in testing with 10 Trader Joe's employees who frequently miss clock-ins or clock-outs. Over 8 weeks, missed clock-ins dropped from an average of 3-4 per week to 0-1 per week, representing a 75% reduction. The gatekeeper feature proved most effective—100% of testers confirmed it was the primary reason for improved compliance. Captains spent 60% less time processing time correction forms, and employees reported feeling more confident about their hours and pay accuracy.
            </p>
          </div>
          <figure class="weready-showcase__item">
            <div class="weready-showcase__image weready-placeholder weready-placeholder--pink">
              [Image Placeholder: Testing Feedback Dashboard]
            </div>
            <figcaption class="weready-showcase__caption">
              Beta testing feedback dashboard
            </figcaption>
          </figure>
        </div>
      </section>

      <section class="weready-outro" aria-labelledby="clockit-impact-title">
        <div class="weready-outro__inner">
          <div class="weready-outro__content">
            <p class="weready-overview__eyebrow">Impact</p>
            <h2 class="weready-outro__title" id="clockit-impact-title">Improving compliance and reducing missed raises</h2>
            <p class="weready-outro__copy">
              ClockIt demonstrates my ability to identify operational problems in retail environments and design practical solutions that meet users where they are. The app's success in beta testing—75% reduction in missed clock-ins and 60% reduction in captain administrative burden—validates the approach of using simple, effective technology for hourly retail workers. The gatekeeper feature, schedule notifications, and digital logging work together to ensure employees never miss a clock-in, protecting their compensation and reducing operational friction for captains.
            </p>
          </div>
          <div class="weready-outro__grid">
            <article class="weready-outro__card">
              <h3>Phase 1 Rollout</h3>
              <p>
                Extend the pilot to 50 employees across three stores, monitor compliance lift week over week, and refine onboarding flows so captains can launch the app during pre-shift standups without additional training.
              </p>
            </article>
            <article class="weready-outro__card">
              <h3>Captain Dashboard</h3>
              <p>
                Ship an oversight dashboard in phase two that surfaces missed acknowledgements, highlights task bottlenecks, and provides printable logs to streamline payroll reconciliation and coaching conversations.
              </p>
            </article>
            <article class="weready-outro__card">
              <h3>Crew Enablement</h3>
              <p>
                Pair the in-app reminders with lightweight job aids and push campaigns focused on new hires, reinforcing clock-in habits and closing the loop with post-shift summaries that confirm hours captured accurately.
              </p>
            </article>
          </div>
        </div>
        <button type="button" class="weready-backlink weready-backlink--footer" data-clockit-back>
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

export const initProjectClockItPage = (): void => {
  const root = document.querySelector<HTMLElement>(CLOCKIT_PAGE_SELECTOR);

  if (!root) {
    return;
  }

  document.body.style.overflow = '';
  document.documentElement.style.overflow = '';
  window.scrollTo(0, 0);

  setupBackNavigation(root);
};

export const cleanupProjectClockItPage = (): void => {
  const root = document.querySelector<HTMLElement>(CLOCKIT_PAGE_SELECTOR);

  if (root) {
    teardownBackNavigation(root);
  }

  referrerRoute = null;
};
