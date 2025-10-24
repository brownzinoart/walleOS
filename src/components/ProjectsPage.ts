import { featuredProjects } from '@/config/content';
import type { FeaturedProject } from '@/config/content';
import { attachProjectCardListeners, renderProjectCard, renderProjectHighlightCard } from '@/components/ProjectCard';
import { prefersReducedMotion } from '@/utils/performance';

const PROJECTS_PAGE_SELECTOR = '[data-projects-page]';
const PROJECTS_SCROLL_CONTAINER_SELECTOR = '[data-projects-scroll-container]';
const PROJECTS_HORIZONTAL_SELECTOR = '[data-projects-horizontal]';
const PROJECTS_TRACK_SELECTOR = '[data-projects-track]';
const SPOTLIGHT_COUNT = 4;

type ScrollTriggerHandle = { kill: () => void } & Record<string, unknown>;

type Tween = Record<string, unknown> & {
  kill: () => void;
};

type GsapCore = {
  registerPlugin: (...plugins: unknown[]) => void;
  to: (target: unknown, vars: Record<string, unknown>) => Tween;
};

type ScrollTriggerPlugin = {
  scrollerProxy: (element: HTMLElement, vars: Record<string, unknown>) => void;
  refresh: () => void;
  update: () => void;
  addEventListener: (event: string, handler: (...args: unknown[]) => void) => void;
  removeEventListener: (event: string, handler: (...args: unknown[]) => void) => void;
};

type LocomotiveInstance = {
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  update: () => void;
  destroy: () => void;
  scrollTo: (target: number, options?: Record<string, unknown>) => void;
  scroll?: {
    instance?: {
      scroll?: {
        y?: number;
      };
    };
  };
};

type LocomotiveScrollOptions = {
  el: HTMLElement;
  [key: string]: unknown;
};

type LocomotiveScrollClass = new (options: LocomotiveScrollOptions) => LocomotiveInstance;
type LoadedProjectsLibs = {
  gsap: GsapCore;
  ScrollTrigger: ScrollTriggerPlugin;
  LocomotiveScroll: LocomotiveScrollClass;
};

let gsapRef: GsapCore | null = null;
let ScrollTriggerRef: ScrollTriggerPlugin | null = null;
let LocomotiveScrollRef: LocomotiveScrollClass | null = null;
let locomotiveStylesPromise: Promise<unknown> | null = null;

let locomotiveInstance: LocomotiveInstance | null = null;
let horizontalTween: Tween | null = null;
let horizontalTriggerHandle: ScrollTriggerHandle | null = null;
let refreshHandler: (() => void) | null = null;
let resizeHandler: (() => void) | null = null;
let projectsTriggers: ScrollTriggerHandle[] = [];
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

