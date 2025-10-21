import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import LocomotiveScroll from 'locomotive-scroll';
import 'locomotive-scroll/dist/locomotive-scroll.css';

import { featuredProjects } from '@/config/content';
import type { FeaturedProject } from '@/config/content';
import { attachProjectCardListeners, renderProjectCard, renderProjectHighlightCard } from '@/components/ProjectCard';
import { prefersReducedMotion } from '@/utils/performance';

gsap.registerPlugin(ScrollTrigger);

const PROJECTS_PAGE_SELECTOR = '[data-projects-page]';
const PROJECTS_SCROLL_CONTAINER_SELECTOR = '[data-projects-scroll-container]';
const PROJECTS_HORIZONTAL_SELECTOR = '[data-projects-horizontal]';
const PROJECTS_TRACK_SELECTOR = '[data-projects-track]';
const SPOTLIGHT_COUNT = 4;

type LocomotiveInstance = InstanceType<typeof LocomotiveScroll>;

let locomotiveInstance: LocomotiveInstance | null = null;
let horizontalTween: gsap.core.Tween | null = null;
let refreshHandler: (() => void) | null = null;
let resizeHandler: (() => void) | null = null;
let projectsTriggers: ScrollTrigger[] = [];
let loadHandler: (() => void) | null = null;

const getSpotlightLede = (count: number): string => {
  if (count <= 1) {
    return 'A flagship build that highlights how I pair product strategy with execution. Dive in for the full arc.';
  }

  if (count === 2) {
    return 'Two flagship builds that capture how I pair product strategy with execution. Dive in for the full arc.';
  }

  return 'Flagship builds that capture how I pair product strategy with execution. Dive in for the full arc.';
};

const renderHeroSection = (): string => `
  <section class="projects-hero py-16 md:py-24">
    <div class="max-w-4xl mx-auto text-center">
      <h1 class="text-4xl md:text-6xl font-black tracking-tight mb-6">
        Projects Showcase
      </h1>
      <p class="text-xl md:text-2xl text-secondary max-w-3xl mx-auto leading-relaxed">
        Take a look at some of my previous projects that I've worked on. Each project represents a unique challenge and showcases different aspects of my development skills and creative problem-solving.
      </p>
    </div>
  </section>
`;

const renderSpotlightCards = (projects: FeaturedProject[]): string => {
  if (!projects.length) {
    return '';
  }

  return projects
    .map((project, index) => renderProjectHighlightCard(project, index))
    .join('');
};

const renderHorizontalScrollSection = (projects: FeaturedProject[]): string => {
  if (!projects.length) {
    return '';
  }

  const projectPanels = projects
    .map((project, index) => `
      <article class="projects-horizontal-panel" tabindex="0" role="article" aria-labelledby="project-title-${index}">
        <div class="project-horizontal-content">
          <div class="project-horizontal-image">
            <img src="${project.thumbnail}" alt="${project.title}" loading="lazy" decoding="async" />
          </div>
          <div class="project-horizontal-info">
            <h3 class="project-horizontal-title" id="project-title-${index}">${project.title}</h3>
            <p class="project-horizontal-description">${project.description}</p>
            <div class="project-horizontal-tags" role="list" aria-label="Project technologies">
              ${project.tags.map(tag => `<span class="project-horizontal-tag" role="listitem">${tag}</span>`).join('')}
            </div>
            ${project.url ? `
              <a href="${project.url}" target="_blank" rel="noopener noreferrer" class="project-horizontal-link" aria-label="View ${project.title} project">
                View Project
              </a>
            ` : ''}
          </div>
        </div>
      </article>
    `)
    .join('');

  return `
    <section class="projects-horizontal-section" data-scroll-section data-projects-horizontal aria-labelledby="horizontal-scroll-title">
      <div class="projects-horizontal-track" data-projects-track role="region" aria-label="Project showcase" tabindex="0">
        <article class="projects-horizontal-panel projects-horizontal-panel--intro" role="article" aria-labelledby="horizontal-scroll-title">
          <h2 class="projects-horizontal-title" id="horizontal-scroll-title">Explore My Projects</h2>
          <p class="projects-horizontal-subtitle">
            Scroll through flagship builds that connect strategy, storytelling, and high-polish motion across investment, real estate, and creative tooling.
          </p>
          <div class="projects-horizontal-intro-meta" role="list" aria-label="Project capabilities">
            <span class="projects-horizontal-intro-pill" role="listitem">Strategy + Execution</span>
            <span class="projects-horizontal-intro-pill" role="listitem">Motion-first storytelling</span>
            <span class="projects-horizontal-intro-pill" role="listitem">Layered interaction design</span>
          </div>
        </article>
        ${projectPanels}
      </div>
    </section>
  `;
};

