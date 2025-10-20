import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import LocomotiveScroll from 'locomotive-scroll';
import 'locomotive-scroll/dist/locomotive-scroll.css';

import { prefersReducedMotion } from '@/utils/performance';
import { featuredProjects } from '@/config/content';

gsap.registerPlugin(ScrollTrigger);

const WEREADY_PROJECT_ID = 'weready';
const WEREADY_PAGE_SELECTOR = '[data-project-weready-page]';
const WEREADY_SCROLL_CONTAINER_SELECTOR = '[data-weready-scroll-container]';
const WEREADY_BACK_BUTTON_SELECTOR = '[data-weready-back]';
const WEREADY_HORIZONTAL_SELECTOR = '[data-weready-horizontal]';
const WEREADY_HORIZONTAL_TRACK_SELECTOR = '[data-weready-horizontal-track]';

type LocomotiveInstance = InstanceType<typeof LocomotiveScroll>;

let locomotiveInstance: LocomotiveInstance | null = null;
let horizontalTween: gsap.core.Tween | null = null;
let refreshHandler: (() => void) | null = null;
let resizeHandler: (() => void) | null = null;
let backButtonListener: ((event: MouseEvent) => void) | null = null;
let wereadyTriggers: ScrollTrigger[] = [];

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const getProject = () => featuredProjects.find((project) => project.id === WEREADY_PROJECT_ID);

const renderTags = (tags: string[] = []): string => {
  if (!tags.length) {
    return '';
  }

  return tags
    .map((tag) => `<li class="weready-tag">${escapeHtml(tag)}</li>`)
    .join('');
};

