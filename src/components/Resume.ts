import { resume } from '@/config/content';
import type { Experience } from '@/types';

let selectedExperienceId: string | null = null;

const EXPERIENCE_LEVEL_COLORS = {
  'Junior': 'var(--color-neon-cyan)',
  'Mid': 'var(--color-neon-lime)',
  'Senior': 'var(--color-neon-orange)',
  'Lead': 'var(--color-neon-magenta)',
  'Principal': 'var(--color-neon-yellow)',
} as const;

const renderMediumExperienceCard = (experience: Experience): string => {
  const levelColor = EXPERIENCE_LEVEL_COLORS[experience.experienceLevel];
  const isSelected = selectedExperienceId === experience.id;
  const briefDescription = experience.description.substring(0, 120) + '...';

  return `
    <article 
      class="resume-medium-card ${isSelected ? 'resume-medium-card--selected' : ''}" 
      data-experience-id="${experience.id}"
      role="button"
      tabindex="0"
      aria-pressed="${isSelected}"
    >
      <div class="resume-medium-card-header">
        <div class="resume-medium-card-level" style="background-color: ${levelColor}">
          <span class="text-xs font-bold uppercase tracking-wider">${experience.experienceLevel}</span>
        </div>
        <div class="resume-medium-card-period text-sm text-gray-400 font-medium">
          ${experience.period}
        </div>
      </div>
      
      <div class="resume-medium-card-content">
        <h3 class="resume-medium-card-title text-lg font-bold text-white mb-1">
          ${experience.title}
        </h3>
        <h4 class="resume-medium-card-company text-base text-gray-300 mb-3">
          ${experience.company}
        </h4>
        <p class="resume-medium-card-brief text-sm text-gray-400 leading-relaxed">
          ${briefDescription}
        </p>
      </div>
    </article>
  `;
};

const renderDetailPlaceholder = (): string => `
  <div class="resume-detail-content resume-detail-empty">
    <p class="resume-detail-placeholder text-sm text-gray-400 text-center leading-relaxed max-w-xs">
      Click on a card for more info
    </p>
  </div>
`;

const renderDetailContent = (experience: Experience): string => {
  const titleId = `resume-detail-title-${experience.id}`;
  const descriptionId = `resume-detail-description-${experience.id}`;
  const achievementsHeadingId = `${titleId}-achievements`;
  const skillsHeadingId = `${titleId}-skills`;
  const techHeadingId = `${titleId}-technologies`;

  const achievementsSection = experience.achievements?.length
    ? `
      <section class="resume-detail-section" aria-labelledby="${achievementsHeadingId}">
        <h3 class="resume-detail-section-title" id="${achievementsHeadingId}">Key Achievements</h3>
        <ul class="resume-detail-achievements">
          ${experience.achievements.map((achievement) => `
            <li class="resume-detail-achievement-item">
              <span class="resume-detail-achievement-icon" aria-hidden="true">&#10003;</span>
              <span class="resume-detail-achievement-text">${achievement}</span>
            </li>
          `).join('')}
        </ul>
      </section>
    `
    : '';

  const skillsSection = experience.skills?.length
    ? `
      <section class="resume-detail-section" aria-labelledby="${skillsHeadingId}">
        <h3 class="resume-detail-section-title" id="${skillsHeadingId}">Core Skills</h3>
        <div class="resume-detail-skills" role="list">
          ${experience.skills.map((skill) => `
            <span class="resume-detail-skill-tag" role="listitem">${skill}</span>
          `).join('')}
        </div>
      </section>
    `
    : '';

  const technologiesSection = experience.technologies?.length
    ? `
      <section class="resume-detail-section" aria-labelledby="${techHeadingId}">
        <h3 class="resume-detail-section-title" id="${techHeadingId}">Technologies</h3>
        <div class="resume-detail-technologies" role="list">
          ${experience.technologies.map((tech) => `
            <span class="resume-detail-tech-badge" role="listitem">${tech}</span>
          `).join('')}
        </div>
      </section>
    `
    : '';

  return `
    <article class="resume-detail-content" aria-labelledby="${titleId}" aria-describedby="${descriptionId}" tabindex="0">
      <header class="resume-detail-header">
        <h2 class="resume-detail-title" id="${titleId}">${experience.title}</h2>
        <p class="resume-detail-company">${experience.company}</p>
        <p class="resume-detail-period">${experience.period}</p>
      </header>
      <p class="resume-detail-description" id="${descriptionId}">
        ${experience.description}
      </p>
      ${achievementsSection}
      ${skillsSection}
      ${technologiesSection}
    </article>
  `;
};