const renderSecondaryCards = (projects: FeaturedProject[], offset: number): string => {
  if (!projects.length) {
    return '';
  }

  const cardsMarkup = projects
    .map((project, index) => renderProjectCard(project, index + offset))
    .join('');

  return `
    <div class="projects-secondary-block">
      <header class="projects-secondary-header">
        <p class="project-cards-eyebrow">More Work</p>
        <h2 class="projects-secondary-heading">Product Explorations</h2>
      </header>
      <div class="project-cards-grid" data-project-cards-grid>
        ${cardsMarkup}
      </div>
    </div>
  `;
};

export const renderProjectsPage = (): string => {
  const spotlightProjects = featuredProjects.slice(0, SPOTLIGHT_COUNT);
  const remainingProjects = featuredProjects.slice(SPOTLIGHT_COUNT);

  return `
    <div
      data-projects-page
      class="projects-page min-h-screen"
    >
      <div class="projects-scroll" data-projects-scroll-container data-scroll-container>
        ${renderHeroSection()}
        <section class="projects-content -mt-12 md:-mt-16 pt-4 md:pt-6 pb-12" data-project-cards>
          <div class="max-w-7xl mx-auto px-6">
            ${
              spotlightProjects.length > 0
                ? `
                  <div class="projects-featured-block">
                    <header class="projects-featured-header">
                      <p class="project-cards-eyebrow">Spotlight</p>
                      <h2 class="projects-featured-title">Signature Case Studies</h2>
                      <p class="projects-featured-lede">
                        ${getSpotlightLede(spotlightProjects.length)}
                      </p>
                    </header>
                    <div class="projects-featured-grid">
                      ${renderSpotlightCards(spotlightProjects)}
                    </div>
                  </div>
                `
                : ''
            }
          </div>
        </section>
        ${renderHorizontalScrollSection(featuredProjects)}
        <section class="projects-content -mt-12 md:-mt-16 pt-4 md:pt-6 pb-12" data-project-cards>
          <div class="max-w-7xl mx-auto px-6">
            ${renderSecondaryCards(remainingProjects, spotlightProjects.length)}
          </div>
        </section>
      </div>
    </div>
  `;
};

const setupHorizontalScroll = (container: HTMLElement) => {
  const horizontalSection = container.querySelector<HTMLElement>(PROJECTS_HORIZONTAL_SELECTOR);
  const track = container.querySelector<HTMLElement>(PROJECTS_TRACK_SELECTOR);

  if (!horizontalSection || !track) {
    return;
  }

  const previousTrigger = horizontalTween?.scrollTrigger ?? null;

  horizontalTween?.kill();
  horizontalTween = null;

  if (previousTrigger) {
    projectsTriggers = projectsTriggers.filter((trigger) => trigger !== previousTrigger);
  }

  const trackWidth = track.offsetWidth;
  const horizontalScrollLength = Math.max(0, trackWidth - window.innerWidth);
  const horizontalOffset = horizontalScrollLength > 0 ? -horizontalScrollLength : 0;
  const startOffset = Math.max(Math.min(window.innerHeight * 0.25, 320), 120);

  horizontalTween = gsap.to(track, {
    x: horizontalOffset,
    ease: 'none',
    scrollTrigger: {
      id: 'projects-horizontal',
      scroller: container,
      scrub: 0.8,
      trigger: horizontalSection,
      pin: true,
      start: () => `top top+=${startOffset}`,
      end: () => (horizontalScrollLength > 0 ? `+=${horizontalScrollLength}` : '+=0'),
      anticipatePin: 0.8,
      invalidateOnRefresh: true,
    },
  });

  const horizontalTrigger = horizontalTween.scrollTrigger;

  if (horizontalTrigger) {
    projectsTriggers.push(horizontalTrigger);
  }
};

