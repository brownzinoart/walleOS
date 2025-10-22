import { featuredProjects } from '@/config/content';

const LISTINGPAL_PROJECT_ID = 'listingpal';
const LISTINGPAL_PAGE_SELECTOR = '[data-project-listingpal-page]';
const LISTINGPAL_BACK_BUTTON_SELECTOR = '[data-listingpal-back]';

let backButtonListener: ((event: MouseEvent) => void) | null = null;
let referrerRoute: string | null = null;

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const getProject = () => featuredProjects.find((project) => project.id === LISTINGPAL_PROJECT_ID);

const renderTags = (tags: string[] = []): string => {
  if (!tags.length) {
    return '';
  }

  return tags
    .map((tag) => `<li class="weready-tag">${escapeHtml(tag)}</li>`)
    .join('');
};

export const renderProjectListingPalPage = (): string => {
  const project = getProject();
  const heroTitle = project?.title ?? 'ListingPal';
  const heroDescription = project?.description
    ?? 'AI tool that generates complete real estate marketing campaigns in 90 seconds—MLS descriptions, social content, and paid ads from just an address using AgentSelect™ framework.';
  const projectUrl = project?.url ?? '';
  const tagsMarkup = renderTags(project?.tags ?? []);
  const imageOne = '/images/projects/listingpal/pic1.png';
  const imageTwo = '/images/projects/listingpal/pic2.png';
  const imageThree = '/images/projects/listingpal/pic3.png';

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
    <article class="project-listingpal-page" data-project-listingpal-page>
      <header class="weready-hero">
        <div class="weready-hero__heading">
          <button type="button" class="weready-backlink" data-listingpal-back>
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
            <p class="weready-hero__meta-value">Founder, AI Agent Orchestrator, Real Estate Tech Architect</p>
          </div>
          <div class="weready-hero__meta-block">
            <p class="weready-hero__meta-label">Focus</p>
            <p class="weready-hero__meta-value">AgentSelect™ framework, marketing automation, MLS integration</p>
          </div>
          <div class="weready-hero__meta-block">
            <p class="weready-hero__meta-label">Built With</p>
            <p class="weready-hero__meta-value">Claude Code + Codex CLI + Traycer.ai orchestration, React, OpenAI API</p>
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
            <h2 class="weready-outro__title">Why I Built ListingPal</h2>
            <p class="weready-outro__copy">
              I was part of my parents' latest house buying experience and couldn't fathom how the real estate agent was able to handle everything they had to—not to mention, my parents were enough to handle, but all the marketing involved for listings and steps needed to complete a sale were overwhelming.
            </p>
          </div>
          <div class="weready-outro__grid">
            <article class="weready-outro__card">
              <h3>Agent Overwhelm</h3>
              <p>Real estate agents juggle multiple tools, write copy for different platforms, and optimize for each channel—all while managing demanding clients and complex sales processes.</p>
            </article>
            <article class="weready-outro__card">
              <h3>Marketing Complexity</h3>
              <p>From MLS descriptions to social media content to paid ads, each platform requires different messaging, formats, and optimization strategies.</p>
            </article>
            <article class="weready-outro__card">
              <h3>Time Pressure</h3>
              <p>In competitive markets, speed matters. Agents need to get listings live quickly with professional-quality marketing materials that drive results.</p>
            </article>
          </div>
        </div>
      </section>

      <section class="weready-overview" aria-labelledby="listingpal-overview-title">
        <div class="weready-overview__header">
          <p class="weready-overview__eyebrow">AgentSelect™ Framework</p>
          <h2 class="weready-overview__title" id="listingpal-overview-title">
            Complete real estate marketing campaigns in 90 seconds
          </h2>
        </div>
        <div class="weready-overview__grid">
          <article class="weready-overview__card">
            <h3>Instant Professional Descriptions</h3>
            <p>AI-crafted MLS-ready property descriptions optimized for SEO and engagement, automatically generated from property data.</p>
          </article>
          <article class="weready-overview__card">
            <h3>Customized Social Media Content</h3>
            <p>Platform-specific posts, captions, and hashtags tailored for maximum reach across Facebook, Instagram, and LinkedIn.</p>
          </article>
          <article class="weready-overview__card">
            <h3>Optimized Ad Campaigns</h3>
            <p>High-performing paid ad headlines, CTAs, and copy for Facebook, Google, and real estate portals with conversion tracking.</p>
          </article>
          <article class="weready-overview__card">
            <h3>MLS Data Integration</h3>
            <p>Seamless connection to MLS databases for accurate, compliant content that maintains fair housing standards across all platforms.</p>
          </article>
        </div>
      </section>

      <section class="weready-overview" aria-labelledby="listingpal-tools-title">
        <div class="weready-overview__header">
          <p class="weready-overview__eyebrow">AI Agent Orchestration Toolkit</p>
          <h2 class="weready-overview__title" id="listingpal-tools-title">
            Tools Used
          </h2>
        </div>
        <div class="weready-overview__grid">
          <article class="weready-overview__card">
            <img src="https://assets-global.website-files.com/6500ed5c1fd67be80b31c5c9/659a7b05e0e3d8b84ee12cc9_Claude_Logo.svg" alt="Claude AI" style="width: 48px; height: 48px; margin-bottom: 1rem;" loading="lazy" />
            <h3>Claude Code CLI</h3>
            <p>Real estate UX patterns and marketing automation workflow design</p>
          </article>
          <article class="weready-overview__card">
            <img src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" alt="GitHub Codex" style="width: 48px; height: 48px; margin-bottom: 1rem;" loading="lazy" />
            <h3>Codex CLI</h3>
            <p>MLS integration and campaign generation pipeline development</p>
          </article>
          <article class="weready-overview__card">
            <img src="https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg" alt="Google Gemini" style="width: 48px; height: 48px; margin-bottom: 1rem;" loading="lazy" />
            <h3>Gemini + Traycer.ai</h3>
            <p>AgentSelect™ framework architecture and real estate workflow planning</p>
          </article>
          <article class="weready-overview__card">
            <img src="https://ollama.com/public/ollama.png" alt="Ollama" style="width: 48px; height: 48px; margin-bottom: 1rem;" loading="lazy" />
            <h3>Ollama</h3>
            <p>Local testing and content generation optimization for real estate copy</p>
          </article>
          <article class="weready-overview__card">
            <img src="https://code.visualstudio.com/assets/images/code-stable.png" alt="VS Code" style="width: 48px; height: 48px; margin-bottom: 1rem;" loading="lazy" />
            <h3>VS Code + Roo</h3>
            <p>Integrated development environment with AI assistance for rapid prototyping</p>
          </article>
          <article class="weready-overview__card">
            <div style="width: 48px; height: 48px; margin-bottom: 1rem; background: linear-gradient(45deg, #00d4ff, #ff0080); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">RE</div>
            <h3>Real Estate Workflow</h3>
            <p>Address Input → Data Fetch → Content Generation → Multi-Platform Distribution using specialized AI models</p>
          </article>
        </div>
      </section>

      <section class="weready-process" aria-labelledby="listingpal-process-title">
        <div class="weready-process__inner">
          <div class="weready-process__header">
            <p class="weready-process__eyebrow">AI Agent Orchestration</p>
            <h2 class="weready-process__title" id="listingpal-process-title">
              How I built ListingPal using multi-agent coordination
            </h2>
            <p class="weready-process__lede">
              From identifying real estate agent pain points to orchestrating Claude Code, Codex CLI, and Traycer.ai to build a production-ready marketing automation platform.
            </p>
          </div>
          <div class="weready-process__timeline">
            <article class="weready-process__milestone">
              <div class="weready-process__milestone-label">
                <span class="weready-process__milestone-number">01</span>
                <h3 class="weready-process__milestone-title">Market Research</h3>
              </div>
              <div class="weready-process__milestone-content">
                <p>I used <strong>Traycer.ai</strong> to research real estate marketing workflows and identify automation opportunities. This helped me understand the complexity agents face managing multiple platforms and content types.</p>
                <ul class="weready-process__milestone-stats">
                  <li><strong>Research Tool:</strong> Traycer.ai for market analysis</li>
                  <li><strong>Focus:</strong> Real estate marketing workflow pain points</li>
                </ul>
              </div>
            </article>
            <article class="weready-process__milestone">
              <div class="weready-process__milestone-label">
                <span class="weready-process__milestone-number">02</span>
                <h3 class="weready-process__milestone-title">Framework Design</h3>
              </div>
              <div class="weready-process__milestone-content">
                <p>I leveraged <strong>Claude Code</strong> to design the AgentSelect™ framework, creating specialized AI agents for different content types. Claude helped optimize the agent coordination patterns for real estate marketing.</p>
                <ul class="weready-process__milestone-stats">
                  <li><strong>Architecture Agent:</strong> Claude Code for framework design</li>
                  <li><strong>Output:</strong> AgentSelect™ multi-agent system</li>
                </ul>
              </div>
            </article>
            <article class="weready-process__milestone">
              <div class="weready-process__milestone-label">
                <span class="weready-process__milestone-number">03</span>
                <h3 class="weready-process__milestone-title">Implementation</h3>
              </div>
              <div class="weready-process__milestone-content">
                <p>I used <strong>Codex CLI</strong> for rapid implementation of the MLS integration, content generation pipeline, and multi-platform distribution system. The multi-agent approach enabled building complex real estate marketing features at unprecedented speed.</p>
                <ul class="weready-process__milestone-stats">
                  <li><strong>Implementation Agent:</strong> Codex CLI for rapid development</li>
                  <li><strong>Result:</strong> 90-second campaign generation from address input</li>
                </ul>
              </div>
            </article>
            <article class="weready-process__milestone">
              <div class="weready-process__milestone-label">
                <span class="weready-process__milestone-number">04</span>
                <h3 class="weready-process__milestone-title">Production Platform</h3>
              </div>
              <div class="weready-process__milestone-content">
                <p>The orchestrated AI agents delivered a platform that transforms a single address into complete marketing campaigns. This demonstrates advanced multi-agent coordination for real-world real estate applications.</p>
                <ul class="weready-process__milestone-stats">
                  <li><strong>Achievement:</strong> Production real estate marketing automation</li>
                  <li><strong>Impact:</strong> 90-second campaigns with MLS compliance</li>
                </ul>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section class="weready-showcase" aria-labelledby="listingpal-showcase-title">
        <div class="weready-showcase__header">
          <p class="weready-showcase__eyebrow">AgentSelect™ Framework Results</p>
          <h2 class="weready-showcase__title" id="listingpal-showcase-title">
            From multi-agent coordination to real estate marketing automation
          </h2>
        </div>
        <div class="weready-showcase__grid">
          <figure class="weready-showcase__item">
            <img
              src="${escapeHtml(imageOne)}"
              alt="ListingPal dashboard showing campaign generation"
              class="weready-showcase__image"
              loading="lazy"
              decoding="async"
            />
            <figcaption class="weready-showcase__caption">
              Traycer.ai market research resulted in a unified platform that generates MLS descriptions, social content, and paid ads from a single address input.
            </figcaption>
          </figure>
          <figure class="weready-showcase__item">
            <img
              src="${escapeHtml(imageTwo)}"
              alt="Multi-platform content generation interface"
              class="weready-showcase__image"
              loading="lazy"
              decoding="async"
            />
            <figcaption class="weready-showcase__caption">
              Claude Code framework design enabled sophisticated AgentSelect™ coordination that generates platform-specific content with MLS compliance.
            </figcaption>
          </figure>
          <figure class="weready-showcase__item">
            <img
              src="${escapeHtml(imageThree)}"
              alt="Mobile view of campaign preview and publishing"
              class="weready-showcase__image"
              loading="lazy"
              decoding="async"
            />
            <figcaption class="weready-showcase__caption">
              Codex CLI rapid implementation delivered a responsive platform that keeps real estate marketing accessible across all devices and workflows.
            </figcaption>
          </figure>
        </div>
      </section>

      <section class="weready-outro">
        <div class="weready-outro__inner">
          <div class="weready-outro__content">
            <p class="weready-overview__eyebrow">Next Steps</p>
            <h2 class="weready-outro__title">What's next for ListingPal</h2>
            <p class="weready-outro__copy">
              The multi-agent foundation is ready, so I'm lining up a small cohort of North Carolina agents to pressure test the workflow. Their feedback will decide whether to double down on the platform, pivot the positioning, or acknowledge the signal isn't strong enough yet.
            </p>
          </div>
          <div class="weready-outro__grid">
            <article class="weready-outro__card">
              <h3>NC Pilot Program</h3>
              <p>Coordinating sessions with Triangle and Charlotte agents to run active listings through ListingPal and stress-test the AgentSelect™ pipeline end to end.</p>
            </article>
            <article class="weready-outro__card">
              <h3>Feedback Signal</h3>
              <p>Capturing qualitative insights and campaign performance metrics to validate which automations solve the highest-friction marketing tasks for operators on the ground.</p>
            </article>
            <article class="weready-outro__card">
              <h3>Build, Pivot, or Pause</h3>
              <p>Using the pilot data to choose the next move: invest in a broader beta rollout, refocus the product based on unmet needs, or accept that the current thesis lacks validation.</p>
            </article>
          </div>
          <button type="button" class="weready-backlink weready-backlink--footer" data-listingpal-back>
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
  const backButtons = Array.from(root.querySelectorAll<HTMLButtonElement>(LISTINGPAL_BACK_BUTTON_SELECTOR));

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
  const backButtons = Array.from(root.querySelectorAll<HTMLButtonElement>(LISTINGPAL_BACK_BUTTON_SELECTOR));

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

export const initProjectListingPalPage = (): void => {
  const root = document.querySelector<HTMLElement>(LISTINGPAL_PAGE_SELECTOR);

  if (!root) {
    return;
  }

  // Ensure clean scroll state on detail page
  document.body.style.overflow = '';
  document.documentElement.style.overflow = '';
  window.scrollTo(0, 0);

  setupBackNavigation(root);
};

export const cleanupProjectListingPalPage = (): void => {
  const root = document.querySelector<HTMLElement>(LISTINGPAL_PAGE_SELECTOR);

  if (root) {
    teardownBackNavigation(root);
  }

  // Clear referrer route on cleanup
  referrerRoute = null;
};
