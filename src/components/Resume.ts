import { resume } from '@/config/content';
import type { Experience } from '@/types';

const EXPERIENCE_LEVEL_COLORS = {
  'Junior': 'var(--color-neon-cyan)',
  'Mid': 'var(--color-neon-lime)',
  'Senior': 'var(--color-neon-orange)',
  'Lead': 'var(--color-neon-magenta)',
  'Principal': 'var(--color-neon-yellow)',
} as const;

const renderExperienceCard = (experience: Experience): string => {
  const levelColor = EXPERIENCE_LEVEL_COLORS[experience.experienceLevel];

  return `
    <article class="resume-timeline-card" data-experience-id="${experience.id}">
      <div class="resume-timeline-card-header">
        <div class="resume-timeline-card-level" style="background-color: ${levelColor}">
          <span class="text-xs font-bold uppercase tracking-wider">${experience.experienceLevel}</span>
        </div>
        <div class="resume-timeline-card-period text-sm text-gray-400 font-medium">
          ${experience.period}
        </div>
      </div>

      <div class="resume-timeline-card-content">
        <h3 class="resume-timeline-card-title text-xl font-bold text-white mb-1">
          ${experience.title}
        </h3>
        <h4 class="resume-timeline-card-company text-lg text-gray-300 mb-4">
          ${experience.company}
        </h4>

        <p class="resume-timeline-card-description text-gray-400 mb-4 leading-relaxed">
          ${experience.description}
        </p>

        <div class="resume-timeline-card-achievements mb-4">
          <h5 class="text-sm font-semibold text-white mb-2 uppercase tracking-wider">Key Achievements</h5>
          <ul class="space-y-2">
            ${experience.achievements.map(achievement => `
              <li class="text-sm text-gray-300 flex items-start gap-2">
                <span class="text-[var(--color-neon-cyan)] mt-1.5 flex-shrink-0">•</span>
                <span>${achievement}</span>
              </li>
            `).join('')}
          </ul>
        </div>

        <div class="resume-timeline-card-skills">
          <h5 class="text-sm font-semibold text-white mb-2 uppercase tracking-wider">Skills & Technologies</h5>
          <div class="flex flex-wrap gap-2">
            ${experience.skills.map(skill => `
              <span class="resume-skill-tag text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-300 border border-gray-700">
                ${skill}
              </span>
            `).join('')}
          </div>
          ${experience.technologies ? `
            <div class="mt-2 flex flex-wrap gap-1">
              ${experience.technologies.map(tech => `
                <span class="text-xs px-2 py-0.5 rounded bg-gray-900 text-gray-400 border border-gray-800">
                  ${tech}
                </span>
              `).join('')}
            </div>
          ` : ''}
        </div>
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

      <div class="resume-timeline-wrapper">
        <div class="resume-timeline-scroll-area" data-resume-scroll>
          <div class="resume-timeline">
            ${resume.experiences.map((experience, index) => `
              <div class="resume-timeline-item" data-experience-index="${index}">
                ${renderExperienceCard(experience)}
              </div>
            `).join('')}
          </div>
        </div>

        <div class="resume-scroll-indicators">
          <div class="resume-scroll-indicator resume-scroll-indicator--left" data-scroll-indicator="left">
            <span class="text-white">‹</span>
          </div>
          <div class="resume-scroll-indicator resume-scroll-indicator--right" data-scroll-indicator="right">
            <span class="text-white">›</span>
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
  const scrollArea = document.querySelector<HTMLElement>('[data-resume-scroll]');
  const leftIndicator = document.querySelector<HTMLElement>('[data-scroll-indicator="left"]');
  const rightIndicator = document.querySelector<HTMLElement>('[data-scroll-indicator="right"]');

  if (!scrollArea || !leftIndicator || !rightIndicator) {
    return;
  }

  const updateScrollIndicators = () => {
    const { scrollLeft, scrollWidth, clientWidth } = scrollArea;

    leftIndicator.classList.toggle('is-visible', scrollLeft > 8);
    rightIndicator.classList.toggle('is-visible', scrollLeft + clientWidth < scrollWidth - 8);
  };

  const handleScroll = () => {
    updateScrollIndicators();
  };

  const scrollLeft = () => {
    scrollArea.scrollBy({ left: -400, behavior: 'smooth' });
  };

  const scrollRight = () => {
    scrollArea.scrollBy({ left: 400, behavior: 'smooth' });
  };

  // Touch/swipe support for mobile
  let startX = 0;
  let scrollLeftStart = 0;

  const handleTouchStart = (e: TouchEvent) => {
    startX = e.touches[0].pageX - scrollArea.offsetLeft;
    scrollLeftStart = scrollArea.scrollLeft;
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!startX) return;

    e.preventDefault();
    const x = e.touches[0].pageX - scrollArea.offsetLeft;
    const walk = (x - startX) * 2;
    scrollArea.scrollLeft = scrollLeftStart - walk;
  };

  const handleTouchEnd = () => {
    startX = 0;
  };

  // Mouse wheel horizontal scrolling
  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    scrollArea.scrollBy({ left: e.deltaY, behavior: 'smooth' });
  };

  // Keyboard navigation
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      scrollLeft();
    } else if (e.key === 'ArrowRight') {
      scrollRight();
    }
  };

  // Button click handlers
  leftIndicator.addEventListener('click', scrollLeft);
  rightIndicator.addEventListener('click', scrollRight);

  // Scroll area event listeners
  scrollArea.addEventListener('scroll', handleScroll);
  scrollArea.addEventListener('wheel', handleWheel, { passive: false });
  scrollArea.addEventListener('touchstart', handleTouchStart, { passive: true });
  scrollArea.addEventListener('touchmove', handleTouchMove, { passive: false });
  scrollArea.addEventListener('touchend', handleTouchEnd);

  // Keyboard listeners (only when scroll area is focused)
  scrollArea.addEventListener('keydown', handleKeyDown);
  scrollArea.setAttribute('tabindex', '0');

  // Initialize indicators
  updateScrollIndicators();

  // Auto-scroll for demo (optional)
  setTimeout(() => {
    scrollArea.scrollBy({ left: 100, behavior: 'smooth' });
  }, 1000);
};