export const renderProjectWeReadyPage = (): string => {
  const project = getProject();
  const heroTitle = project?.title ?? 'WeReady';
  const heroDescription = project?.description
    ?? 'WeReady is a readiness operating system that scores launch potential across code, capital, traction, and UX.';
  const projectUrl = project?.url ?? '';
  const tagsMarkup = renderTags(project?.tags ?? []);
  const imageOne = '/images/projects/weready/pic1.png';
  const imageTwo = '/images/projects/weready/pic2.png';
  const imageThree = '/images/projects/weready/pic3.png';

  const externalLinkMarkup = projectUrl
    ? `<a
          class="weready-cta"
          href="${escapeHtml(projectUrl)}"
          target="_blank"
          rel="noopener noreferrer"
        >
          View live build
        </a>`
    : '';

  return `
    <article class="project-weready-page" data-project-weready-page>
      <div class="weready-scroll" data-weready-scroll-container data-scroll-container>
        <header class="weready-hero" data-scroll-section>
          <div class="weready-hero__heading">
            <button type="button" class="weready-backlink" data-weready-back>
              <span aria-hidden="true">&#8592;</span>
              Back to projects
            </button>
            <p class="weready-hero__eyebrow">Case Study</p>
            <h1 class="weready-hero__title">${escapeHtml(heroTitle)}</h1>
            <p class="weready-hero__lede">${escapeHtml(heroDescription)}</p>
          </div>
          <div class="weready-hero__meta">
            <div class="weready-hero__meta-block">
              <p class="weready-hero__meta-label">Role</p>
              <p class="weready-hero__meta-value">Founder, Product Lead, Systems Design</p>
            </div>
            <div class="weready-hero__meta-block">
              <p class="weready-hero__meta-label">Focus</p>
              <p class="weready-hero__meta-value">Investor diligence, venture scoring, go-to-market automation</p>
            </div>
            <div class="weready-hero__meta-block">
              <p class="weready-hero__meta-label">Stack</p>
              <p class="weready-hero__meta-value">Next.js, Supabase, LangChain orchestration, Vercel Edge</p>
            </div>
          </div>
          <div class="weready-hero__footer">
            <ul class="weready-hero__tags" aria-label="Project tags">
              ${tagsMarkup}
            </ul>
            ${externalLinkMarkup}
          </div>
        </header>

        <section
          class="weready-horizontal"
          data-scroll-section
          data-weready-horizontal
          aria-labelledby="weready-horizontal-title"
        >
          <div class="weready-horizontal__track" data-weready-horizontal-track>
            <div class="weready-horizontal__intro">
              <p class="weready-horizontal__eyebrow">Readiness Operating System</p>
              <h2 class="weready-horizontal__title" id="weready-horizontal-title">
                Evidence-based scoring built for founder and investor trust
              </h2>
              <p class="weready-horizontal__copy">
                WeReady ingests 60+ operational signals—from repo health and shipment cadence to GTM math—to produce a weighted Launch Readiness Score. Every factor is transparent, traceable, and tuned around the questions that surface in diligence.
              </p>
              <ul class="weready-horizontal__list">
                <li>4 readiness pillars: product, revenue, momentum, trust</li>
                <li>Dynamic weights adjust for stage from idea → seed → Series A</li>
                <li>Flagging engine surfaces urgent gaps before investor meetings</li>
              </ul>
            </div>
            <figure class="weready-horizontal__panel" data-panel-index="01">
              <img src="${escapeHtml(imageOne)}" alt="WeReady dashboard showing readiness scores" loading="lazy" decoding="async" />
              <figcaption>Launch OS synthesizes qualitative intake, repo health, and market signals into a single executive view.</figcaption>
            </figure>
            <figure class="weready-horizontal__panel" data-panel-index="02">
              <img src="${escapeHtml(imageTwo)}" alt="Workflow builder for diligence automation" loading="lazy" decoding="async" />
              <figcaption>Operator workflows automate diligence requests, portfolio updates, and runway risk alerts.</figcaption>
            </figure>
            <figure class="weready-horizontal__panel" data-panel-index="03">
              <img src="${escapeHtml(imageThree)}" alt="Mobile view of readiness milestones" loading="lazy" decoding="async" />
              <figcaption>Mobile command center keeps founders and analysts aligned on what moves the score.</figcaption>
            </figure>
          </div>
        </section>

        <section class="weready-outro" data-scroll-section>
          <div class="weready-outro__inner">
            <div class="weready-outro__content">
              <h2 class="weready-outro__title">What the launch OS unlocks</h2>
              <p class="weready-outro__copy">
                WeReady packages diligence readiness into a calm, transparent toolkit founders and investors can trust. Every score ships with context, proof, and next moves so teams can close gaps fast.
              </p>
            </div>
            <div class="weready-outro__grid">
              <article class="weready-outro__card">
                <h3>Faster diligence loops</h3>
                <p>Investor rooms shift from guesswork to evidence-backed discussion. Readiness reports auto-assemble with Figma, GitHub, Linear, and Notion pipes.</p>
              </article>
              <article class="weready-outro__card">
                <h3>Operator-grade guidance</h3>
                <p>Each score comes with prescriptions: what hypothesis to validate, who to hire next, and which runway assumptions to stress-test.</p>
              </article>
              <article class="weready-outro__card">
                <h3>Ethical AI guardrails</h3>
                <p>In-product agents expose the context used. Every recommendation cites the source signal so founders stay in control.</p>
              </article>
            </div>
            <button type="button" class="weready-backlink weready-backlink--footer" data-weready-back>
              <span aria-hidden="true">&#8592;</span>
              Back to projects
            </button>
          </div>
        </section>
      </div>
    </article>
  `;
};

const setupBackNavigation = (root: HTMLElement) => {
  const backButtons = Array.from(root.querySelectorAll<HTMLButtonElement>(WEREADY_BACK_BUTTON_SELECTOR));

  if (!backButtons.length) {
    return;
  }

  const listener = (event: MouseEvent) => {
    event.preventDefault();
    import('@/utils/router').then(({ navigateTo }) => {
      navigateTo('projects');
    });
  };

  backButtons.forEach((button) => {
    button.addEventListener('click', listener);
  });

  backButtonListener = listener;
};

const teardownBackNavigation = (root: HTMLElement) => {
  const backButtons = Array.from(root.querySelectorAll<HTMLButtonElement>(WEREADY_BACK_BUTTON_SELECTOR));

  if (!backButtons.length || !backButtonListener) {
    return;
  }

  backButtons.forEach((button) => {
    button.removeEventListener('click', backButtonListener as EventListener);
  });

  backButtonListener = null;
};

