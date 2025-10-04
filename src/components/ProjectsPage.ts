import { featuredProjects } from '@/config/content';
import { renderProjectCard, PROJECT_CARD_SELECTOR, attachProjectCardListeners } from '@/components/ProjectCard';
import { prefersReducedMotion } from '@/utils/performance';

export interface ProjectDetail {
  id: string;
  title: string;
  description: string;
  longDescription?: string;
  tags: string[];
  thumbnail: string;
  url: string;
  images?: string[];
  technologies?: string[];
  githubUrl?: string;
  demoUrl?: string;
  featured: boolean;
}

export interface ProjectsPageState {
  isLoading: boolean;
  expandedProjectId: string | null;
  projects: ProjectDetail[];
}

const projectsPageState: ProjectsPageState = {
  isLoading: false,
  expandedProjectId: null,
  projects: featuredProjects.map(project => ({
    ...project,
    longDescription: `${project.description} - This project showcases advanced development techniques and modern web technologies. Built with attention to performance, accessibility, and user experience.`,
    images: [project.thumbnail].filter(Boolean),
    technologies: project.tags,
    githubUrl: project.url.startsWith('http') ? undefined : project.url,
    demoUrl: project.url.startsWith('http') ? project.url : undefined,
    featured: true,
  })),
};

const PROJECTS_PAGE_SELECTOR = '[data-projects-page]';
const PROJECT_EXPANDED_SELECTOR = '[data-project-expanded]';
const PROJECTS_GRID_SELECTOR = '[data-project-cards-grid]';

const renderHeroSection = (): string => `
  <section class="projects-hero py-16 md:py-24">
    <div class="max-w-4xl mx-auto text-center">
      <h1 class="text-4xl md:text-6xl font-black tracking-tight mb-6">
        Projects Showcase
      </h1>
      <p class="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
        Take a look at some of my previous projects that I've worked on. Each project represents a unique challenge and showcases different aspects of my development skills and creative problem-solving.
      </p>
    </div>
  </section>
`;

const renderSkeletonCard = (): string => `
  <div class="project-card-skeleton bg-gray-900 border-2 border-gray-800 rounded-lg overflow-hidden animate-pulse">
    <div class="aspect-video bg-gray-800"></div>
    <div class="p-6 space-y-4">
      <div class="h-6 bg-gray-800 rounded w-3/4"></div>
      <div class="space-y-2">
        <div class="h-4 bg-gray-800 rounded"></div>
        <div class="h-4 bg-gray-800 rounded w-5/6"></div>
      </div>
      <div class="flex gap-2">
        <div class="h-6 bg-gray-800 rounded w-16"></div>
        <div class="h-6 bg-gray-800 rounded w-20"></div>
        <div class="h-6 bg-gray-800 rounded w-14"></div>
      </div>
    </div>
  </div>
`;

const renderLoadingGrid = (): string => `
  <div class="projects-grid-loading grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    ${Array.from({ length: 6 }, () => renderSkeletonCard()).join('')}
  </div>
`;

