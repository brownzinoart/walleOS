import { featuredProjects } from '@/config/content';
import type { FeaturedProject } from '@/config/content';
import { attachProjectCardListeners, renderProjectCard } from '@/components/ProjectCard';

const PROJECTS_PAGE_SELECTOR = '[data-projects-page]';

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

export const renderProjectsPage = (): string => `
  <div data-projects-page class="projects-page min-h-screen">
    ${renderHeroSection()}
    <section class="projects-content -mt-12 md:-mt-16 pt-4 md:pt-6 pb-12" data-project-cards>
      <div class="max-w-7xl mx-auto px-6">
        <div class="project-cards-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-project-cards-grid>
          ${featuredProjects.map((project: FeaturedProject, index) => renderProjectCard(project, index)).join('')}
        </div>
      </div>
    </section>
  </div>
`;

export const initProjectsPageInteractions = (): void => {
  const projectsPage = document.querySelector<HTMLElement>(PROJECTS_PAGE_SELECTOR);

  if (!projectsPage) {
    return;
  }

  attachProjectCardListeners();
};