const setupHorizontalScroll = (container: HTMLElement) => {
  const horizontalSection = container.querySelector<HTMLElement>(WEREADY_HORIZONTAL_SELECTOR);
  const track = container.querySelector<HTMLElement>(WEREADY_HORIZONTAL_TRACK_SELECTOR);
  if (!horizontalSection || !track) {
    return;
  }

  const panels = Array.from(track.querySelectorAll<HTMLElement>('.weready-horizontal__panel'));
  const intro = track.querySelector<HTMLElement>('.weready-horizontal__intro');

  if (!intro || panels.length === 0) {
    return;
  }

  const previousTrigger = horizontalTween?.scrollTrigger ?? null;

  horizontalTween?.kill();
  horizontalTween = null;

  if (previousTrigger) {
    wereadyTriggers = wereadyTriggers.filter((trigger) => trigger !== previousTrigger);
  }

  horizontalTween = gsap.to(track, {
    x: () => {
      const introWidth = intro.offsetWidth;
      const panelsWidth = panels.reduce((total, panel) => total + panel.offsetWidth, 0);
      const totalContentWidth = introWidth + panelsWidth;
      const travelDistance = totalContentWidth - window.innerWidth;
      return travelDistance > 0 ? -travelDistance : 0;
    },
    ease: 'none',
    scrollTrigger: {
      id: 'weready-horizontal',
      scroller: container,
      scrub: 0.8,
      trigger: horizontalSection,
      pin: true,
      start: 'top top',
      end: () => `+=${track.scrollWidth}`,
      anticipatePin: 0.8,
      invalidateOnRefresh: true,
    },
  });

  const horizontalTrigger = horizontalTween.scrollTrigger;

  if (horizontalTrigger) {
    wereadyTriggers.push(horizontalTrigger);
  }
};

export const initProjectWeReadyPage = (): void => {
  const root = document.querySelector<HTMLElement>(WEREADY_PAGE_SELECTOR);
  const container = root?.querySelector<HTMLElement>(WEREADY_SCROLL_CONTAINER_SELECTOR);

  if (!root || !container) {
    return;
  }

  setupBackNavigation(root);

  if (prefersReducedMotion()) {
    root.classList.add('weready-motion-reduced');
    return;
  }

  locomotiveInstance = new LocomotiveScroll({
    el: container,
    smooth: true,
    lerp: 0.12,
    multiplier: 0.9,
    smartphone: {
      smooth: false,
    },
    tablet: {
      smooth: false,
    },
  });

  locomotiveInstance.on('scroll', ScrollTrigger.update);

  ScrollTrigger.scrollerProxy(container, {
    scrollTop(value?: number) {
      if (typeof value === 'number') {
        locomotiveInstance?.scrollTo(value, { duration: 0, disableLerp: true });
        return;
      }

      return locomotiveInstance?.scroll?.instance?.scroll?.y ?? 0;
    },
    getBoundingClientRect() {
      return {
        left: 0,
        top: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      };
    },
    pinType: container.style.transform ? 'transform' : 'fixed',
  });

  setupHorizontalScroll(container);

  refreshHandler = () => {
    locomotiveInstance?.update();
  };
  ScrollTrigger.addEventListener('refresh', refreshHandler);

  resizeHandler = () => {
    requestAnimationFrame(() => {
      setupHorizontalScroll(container);
      ScrollTrigger.refresh();
    });
  };

  window.addEventListener('resize', resizeHandler);

  requestAnimationFrame(() => {
    ScrollTrigger.refresh();
  });
};

export const cleanupProjectWeReadyPage = (): void => {
  const root = document.querySelector<HTMLElement>(WEREADY_PAGE_SELECTOR);

  if (root) {
    teardownBackNavigation(root);
  }

  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler);
    resizeHandler = null;
  }

  if (refreshHandler) {
    ScrollTrigger.removeEventListener('refresh', refreshHandler);
    refreshHandler = null;
  }

  wereadyTriggers.forEach((trigger) => trigger.kill());
  wereadyTriggers = [];

  horizontalTween?.kill();
  horizontalTween = null;

  if (locomotiveInstance) {
    locomotiveInstance.destroy();
    locomotiveInstance = null;
  }

  ScrollTrigger.refresh();
};