const setupKeyboardNavigation = (track: HTMLElement) => {
  const panels = Array.from(track.querySelectorAll<HTMLElement>('.projects-horizontal-panel'));
  if (!panels.length) return;
  
  let currentIndex = 0;

  const updateFocus = (index: number) => {
    if (index < 0) index = panels.length - 1;
    if (index >= panels.length) index = 0;
    
    currentIndex = index;
    const currentPanel = panels[currentIndex];
    if (!currentPanel) return;
    
    currentPanel.focus();
    
    // Scroll the panel into view
    const panelRect = currentPanel.getBoundingClientRect();
    const trackRect = track.getBoundingClientRect();
    
    if (panelRect.left < trackRect.left || panelRect.right > trackRect.right) {
      const scrollLeft = panelRect.left - trackRect.left - (trackRect.width - panelRect.width) / 2;
      gsap.to(track, {
        scrollLeft: track.scrollLeft + scrollLeft,
        duration: 0.3,
        ease: 'power2.out'
      });
    }
  };

  panels.forEach((panel, index) => {
    panel.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          updateFocus(index - 1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          updateFocus(index + 1);
          break;
      }
    });
  });
};

export const initProjectsPageInteractions = (): void => {
  const projectsPage = document.querySelector<HTMLElement>(PROJECTS_PAGE_SELECTOR);
  const container = projectsPage?.querySelector<HTMLElement>(PROJECTS_SCROLL_CONTAINER_SELECTOR);

  if (!projectsPage || !container) {
    return;
  }

  attachProjectCardListeners();

  if (prefersReducedMotion()) {
    projectsPage.classList.add('projects-motion-reduced');
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

  const runHorizontalSetup = () => {
    setupHorizontalScroll(container);
    requestAnimationFrame(() => {
      ScrollTrigger.refresh();
    });
  };

  runHorizontalSetup();

  if (document.readyState !== 'complete') {
    loadHandler = () => {
      runHorizontalSetup();
      loadHandler = null;
    };
    window.addEventListener('load', loadHandler, { once: true });
  }

  // Setup keyboard navigation for the horizontal scroll track
  const track = container.querySelector<HTMLElement>(PROJECTS_TRACK_SELECTOR);
  if (track) {
    setupKeyboardNavigation(track);
  }

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

export const cleanupProjectsPage = (): void => {
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler);
    resizeHandler = null;
  }

  if (refreshHandler) {
    ScrollTrigger.removeEventListener('refresh', refreshHandler);
    refreshHandler = null;
  }

  if (loadHandler) {
    window.removeEventListener('load', loadHandler);
    loadHandler = null;
  }

  projectsTriggers.forEach((trigger) => trigger.kill());
  projectsTriggers = [];

  horizontalTween?.kill();
  horizontalTween = null;

  if (locomotiveInstance) {
    locomotiveInstance.destroy();
    locomotiveInstance = null;
  }

  ScrollTrigger.refresh();
};

export const renderLegacyProjectsPage = (): string => `
  <div
    data-projects-page
    class="projects-page min-h-screen"
  >
    ${renderHeroSection()}
    <section class="projects-content -mt-12 md:-mt-16 pt-4 md:pt-6 pb-12" data-project-cards>
      <div class="max-w-7xl mx-auto px-6">
        <div class="project-cards-grid grid grid-cols-1 md:grid-cols-2 gap-6" data-project-cards-grid>
          ${featuredProjects.map((project: FeaturedProject, index) => renderProjectCard(project, index)).join('')}
        </div>
      </div>
    </section>
  </div>
`;