const renderProjectDetailsModal = (project: ProjectDetail): string => `
  <div
    class="project-expanded-modal fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    data-project-expanded
    data-project-id="${project.id}"
    role="dialog"
    aria-modal="true"
    aria-labelledby="project-modal-title"
  >
    <div class="project-expanded-content bg-gray-900 border-2 border-gray-700 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
      <div class="project-expanded-header p-6 border-b border-gray-700 flex justify-between items-start">
        <div class="flex-1">
          <h2 id="project-modal-title" class="text-2xl md:text-3xl font-bold mb-2">${project.title}</h2>
          <p class="text-gray-300 text-lg">${project.longDescription || project.description}</p>
        </div>
        <button
          class="project-expanded-close text-gray-400 hover:text-white transition-colors p-2"
          aria-label="Close project details"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <div class="project-expanded-body p-6">
        ${project.images && project.images.length > 0 ? `
          <div class="project-images mb-8">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              ${project.images.map(image => `
                <img
                  src="${image}"
                  alt="${project.title} screenshot"
                  class="rounded-lg border border-gray-700"
                  loading="lazy"
                />
              `).join('')}
            </div>
          </div>
        ` : ''}

        <div class="project-details space-y-6">
          ${project.technologies && project.technologies.length > 0 ? `
            <div class="project-technologies">
              <h3 class="text-lg font-semibold mb-3">Technologies Used</h3>
              <div class="flex flex-wrap gap-2">
                ${project.technologies.map(tech => `
                  <span class="px-3 py-1 bg-gray-800 text-gray-200 rounded-full text-sm font-medium">
                    ${tech}
                  </span>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <div class="project-links flex flex-wrap gap-4">
            ${project.demoUrl ? `
              <a
                href="${project.demoUrl}"
                target="_blank"
                rel="noopener noreferrer"
                class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                View Demo
              </a>
            ` : ''}
            ${project.githubUrl ? `
              <a
                href="${project.githubUrl}"
                target="_blank"
                rel="noopener noreferrer"
                class="px-6 py-3 border-2 border-gray-600 hover:border-gray-400 text-white font-medium rounded-lg transition-colors"
              >
                View Code
              </a>
            ` : ''}
          </div>
        </div>
      </div>
    </div>
  </div>
`;

export const renderProjectsPage = (): string => {
  const isLoading = projectsPageState.isLoading;

  return `
    <div class="projects-page min-h-screen" data-projects-page>
      ${renderHeroSection()}

      <section class="projects-content py-12" data-project-cards>
        <div class="max-w-7xl mx-auto px-6">
          ${isLoading ? renderLoadingGrid() : `
            <div class="project-cards-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-project-cards-grid>
              ${projectsPageState.projects.map((project, index) => renderProjectCard(project, index)).join('')}
            </div>
          `}
        </div>
      </section>
    </div>
  `;
};

export const showProjectDetails = (projectId: string): void => {
  const project = projectsPageState.projects.find(p => p.id === projectId);
  if (!project) return;

  projectsPageState.expandedProjectId = projectId;

  // Create and append modal to body
  const modalHtml = renderProjectDetailsModal(project);
  const modalContainer = document.createElement('div');
  modalContainer.innerHTML = modalHtml;

  const modal = modalContainer.firstElementChild as HTMLElement;
  if (modal) {
    document.body.appendChild(modal);
    document.body.classList.add('overflow-hidden');

    // Focus management
    const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

    // Trap focus within modal
    const trapFocus = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            lastFocusable?.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            firstFocusable?.focus();
            e.preventDefault();
          }
        }
      }
    };

    modal.addEventListener('keydown', trapFocus);

    // Close modal functionality
    const closeModal = () => {
      modal.remove();
      document.body.classList.remove('overflow-hidden');
      modal.removeEventListener('keydown', trapFocus);

      // Return focus to the project card that was clicked
      const projectCard = document.querySelector(`[data-project-id="${projectId}"]`) as HTMLElement;
      projectCard?.focus();
    };

    // Close button
    const closeButton = modal.querySelector('.project-expanded-close') as HTMLButtonElement;
    closeButton?.addEventListener('click', closeModal);

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    // Close on Escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);

    // Focus the close button
    setTimeout(() => closeButton?.focus(), 100);
  }
};

export const hideProjectDetails = (): void => {
  const modal = document.querySelector(PROJECT_EXPANDED_SELECTOR) as HTMLElement;
  if (modal) {
    modal.remove();
    document.body.classList.remove('overflow-hidden');
    projectsPageState.expandedProjectId = null;
  }
};

export const initProjectsPageInteractions = (): void => {
  const projectsPage = document.querySelector<HTMLElement>(PROJECTS_PAGE_SELECTOR);
  if (!projectsPage) return;

  // Initialize project card interactions (animations, tilt effects, etc.)
  attachProjectCardListeners();

  // Handle project card clicks for expansion instead of navigation
  const handleProjectCardClick = (e: Event) => {
    const card = (e.target as Element).closest('[data-project-card]') as HTMLElement;
    if (!card) return;

    e.preventDefault();
    e.stopPropagation();

    const projectId = card.getAttribute('data-project-id');
    if (projectId) {
      showProjectDetails(projectId);
    }
  };

  // Attach click listeners to project cards
  projectsPage.addEventListener('click', handleProjectCardClick);

  // Handle keyboard navigation for project cards
  const handleProjectCardKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const card = (e.target as Element).closest('[data-project-card]') as HTMLElement;
      if (card) {
        e.preventDefault();
        const projectId = card.getAttribute('data-project-id');
        if (projectId) {
          showProjectDetails(projectId);
        }
      }
    }
  };

  projectsPage.addEventListener('keydown', handleProjectCardKeydown);
};

export const setProjectsLoading = (isLoading: boolean): void => {
  projectsPageState.isLoading = isLoading;

  const projectsPage = document.querySelector<HTMLElement>(PROJECTS_PAGE_SELECTOR);
  if (projectsPage) {
    const grid = projectsPage.querySelector('[data-project-cards-grid]');
    if (grid) {
      grid.innerHTML = isLoading ? renderLoadingGrid() : projectsPageState.projects.map((project, index) => renderProjectCard(project, index)).join('');
    }
  }
};
