import { featuredProjects } from '@/config/content';

const ECHO_PROJECT_ID = 'echo';
const ECHO_PAGE_SELECTOR = '[data-project-echo-page]';
const ECHO_BACK_BUTTON_SELECTOR = '[data-echo-back]';

let backButtonListener: ((event: MouseEvent) => void) | null = null;
let referrerRoute: string | null = null;

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const getProject = () => featuredProjects.find((project) => project.id === ECHO_PROJECT_ID);

const renderTags = (tags: string[] = []): string => {
  if (!tags.length) {
    return '';
  }

  return tags
    .map((tag) => `<li class="weready-tag">${escapeHtml(tag)}</li>`)
    .join('');
};

export const renderProjectEchoPage = (): string => {
  const project = getProject();
  const heroTitle = project?.title ?? 'Echo';
  const heroDescription = project?.description
    ?? 'Submission-ready screenshots, in minutes. Echo is a SaaS platform that automates screenshot capture and accelerates route preparation and QA for pharmaceutical websites.';
  const projectUrl = project?.url ?? '';
  const tagsMarkup = renderTags(project?.tags ?? []);
  const imageOne = '/images/projects/echo/pic1.png';
  const imageTwo = '/images/projects/echo/pic2.png';
  const imageThree = '/images/projects/echo/pic3.png';

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
    <article class="project-echo-page" data-project-echo-page>
      <header class="weready-hero">
        <div class="weready-hero__heading">
          <button type="button" class="weready-backlink" data-echo-back>
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
            <p class="weready-hero__meta-value">Partner, Technical Architect, Pharma Automation Specialist</p>
          </div>
          <div class="weready-hero__meta-block">
            <p class="weready-hero__meta-label">Focus</p>
            <p class="weready-hero__meta-value">Screenshot automation, MLR compliance, pharmaceutical QA workflows</p>
          </div>
          <div class="weready-hero__meta-block">
            <p class="weready-hero__meta-label">Built With</p>
            <p class="weready-hero__meta-value">Claude Code + Codex CLI + Traycer.ai orchestration, Puppeteer, Node.js, AWS</p>
          </div>
        </div>
        <div class="weready-hero__footer">
          <ul class="weready-hero__tags" aria-label="Project tags">
            ${tagsMarkup}
          </ul>
          ${externalLinkMarkup}
        </div>
      </header>

      <!-- Why I Built This Section -->
      <section class="weready-outro">
        <div class="weready-outro__inner">
          <div class="weready-outro__content">
            <p class="weready-overview__eyebrow">The Problem</p>
            <h2 class="weready-outro__title">Why I Built Echo</h2>
            <p class="weready-outro__copy">
              After years in pharma advertising, I witnessed teams spending 8+ hours manually capturing screenshots for MLR submissions. The process was tedious, error-prone, and delayed project launches. I knew automation could transform this workflow.
            </p>
          </div>
          <div class="weready-outro__grid">
            <article class="weready-outro__card">
              <h3>Manual Screenshot Hell</h3>
              <p>Teams manually capture 100+ screenshots across devices, dealing with animations, interactive elements, and precise framing requirements</p>
            </article>
            <article class="weready-outro__card">
              <h3>MLR Submission Delays</h3>
              <p>Route preparation bottlenecks delayed project launches by days or weeks, impacting client relationships and revenue</p>
            </article>
            <article class="weready-outro__card">
              <h3>QA Complexity</h3>
              <p>Testing forms, error states, and dynamic content like ISI trays required repetitive manual work across multiple breakpoints</p>
            </article>
          </div>
        </div>
      </section>

      <section class="weready-overview" aria-labelledby="echo-capabilities-title">
        <div class="weready-overview__header">
          <p class="weready-overview__eyebrow">Pharma Screenshot Automation</p>
          <h2 class="weready-overview__title" id="echo-capabilities-title">
            Complete route preparation in minutes, not hours
          </h2>
        </div>
        <div class="weready-overview__grid">
          <article class="weready-overview__card">
            <h3>Lightning-Fast Capture</h3>
            <p>~100 screenshots in under 5 minutes across desktop/tablet/mobile, perfectly framed with padding. No extensions or stitching required.</p>
          </article>
          <article class="weready-overview__card">
            <h3>Project Settings Management</h3>
            <p>Configure environments (staging/production), customize breakpoints, margins, and credentials for seamless automation.</p>
          </article>
          <article class="weready-overview__card">
            <h3>Global Project Conditioning</h3>
            <p>IF/THEN logic handles animations and interactive elements with reposition, expand, and delay controls.</p>
          </article>
          <article class="weready-overview__card">
            <h3>Page-Level Customization</h3>
            <p>Reorder, add, or remove pages; apply clicks, hovers, delays—no code required for complete control.</p>
          </article>
        </div>
      </section>

      <section class="weready-overview" aria-labelledby="echo-tools-title">
        <div class="weready-overview__header">
          <p class="weready-overview__eyebrow">AI Agent Orchestration Toolkit</p>
          <h2 class="weready-overview__title" id="echo-tools-title">
            Tools Used
          </h2>
        </div>
        <div class="weready-overview__grid">
          <article class="weready-overview__card">
            <img src="https://assets-global.website-files.com/6500ed5c1fd67be80b31c5c9/659a7b05e0e3d8b84ee12cc9_Claude_Logo.svg" alt="Claude AI" style="width: 48px; height: 48px; margin-bottom: 1rem;" loading="lazy" />
            <h3>Claude Code CLI</h3>
            <p>Pharma workflow analysis and automation architecture design</p>
          </article>
          <article class="weready-overview__card">
            <img src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" alt="GitHub Codex" style="width: 48px; height: 48px; margin-bottom: 1rem;" loading="lazy" />
            <h3>Codex CLI</h3>
            <p>Screenshot pipeline and browser automation implementation</p>
          </article>
          <article class="weready-overview__card">
            <img src="https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg" alt="Google Gemini" style="width: 48px; height: 48px; margin-bottom: 1rem;" loading="lazy" />
            <h3>Gemini + Traycer.ai</h3>
            <p>System architecture and pharmaceutical compliance planning</p>
          </article>
          <article class="weready-overview__card">
            <img src="https://ollama.com/public/ollama.png" alt="Ollama" style="width: 48px; height: 48px; margin-bottom: 1rem;" loading="lazy" />
            <h3>Ollama</h3>
            <p>Local testing and optimization for screenshot quality</p>
          </article>
          <article class="weready-overview__card">
            <img src="https://code.visualstudio.com/assets/images/code-stable.png" alt="VS Code" style="width: 48px; height: 48px; margin-bottom: 1rem;" loading="lazy" />
            <h3>VS Code + Roo</h3>
            <p>Integrated development environment with AI assistance</p>
          </article>
          <article class="weready-overview__card">
            <div style="width: 48px; height: 48px; margin-bottom: 1rem; background: linear-gradient(45deg, #0353a4, #00c6ff); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">Rx</div>
            <h3>Pharma Workflow</h3>
            <p>Route Analysis → Screenshot Capture → Quality Check → MLR Package using specialized automation</p>
          </article>
        </div>
      </section>

      <section class="weready-process" aria-labelledby="echo-process-title">
        <div class="weready-process__inner">
          <div class="weready-process__header">
            <p class="weready-process__eyebrow">AI Agent Orchestration</p>
            <h2 class="weready-process__title" id="echo-process-title">
              How I built Echo using multi-agent coordination
            </h2>
            <p class="weready-process__lede">
              From identifying pharma screenshot pain points to orchestrating Claude Code, Codex CLI, and Traycer.ai to build a production-ready automation platform.
            </p>
          </div>
          <div class="weready-process__timeline">
            <article class="weready-process__milestone">
              <div class="weready-process__milestone-label">
                <span class="weready-process__milestone-number">01</span>
                <h3 class="weready-process__milestone-title">Pharma Workflow Research</h3>
              </div>
              <div class="weready-process__milestone-content">
                <p>I used <strong>Traycer.ai</strong> to analyze pharma route preparation workflows and identify automation opportunities in the MLR submission process.</p>
                <ul class="weready-process__milestone-stats">
                  <li><strong>Research Tool:</strong> Traycer.ai for pharma workflow analysis</li>
                  <li><strong>Focus:</strong> Pain points in manual screenshot capture</li>
                </ul>
              </div>
            </article>
            <article class="weready-process__milestone">
              <div class="weready-process__milestone-label">
                <span class="weready-process__milestone-number">02</span>
                <h3 class="weready-process__milestone-title">Automation Architecture</h3>
              </div>
              <div class="weready-process__milestone-content">
                <p>I leveraged <strong>Claude Code</strong> to design the screenshot capture system, browser automation patterns, and quality assurance workflows tailored for pharmaceutical compliance.</p>
                <ul class="weready-process__milestone-stats">
                  <li><strong>Architecture Agent:</strong> Claude Code for automation design</li>
                  <li><strong>Output:</strong> Compliance-ready orchestration patterns</li>
                </ul>
              </div>
            </article>
            <article class="weready-process__milestone">
              <div class="weready-process__milestone-label">
                <span class="weready-process__milestone-number">03</span>
                <h3 class="weready-process__milestone-title">Implementation</h3>
              </div>
              <div class="weready-process__milestone-content">
                <p>I used <strong>Codex CLI</strong> for rapid implementation of Puppeteer-based capture, multi-device testing, and pharmaceutical compliance features.</p>
                <ul class="weready-process__milestone-stats">
                  <li><strong>Implementation Agent:</strong> Codex CLI for browser automation</li>
                  <li><strong>Result:</strong> Automated capture across devices in minutes</li>
                </ul>
              </div>
            </article>
            <article class="weready-process__milestone">
              <div class="weready-process__milestone-label">
                <span class="weready-process__milestone-number">04</span>
                <h3 class="weready-process__milestone-title">Production Platform</h3>
              </div>
              <div class="weready-process__milestone-content">
                <p>The orchestrated AI agents delivered a platform that transforms 8-hour manual processes into 10-minute automated workflows, demonstrating advanced automation for pharma applications.</p>
                <ul class="weready-process__milestone-stats">
                  <li><strong>Achievement:</strong> 98% reduction in route preparation time</li>
                  <li><strong>Impact:</strong> Consistent MLR-ready screenshot packages</li>
                </ul>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section class="weready-showcase" aria-labelledby="echo-showcase-title">
        <div class="weready-showcase__header">
          <p class="weready-showcase__eyebrow">Pharma Automation Results</p>
          <h2 class="weready-showcase__title" id="echo-showcase-title">
            From multi-agent coordination to pharmaceutical screenshot automation
          </h2>
        </div>
        <div class="weready-showcase__grid">
          <figure class="weready-showcase__item">
            <img
              src="${escapeHtml(imageOne)}"
              alt="Echo automation dashboard overview"
              class="weready-showcase__image"
              loading="lazy"
              decoding="async"
            />
            <figcaption class="weready-showcase__caption">
              Traycer.ai workflow research resulted in a unified platform that captures 100+ screenshots across devices in under 5 minutes.
            </figcaption>
          </figure>
          <figure class="weready-showcase__item">
            <img
              src="${escapeHtml(imageTwo)}"
              alt="Echo project settings and conditioning controls"
              class="weready-showcase__image"
              loading="lazy"
              decoding="async"
            />
            <figcaption class="weready-showcase__caption">
              Claude Code automation architecture enabled sophisticated conditioning logic that handles animations, interactive elements, and precise framing requirements.
            </figcaption>
          </figure>
          <figure class="weready-showcase__item">
            <img
              src="${escapeHtml(imageThree)}"
              alt="Echo automated screenshot output across devices"
              class="weready-showcase__image"
              loading="lazy"
              decoding="async"
            />
            <figcaption class="weready-showcase__caption">
              Codex CLI rapid implementation delivered a responsive platform that keeps pharma route preparation accessible and efficient across all project types.
            </figcaption>
          </figure>
        </div>
      </section>

      <section class="weready-outro">
        <div class="weready-outro__inner">
          <div class="weready-outro__content">
            <p class="weready-overview__eyebrow">Results</p>
            <h2 class="weready-outro__title">What I achieved through AI agent orchestration</h2>
            <p class="weready-outro__copy">
              Building Echo demonstrated my ability to coordinate multiple AI agents for pharma automation, delivering a production platform that reduces route preparation time by 98% while maintaining MLR compliance and quality standards.
            </p>
          </div>
          <div class="weready-outro__grid">
            <article class="weready-outro__card">
              <h3>98% Time Reduction</h3>
              <p>Successfully coordinated AI agents to compress route preparation from 8 hours to ~10 minutes. Demonstrated advanced automation for pharmaceutical workflows.</p>
            </article>
            <article class="weready-outro__card">
              <h3>100+ Pages Automated</h3>
              <p>Leveraged AI orchestration to build a system that captures complete website routes across multiple devices and breakpoints automatically.</p>
            </article>
            <article class="weready-outro__card">
              <h3>MLR-Ready Output</h3>
              <p>Designed compliant, production-ready systems that meet pharmaceutical submission standards. Every screenshot maintains quality and framing requirements.</p>
            </article>
          </div>
          <button type="button" class="weready-backlink weready-backlink--footer" data-echo-back>
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
  const backButtons = Array.from(root.querySelectorAll<HTMLButtonElement>(ECHO_BACK_BUTTON_SELECTOR));

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
  const backButtons = Array.from(root.querySelectorAll<HTMLButtonElement>(ECHO_BACK_BUTTON_SELECTOR));

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

export const initProjectEchoPage = (): void => {
  const root = document.querySelector<HTMLElement>(ECHO_PAGE_SELECTOR);

  if (!root) {
    return;
  }

  setupBackNavigation(root);
};

export const cleanupProjectEchoPage = (): void => {
  const root = document.querySelector<HTMLElement>(ECHO_PAGE_SELECTOR);

  if (root) {
    teardownBackNavigation(root);
  }

  // Clear referrer route on cleanup
  referrerRoute = null;
};