export const renderResume = (): string => `
  <section class="resume-section" data-section-id="resume">
    <div class="resume-container max-w-7xl mx-auto">
      <div class="resume-header mb-12">
        <h1 class="resume-title text-4xl md:text-5xl font-black text-white mb-6">
          Professional Journey
        </h1>
        <p class="resume-summary text-lg text-gray-400 max-w-3xl leading-relaxed">
          ${resume.summary}
        </p>
        <div class="resume-header-actions mt-8">
          <a
            href="${resume.resumeFileUrl || '/resume.pdf'}"
            download="Wally_Resume.pdf"
            class="resume-download-button inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-bold rounded-md border-2 border-gray-700 hover:border-neon-cyan transition-all"
            aria-label="Download resume as PDF"
          >
            <span aria-hidden="true">⬇️</span>
            <span>Download Resume</span>
          </a>
        </div>
      </div>

      <div class="resume-grid-container">
        <div class="resume-cards-column" data-resume-cards-scroll>
          ${resume.experiences.map(renderMediumExperienceCard).join('')}
        </div>
        <div class="resume-detail-column">
          <div
            class="resume-detail-panel resume-detail-fade-in"
            data-detail-content
            role="region"
            aria-live="polite"
            aria-atomic="true"
          >
            ${renderDetailPlaceholder()}
          </div>
        </div>
      </div>

      <div class="resume-skills-section mt-16">
        <h2 class="text-2xl font-bold text-white mb-6">Core Skills</h2>
        <div class="flex flex-wrap gap-3">
          ${resume.skills.map(skill => `
            <span class="resume-core-skill text-sm px-4 py-2 rounded-full bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700 transition-colors cursor-default">
              ${skill}
            </span>
          `).join('')}
        </div>
      </div>

      <div class="resume-education-section mt-12">
        <h2 class="text-2xl font-bold text-white mb-6">Education</h2>
        <div class="resume-education-card bg-gray-800 rounded-lg p-6 border border-gray-700">
          ${resume.education.map(edu => `
            <div class="resume-education-item">
              <h3 class="text-lg font-semibold text-white">${edu.degree}</h3>
              <p class="text-gray-300">${edu.school}</p>
              <p class="text-gray-400 text-sm">${edu.year}</p>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  </section>
`;

export const initResumeInteractions = (): void => {
  const cardsContainer = document.querySelector('[data-resume-cards-scroll]');
  const detailPanel = document.querySelector<HTMLElement>('.resume-detail-panel[data-detail-content]');
  let detailTransitionTimeout: number | null = null;
  if (!cardsContainer) return;

  // Handle card clicks
  const handleCardClick = (event: Event) => {
    const card = (event.target as HTMLElement).closest('[data-experience-id]');
    if (!card) return;

    const experienceId = card.getAttribute('data-experience-id');
    if (!experienceId) return;

    if (selectedExperienceId === experienceId) {
      return;
    }

    // Update selected state
    selectedExperienceId = experienceId;

    // Update UI - remove selected class from all cards
    cardsContainer.querySelectorAll('.resume-medium-card').forEach(c => {
      c.classList.remove('resume-medium-card--selected');
      c.setAttribute('aria-pressed', 'false');
    });

    // Add selected class to clicked card
    card.classList.add('resume-medium-card--selected');
    card.setAttribute('aria-pressed', 'true');

    // Dispatch custom event for detail panel to listen to (will be used in phase 3)
    const selectionEvent = new CustomEvent('experience-selected', {
      detail: { experienceId }
    });
    document.dispatchEvent(selectionEvent);
  };

  // Attach event listeners using event delegation
  cardsContainer.addEventListener('click', handleCardClick);
  cardsContainer.addEventListener('keydown', (event) => {
    if ((event as KeyboardEvent).key === 'Enter' || (event as KeyboardEvent).key === ' ') {
      event.preventDefault();
      handleCardClick(event);
    }
  });

  const updateDetailPanel = (content: string) => {
    if (!detailPanel) return;

    detailPanel.classList.remove('resume-detail-fade-in');
    detailPanel.classList.add('resume-detail-fade-out');

    if (detailTransitionTimeout !== null) {
      window.clearTimeout(detailTransitionTimeout);
    }

    detailTransitionTimeout = window.setTimeout(() => {
      detailPanel.innerHTML = content;
      detailPanel.classList.remove('resume-detail-fade-out');
      // Force reflow to restart the fade-in animation
      void detailPanel.offsetWidth;
      detailPanel.classList.add('resume-detail-fade-in');
      detailTransitionTimeout = null;
    }, 150);
  };

  document.addEventListener('experience-selected', (event: Event) => {
    if (!detailPanel) return;

    const customEvent = event as CustomEvent<{ experienceId?: string }>;
    const experienceId = customEvent.detail?.experienceId;

    if (!experienceId) {
      updateDetailPanel(renderDetailPlaceholder());
      return;
    }

    const experience = resume.experiences.find((item) => item.id === experienceId);

    if (!experience) {
      updateDetailPanel(renderDetailPlaceholder());
      return;
    }

    updateDetailPanel(renderDetailContent(experience));
  });
};