const loadProjectsLibraries = async (): Promise<LoadedProjectsLibs | null> => {
  if (typeof window === 'undefined') {
    return null;
  }

  if (gsapRef && ScrollTriggerRef && LocomotiveScrollRef) {
    return {
      gsap: gsapRef,
      ScrollTrigger: ScrollTriggerRef,
      LocomotiveScroll: LocomotiveScrollRef,
    };
  }

  try {
    const [gsapModule, scrollTriggerModule, locomotiveModule] = await Promise.all([
      import('gsap'),
      import('gsap/ScrollTrigger'),
      import('locomotive-scroll'),
    ]);

    if (!locomotiveStylesPromise) {
      locomotiveStylesPromise = import('locomotive-scroll/dist/locomotive-scroll.css').catch(() => null);
    }
    await locomotiveStylesPromise;

    const gsapModuleAny = gsapModule as unknown as { gsap?: GsapCore; default?: GsapCore };
    const scrollTriggerModuleAny = scrollTriggerModule as unknown as {
      ScrollTrigger?: ScrollTriggerPlugin;
      default?: ScrollTriggerPlugin;
    };
    const locomotiveModuleAny = locomotiveModule as unknown as { default?: LocomotiveScrollClass };

    const gsapExport = gsapModuleAny.gsap ?? gsapModuleAny.default;
    const scrollTriggerExport = scrollTriggerModuleAny.ScrollTrigger ?? scrollTriggerModuleAny.default;
    const locomotiveExport = locomotiveModuleAny.default;

    if (!gsapExport || !scrollTriggerExport || !locomotiveExport) {
      console.warn('[projects] Failed to load animation libraries. Falling back to static presentation.');
      return null;
    }

    gsapExport.registerPlugin(scrollTriggerExport);

    gsapRef = gsapExport;
    ScrollTriggerRef = scrollTriggerExport;
    LocomotiveScrollRef = locomotiveExport;

    return {
      gsap: gsapRef,
      ScrollTrigger: ScrollTriggerRef,
      LocomotiveScroll: LocomotiveScrollRef,
    };
  } catch (error) {
    console.warn('[projects] Dynamic import failed; falling back to static experience.', error);
    return null;
  }
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
  const gsap = gsapRef;
  const ScrollTrigger = ScrollTriggerRef;

  if (!gsap || !ScrollTrigger) {
    return;
  }

  const horizontalSection = container.querySelector<HTMLElement>(PROJECTS_HORIZONTAL_SELECTOR);
  const track = container.querySelector<HTMLElement>(PROJECTS_TRACK_SELECTOR);

  if (!horizontalSection || !track) {
    return;
  }

  if (horizontalTriggerHandle) {
    projectsTriggers = projectsTriggers.filter((trigger) => trigger !== horizontalTriggerHandle);
    horizontalTriggerHandle.kill();
    horizontalTriggerHandle = null;
  }

  if (horizontalTween) {
    horizontalTween.kill();
    horizontalTween = null;
  }

  const trackWidth = track.offsetWidth;
  const horizontalScrollLength = Math.max(0, trackWidth - window.innerWidth);
  const horizontalOffset = horizontalScrollLength > 0 ? -horizontalScrollLength : 0;
  const startOffset = Math.max(Math.min(window.innerHeight * 0.25, 320), 120);

  const tween = gsap.to(track, {
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

  horizontalTween = tween;

  const triggerHandle = (tween as unknown as { scrollTrigger?: ScrollTriggerHandle }).scrollTrigger ?? null;

  if (triggerHandle) {
    horizontalTriggerHandle = triggerHandle;
    projectsTriggers.push(triggerHandle);
  }
};

const setupKeyboardNavigation = (track: HTMLElement) => {
  const panels = Array.from(track.querySelectorAll<HTMLElement>('.projects-horizontal-panel'));
  if (!panels.length) return;
  
  let currentIndex = 0;
  const gsap = gsapRef;

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
      if (gsap) {
        gsap.to(track, {
          scrollLeft: track.scrollLeft + scrollLeft,
          duration: 0.3,
          ease: 'power2.out',
        });
      } else {
        track.scrollLeft += scrollLeft;
      }
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

export const initProjectsPageInteractions = async (): Promise<void> => {
  const projectsPage = document.querySelector<HTMLElement>(PROJECTS_PAGE_SELECTOR);
  const container = projectsPage?.querySelector<HTMLElement>(PROJECTS_SCROLL_CONTAINER_SELECTOR);

  if (!projectsPage || !container) {
    return;
  }

  attachProjectCardListeners();

  const hasHorizontalScroll = !!container.querySelector(PROJECTS_HORIZONTAL_SELECTOR);

  if (!hasHorizontalScroll) {
    return;
  }

  if (prefersReducedMotion()) {
    projectsPage.classList.add('projects-motion-reduced');
    return;
  }

  const libs = await loadProjectsLibraries();

  if (!libs) {
    projectsPage.classList.add('projects-motion-reduced');
    return;
  }

  const { ScrollTrigger, LocomotiveScroll } = libs;

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

  locomotiveInstance.on('scroll', () => {
    ScrollTrigger.update();
  });

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
  const ScrollTrigger = ScrollTriggerRef;

  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler);
    resizeHandler = null;
  }

  if (refreshHandler && ScrollTrigger) {
    ScrollTrigger.removeEventListener('refresh', refreshHandler);
    refreshHandler = null;
  }

  if (loadHandler) {
    window.removeEventListener('load', loadHandler);
    loadHandler = null;
  }

  projectsTriggers.forEach((trigger) => trigger.kill());
  projectsTriggers = [];
  horizontalTriggerHandle = null;

  horizontalTween?.kill();
  horizontalTween = null;

  if (locomotiveInstance) {
    locomotiveInstance.destroy();
    locomotiveInstance = null;
  }

  // Reset body overflow and transform to prevent horizontal scroll bleed
  document.body.style.overflow = '';
  document.body.style.transform = '';
  document.documentElement.style.overflow = '';

  // Remove locomotive-scroll classes and styles
  document.documentElement.classList.remove('has-scroll-smooth');
  document.body.style.height = '';

  if (ScrollTrigger) {
    ScrollTrigger.refresh();
  }
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
