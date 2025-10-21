import { featuredProjects } from '@/config/content';

const WEREADY_PROJECT_ID = 'weready';
const WEREADY_PAGE_SELECTOR = '[data-project-weready-page]';
const WEREADY_BACK_BUTTON_SELECTOR = '[data-weready-back]';

let backButtonListener: ((event: MouseEvent) => void) | null = null;
let referrerRoute: string | null = null;

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
      <header class="weready-hero">
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

      <section class="weready-overview" aria-labelledby="weready-overview-title">
        <div class="weready-overview__header">
          <p class="weready-overview__eyebrow">Readiness Operating System</p>
          <h2 class="weready-overview__title" id="weready-overview-title">
            Evidence-based scoring built for founder and investor trust
          </h2>
        </div>
        <div class="weready-overview__grid">
          <article class="weready-overview__card">
            <h3>Evidence-based scoring</h3>
            <p>WeReady ingests 60+ operational signals—from repo health and shipment cadence to GTM math—to produce a weighted Launch Readiness Score.</p>
          </article>
          <article class="weready-overview__card">
            <h3>Transparent methodology</h3>
            <p>Every factor is transparent, traceable, and tuned around the questions that surface in diligence. 4 readiness pillars: product, revenue, momentum, trust.</p>
          </article>
          <article class="weready-overview__card">
            <h3>Stage-adaptive weights</h3>
            <p>Dynamic weights adjust for stage from idea → seed → Series A, ensuring relevant metrics for each phase of growth.</p>
          </article>
          <article class="weready-overview__card">
            <h3>Gap flagging engine</h3>
            <p>Automated flagging surfaces urgent gaps before investor meetings, with prescriptive guidance on what to fix first.</p>
          </article>
        </div>
      </section>

      <section class="weready-process" aria-labelledby="weready-process-title">
        <div class="weready-process__inner">
          <div class="weready-process__header">
            <p class="weready-process__eyebrow">Problem → Solution</p>
            <h2 class="weready-process__title" id="weready-process-title">
              How WeReady came to be
            </h2>
            <p class="weready-process__lede">
              From self-taught founder struggling with investor readiness to building the tool that turns codebases into business intelligence.
            </p>
          </div>
          <div class="weready-process__timeline">
            <article class="weready-process__milestone">
              <div class="weready-process__milestone-label">
                <span class="weready-process__milestone-number">01</span>
                <h3 class="weready-process__milestone-title">The problem</h3>
              </div>
              <div class="weready-process__milestone-content">
                <p>AI-first founder in uncharted territory, needing a gut-check for investor readiness. Existing tools only checked AI code quality—nothing evaluated the full picture.</p>
                <ul class="weready-process__milestone-stats">
                  <li><strong>Gap identified:</strong> No holistic readiness platform</li>
                  <li><strong>Context:</strong> Self-taught, learning to "speak code"</li>
                </ul>
              </div>
            </article>
            <article class="weready-process__milestone">
              <div class="weready-process__milestone-label">
                <span class="weready-process__milestone-number">02</span>
                <h3 class="weready-process__milestone-title">The insight</h3>
              </div>
              <div class="weready-process__milestone-content">
                <p>Codebases reveal far more than code quality—they're windows into business strategy, design systems, architectural decisions, testing philosophy, and deployment maturity.</p>
                <ul class="weready-process__milestone-stats">
                  <li><strong>Discovery:</strong> Code as business intelligence</li>
                  <li><strong>Approach:</strong> Extract multi-dimensional signals</li>
                </ul>
              </div>
            </article>
            <article class="weready-process__milestone">
              <div class="weready-process__milestone-label">
                <span class="weready-process__milestone-number">03</span>
                <h3 class="weready-process__milestone-title">The build</h3>
              </div>
              <div class="weready-process__milestone-content">
                <p>Started prototyping an evidence-based scoring system that ingests 60+ operational signals across product, revenue, momentum, and trust pillars.</p>
                <ul class="weready-process__milestone-stats">
                  <li><strong>Methodology:</strong> Transparent, traceable, stage-adaptive</li>
                  <li><strong>Status:</strong> Testing with AI-first founders & investors</li>
                </ul>
              </div>
            </article>
            <article class="weready-process__milestone">
              <div class="weready-process__milestone-label">
                <span class="weready-process__milestone-number">04</span>
                <h3 class="weready-process__milestone-title">The outcome</h3>
              </div>
              <div class="weready-process__milestone-content">
                <p>WeReady transforms diligence from weeks of manual review into automated, evidence-backed readiness reports that both founders and investors trust.</p>
                <ul class="weready-process__milestone-stats">
                  <li><strong>Impact:</strong> Faster diligence, clearer gaps, higher trust</li>
                  <li><strong>Differentiator:</strong> Only platform scoring launch readiness holistically</li>
                </ul>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section class="weready-showcase" aria-labelledby="weready-showcase-title">
        <div class="weready-showcase__header">
          <p class="weready-showcase__eyebrow">Visual Walkthrough</p>
          <h2 class="weready-showcase__title" id="weready-showcase-title">
            From dashboard to diligence
          </h2>
        </div>
        <div class="weready-showcase__grid">
          <figure class="weready-showcase__item">
            <img
              src="${escapeHtml(imageOne)}"
              alt="WeReady dashboard showing readiness scores"
              class="weready-showcase__image"
              loading="lazy"
              decoding="async"
            />
            <figcaption class="weready-showcase__caption">
              Launch OS synthesizes qualitative intake, repo health, and market signals into a single executive view.
            </figcaption>
          </figure>
          <figure class="weready-showcase__item">
            <img
              src="${escapeHtml(imageTwo)}"
              alt="Workflow builder for diligence automation"
              class="weready-showcase__image"
              loading="lazy"
              decoding="async"
            />
            <figcaption class="weready-showcase__caption">
              Operator workflows automate diligence requests, portfolio updates, and runway risk alerts.
            </figcaption>
          </figure>
          <figure class="weready-showcase__item">
            <img
              src="${escapeHtml(imageThree)}"
              alt="Mobile view of readiness milestones"
              class="weready-showcase__image"
              loading="lazy"
              decoding="async"
            />
            <figcaption class="weready-showcase__caption">
              Mobile command center keeps founders and analysts aligned on what moves the score.
            </figcaption>
          </figure>
        </div>
      </section>

      <section class="weready-outro">
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
    </article>
  `;
};

const getBackDestination = (): string => {
  return referrerRoute === 'home' ? 'home' : 'projects';
};

const getBackLabel = (): string => {
  const destination = getBackDestination();
  return destination === 'home' ? 'Back to home' : 'Back to projects';
};

const setupBackNavigation = (root: HTMLElement) => {
  const backButtons = Array.from(root.querySelectorAll<HTMLButtonElement>(WEREADY_BACK_BUTTON_SELECTOR));

  if (!backButtons.length) {
    return;
  }

  // Update button labels based on destination
  const label = getBackLabel();
  backButtons.forEach((button) => {
    const textNode = Array.from(button.childNodes).find(
      (node) => node.nodeType === Node.TEXT_NODE
    );
    if (textNode) {
      textNode.textContent = label;
    }
  });

  const listener = (event: MouseEvent) => {
    event.preventDefault();
    import('@/utils/router').then(({ navigateTo }) => {
      const destination = getBackDestination();
      navigateTo(destination);
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

export const setReferrerRoute = (route: string): void => {
  referrerRoute = route;
};

export const initProjectWeReadyPage = (): void => {
  const root = document.querySelector<HTMLElement>(WEREADY_PAGE_SELECTOR);

  if (!root) {
    return;
  }

  setupBackNavigation(root);
};

export const cleanupProjectWeReadyPage = (): void => {
  const root = document.querySelector<HTMLElement>(WEREADY_PAGE_SELECTOR);

  if (root) {
    teardownBackNavigation(root);
  }

  // Clear referrer route on cleanup
  referrerRoute = null;
};
