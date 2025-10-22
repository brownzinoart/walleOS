import { featuredProjects } from '@/config/content';

const BRIEFFLOW_PROJECT_ID = 'briefflow';
const BRIEFFLOW_PAGE_SELECTOR = '[data-project-briefflow-page]';
const BRIEFFLOW_BACK_BUTTON_SELECTOR = '[data-briefflow-back]';

let backButtonListener: ((event: MouseEvent) => void) | null = null;
let referrerRoute: string | null = null;

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const getProject = () => featuredProjects.find((project) => project.id === BRIEFFLOW_PROJECT_ID);

const renderTags = (tags: string[] = []): string => {
  if (!tags.length) {
    return '';
  }

  return tags
    .map((tag) => `<li class="weready-tag">${escapeHtml(tag)}</li>`)
    .join('');
};

export const renderProjectBriefFlowPage = (): string => {
  const project = getProject();
  const heroTitle = project?.title ?? 'BriefFlow';
  const heroDescription = project?.description
    ?? 'AI tool that converts messy client inputs into structured, client-approved creative briefs in minutes to cut revision cycles and budget waste.';
  const projectUrl = project?.url ?? '';
  const tagsMarkup = renderTags(project?.tags ?? []);
  const imageOne = '/images/projects/briefflow/pic1.png';

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
    <article class="project-briefflow-page" data-project-briefflow-page>
      <header class="weready-hero">
        <div class="weready-hero__heading">
          <button type="button" class="weready-backlink" data-briefflow-back>
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
            <p class="weready-hero__meta-value">Founder, AI Product Designer, Marketing Automation Specialist</p>
          </div>
          <div class="weready-hero__meta-block">
            <p class="weready-hero__meta-label">Focus</p>
            <p class="weready-hero__meta-value">AI-powered briefing, client workflow optimization, creative process automation</p>
          </div>
          <div class="weready-hero__meta-block">
            <p class="weready-hero__meta-label">Built With</p>
            <p class="weready-hero__meta-value">Claude Code + Codex CLI + Traycer.ai orchestration, Next.js, Supabase</p>
          </div>
        </div>
        <div class="weready-hero__footer">
          <ul class="weready-hero__tags" aria-label="Project tags">
            ${tagsMarkup}
          </ul>
          ${externalLinkMarkup}
        </div>
      </header>

      <section class="weready-outro">
        <div class="weready-outro__inner">
          <div class="weready-outro__content">
            <p class="weready-overview__eyebrow">The Problem</p>
            <h2 class="weready-outro__title">Why I Built BriefFlow</h2>
            <p class="weready-outro__copy">
              After years in marketing and creative agencies, I witnessed teams wasting 30% of project time on poor briefing and endless revisions. Teams spend 21-56 days in review cycles while 33% of marketing budgets get squandered on misdirected work. I knew AI could transform this broken process.
            </p>
          </div>
          <div class="weready-outro__grid">
            <article class="weready-outro__card">
              <h3>Briefing Process Hell</h3>
              <p>Creative teams waste nearly one-third of project time on poor briefing habits and chaotic client inputs that lead to endless revisions</p>
            </article>
            <article class="weready-outro__card">
              <h3>Budget Waste</h3>
              <p>External agencies and poor briefing processes cost companies millions in wasted marketing spend and failed projects</p>
            </article>
            <article class="weready-outro__card">
              <h3>Client Communication Gaps</h3>
              <p>Teams struggle with unstructured client requirements, leading to scope creep and deliverables that miss the mark</p>
            </article>
          </div>
        </div>
      </section>

      <section class="weready-overview" aria-labelledby="briefflow-capabilities-title">
        <div class="weready-overview__header">
          <p class="weready-overview__eyebrow">AI-Powered Brief Creation</p>
          <h2 class="weready-overview__title" id="briefflow-capabilities-title">
            Transform messy inputs into approved briefs in minutes
          </h2>
        </div>
        <div class="weready-overview__grid">
          <article class="weready-overview__card">
            <h3>Smart Intake Forms</h3>
            <p>Conditional logic guides clients through the right questions, capturing comprehensive requirements and eliminating information gaps.</p>
          </article>
          <article class="weready-overview__card">
            <h3>AI Brief Generation</h3>
            <p>Advanced AI transforms messy client inputs into professional, structured creative briefs with clear objectives and deliverables.</p>
          </article>
          <article class="weready-overview__card">
            <h3>Client Approval Flow</h3>
            <p>Branded review links let clients comment, request changes, and approve briefs seamlessly with full audit trails.</p>
          </article>
          <article class="weready-overview__card">
            <h3>Export & Integration</h3>
            <p>Export polished PDFs or integrate directly with project management tools, Slack, and creative platforms.</p>
          </article>
        </div>
      </section>

      <section class="weready-overview" aria-labelledby="briefflow-tools-title">
        <div class="weready-overview__header">
          <p class="weready-overview__eyebrow">AI Agent Orchestration Toolkit</p>
          <h2 class="weready-overview__title" id="briefflow-tools-title">
            Tools Used
          </h2>
        </div>
        <div class="weready-overview__grid">
          <article class="weready-overview__card">
            <img src="https://assets-global.website-files.com/6500ed5c1fd67be80b31c5c9/659a7b05e0e3d8b84ee12cc9_Claude_Logo.svg" alt="Claude AI" style="width: 48px; height: 48px; margin-bottom: 1rem;" loading="lazy" />
            <h3>Claude Code CLI</h3>
            <p>Marketing workflow analysis and AI briefing architecture design</p>
          </article>
          <article class="weready-overview__card">
            <img src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" alt="GitHub Codex" style="width: 48px; height: 48px; margin-bottom: 1rem;" loading="lazy" />
            <h3>Codex CLI</h3>
            <p>Form logic implementation and client workflow automation</p>
          </article>
          <article class="weready-overview__card">
            <img src="https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg" alt="Google Gemini" style="width: 48px; height: 48px; margin-bottom: 1rem;" loading="lazy" />
            <h3>Gemini + Traycer.ai</h3>
            <p>System architecture and marketing process optimization</p>
          </article>
          <article class="weready-overview__card">
            <img src="https://ollama.com/public/ollama.png" alt="Ollama" style="width: 48px; height: 48px; margin-bottom: 1rem;" loading="lazy" />
            <h3>Ollama</h3>
            <p>Local testing and optimization for brief generation quality</p>
          </article>
          <article class="weready-overview__card">
            <img src="https://code.visualstudio.com/assets/images/code-stable.png" alt="VS Code" style="width: 48px; height: 48px; margin-bottom: 1rem;" loading="lazy" />
            <h3>VS Code + Roo</h3>
            <p>Integrated development environment with AI assistance</p>
          </article>
          <article class="weready-overview__card">
            <div style="width: 48px; height: 48px; margin-bottom: 1rem; background: linear-gradient(45deg, #ff6b35, #f7931e); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">📝</div>
            <h3>BriefFlow Workflow</h3>
            <p>Intake → AI Generation → Client Review → Approval → Export methodology using specialized agents</p>
          </article>
        </div>
      </section>

      <section class="weready-process" aria-labelledby="briefflow-process-title">
        <div class="weready-process__inner">
          <div class="weready-process__header">
            <p class="weready-process__eyebrow">AI Agent Orchestration</p>
            <h2 class="weready-process__title" id="briefflow-process-title">
              How I built BriefFlow using multi-agent coordination
            </h2>
            <p class="weready-process__lede">
              From identifying marketing briefing pain points to orchestrating Claude Code, Codex CLI, and Traycer.ai to build a production-ready platform.
            </p>
          </div>
          <div class="weready-process__timeline">
            <article class="weready-process__milestone">
              <div class="weready-process__milestone-label">
                <span class="weready-process__milestone-number">01</span>
                <h3 class="weready-process__milestone-title">Marketing Research</h3>
              </div>
              <div class="weready-process__milestone-content">
                <p>I used <strong>Traycer.ai</strong> to analyze marketing briefing workflows and identify the 30% time waste and 33% budget loss from poor briefing processes.</p>
                <ul class="weready-process__milestone-stats">
                  <li><strong>Research Tool:</strong> Traycer.ai for marketing workflow analysis</li>
                  <li><strong>Focus:</strong> Creative brief inefficiencies and client communication gaps</li>
                </ul>
              </div>
            </article>
            <article class="weready-process__milestone">
              <div class="weready-process__milestone-label">
                <span class="weready-process__milestone-number">02</span>
                <h3 class="weready-process__milestone-title">AI Architecture Design</h3>
              </div>
              <div class="weready-process__milestone-content">
                <p>I leveraged <strong>Claude Code</strong> to design the AI briefing system, conditional form logic, and client approval workflows that eliminate revision cycles.</p>
                <ul class="weready-process__milestone-stats">
                  <li><strong>Architecture Agent:</strong> Claude Code for AI briefing design</li>
                  <li><strong>Output:</strong> Smart intake forms and approval workflows</li>
                </ul>
              </div>
            </article>
            <article class="weready-process__milestone">
              <div class="weready-process__milestone-label">
                <span class="weready-process__milestone-number">03</span>
                <h3 class="weready-process__milestone-title">Implementation</h3>
              </div>
              <div class="weready-process__milestone-content">
                <p>I used <strong>Codex CLI</strong> for rapid implementation of form builders, AI processing pipelines, and integration systems that transform chaotic inputs into structured briefs.</p>
                <ul class="weready-process__milestone-stats">
                  <li><strong>Implementation Agent:</strong> Codex CLI for workflow automation</li>
                  <li><strong>Result:</strong> Minutes instead of days for brief creation</li>
                </ul>
              </div>
            </article>
            <article class="weready-process__milestone">
              <div class="weready-process__milestone-label">
                <span class="weready-process__milestone-number">04</span>
                <h3 class="weready-process__milestone-title">Production Platform</h3>
              </div>
              <div class="weready-process__milestone-content">
                <p>The orchestrated AI agents delivered a platform that saves agencies 30% of marketing budget by eliminating briefing waste and revision cycles.</p>
                <ul class="weready-process__milestone-stats">
                  <li><strong>Achievement:</strong> 30% reduction in briefing time and budget waste</li>
                  <li><strong>Impact:</strong> Structured client communication at scale</li>
                </ul>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section class="weready-showcase" aria-labelledby="briefflow-showcase-title">
        <div class="weready-showcase__header">
          <p class="weready-showcase__eyebrow">AI Brief Creation Results</p>
          <h2 class="weready-showcase__title" id="briefflow-showcase-title">
            From multi-agent coordination to marketing workflow transformation
          </h2>
        </div>
        <div class="weready-showcase__grid">
          <figure class="weready-showcase__item">
            <img
              src="${escapeHtml(imageOne)}"
              alt="BriefFlow AI briefing platform interface"
              class="weready-showcase__image"
              loading="lazy"
              decoding="async"
            />
            <figcaption class="weready-showcase__caption">
              Traycer.ai workflow research resulted in a unified platform that transforms chaotic client inputs into structured, approved briefs in minutes.
            </figcaption>
          </figure>
          <figure class="weready-showcase__item">
            <img
              src="${escapeHtml(imageOne)}"
              alt="BriefFlow smart intake forms and client approval workflow"
              class="weready-showcase__image"
              loading="lazy"
              decoding="async"
            />
            <figcaption class="weready-showcase__caption">
              Claude Code architectural decisions enabled sophisticated conditional logic that guides clients through comprehensive requirement gathering.
            </figcaption>
          </figure>
          <figure class="weready-showcase__item">
            <img
              src="${escapeHtml(imageOne)}"
              alt="BriefFlow automated brief generation and export features"
              class="weready-showcase__image"
              loading="lazy"
              decoding="async"
            />
            <figcaption class="weready-showcase__caption">
              Codex CLI rapid implementation delivered a responsive platform that eliminates 21-56 day review cycles and saves 30% of marketing budgets.
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
              Building BriefFlow demonstrated my ability to coordinate multiple AI agents for marketing automation, delivering a production platform that saves 30% of marketing budgets while eliminating chaotic briefing processes and revision cycles.
            </p>
          </div>
          <div class="weready-outro__grid">
            <article class="weready-outro__card">
              <h3>30% Budget Savings</h3>
              <p>Successfully coordinated AI agents to eliminate briefing waste and revision cycles. Demonstrated advanced automation for marketing workflows and creative processes.</p>
            </article>
            <article class="weready-outro__card">
              <h3>Workflow Transformation</h3>
              <p>Leveraged AI orchestration to build a system that transforms 21-56 day review cycles into minutes-long brief creation processes.</p>
            </article>
            <article class="weready-outro__card">
              <h3>Client Communication</h3>
              <p>Designed structured, approval-ready systems that eliminate scope creep. Every brief maintains clarity and prevents misdirected work.</p>
            </article>
          </div>
          <button type="button" class="weready-backlink weready-backlink--footer" data-briefflow-back>
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
  const backButtons = Array.from(root.querySelectorAll<HTMLButtonElement>(BRIEFFLOW_BACK_BUTTON_SELECTOR));

  if (!backButtons.length) {
    return;
  }

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
  const backButtons = Array.from(root.querySelectorAll<HTMLButtonElement>(BRIEFFLOW_BACK_BUTTON_SELECTOR));

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

export const initProjectBriefFlowPage = (): void => {
  const root = document.querySelector<HTMLElement>(BRIEFFLOW_PAGE_SELECTOR);

  if (!root) {
    return;
  }

  document.body.style.overflow = '';
  document.documentElement.style.overflow = '';
  window.scrollTo(0, 0);

  setupBackNavigation(root);
};

export const cleanupProjectBriefFlowPage = (): void => {
  const root = document.querySelector<HTMLElement>(BRIEFFLOW_PAGE_SELECTOR);

  if (root) {
    teardownBackNavigation(root);
  }

  referrerRoute = null;
};
