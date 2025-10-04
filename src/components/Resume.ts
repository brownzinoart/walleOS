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
      </div>

      <div class="resume-grid-container">
        <div class="resume-cards-column" data-resume-cards-scroll>
          ${resume.experiences.map(renderMediumExperienceCard).join('')}
        </div>
        <div class="resume-detail-column">
          <div class="resume-detail-panel">
            <div class="resume-detail-empty">
              <p class="resume-detail-placeholder text-sm text-gray-400 text-center leading-relaxed max-w-xs">
                Click on a job experience for more details.
              </p>
            </div>
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
  if (!cardsContainer) return;

  // Handle card clicks
  const handleCardClick = (event: Event) => {
    const card = (event.target as HTMLElement).closest('[data-experience-id]');
    if (!card) return;

    const experienceId = card.getAttribute('data-experience-id');
    if (!experienceId) return;

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

  // Handle keyboard navigation (Enter/Space)
  const handleCardKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleCardClick(event);
    }
  };

  // Attach event listeners using event delegation
  cardsContainer.addEventListener('click', handleCardClick);
  cardsContainer.addEventListener('keydown', handleCardKeydown);
};
