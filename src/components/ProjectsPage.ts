import { forFunSlides } from '@/config/forFunContent';
import { initCarouselSlider, destroyCarouselSlider } from '@/utils/carouselSlider';

const SLIDER_SELECTOR = '.slider';

const renderNav = (): string => `
  <nav aria-label="Primary">
    <span class="nav-logo" aria-label="walleOS logo">walleOS</span>
    <div class="nav-items">
      <a href="#work" class="nav-item">Work</a>
      <a href="#studio" class="nav-item">Studio</a>
      <a href="#news" class="nav-item">News</a>
      <a href="#contact" class="nav-item">Contact</a>
    </div>
  </nav>
`;

const renderFooter = (totalSlides: number): string => `
  <footer>
    <span class="footer-label">All Projects</span>
    <div class="slider-counter" role="region" aria-label="Interactive carousel" aria-live="polite">
      <div class="count">
        <p data-active="true">1</p>
      </div>
      <span aria-hidden="true">/</span>
      <span class="total" aria-hidden="true">${totalSlides}</span>
    </div>
  </footer>
`;

const renderSlideStructure = (title: string, category: string, backgroundImage: string, foregroundImage: string): string => `
  <div class="slider">
    <div class="slide" data-active="true" data-slide-index="0">
      <div class="slide-bg-img" style="background-image: url('${backgroundImage}');"></div>
    </div>
    <div class="slide-main-img">
      <div class="slide-main-img-wrapper" data-active="true">
        <img src="${foregroundImage}" alt="${title}" loading="lazy" />
      </div>
    </div>
    <div class="slide-copy">
      <div class="slide-title">
        <h1 data-active="true">${title}</h1>
      </div>
      <div class="slide-description">
        <p data-active="true">${category}</p>
      </div>
    </div>
  </div>
`;

export const renderProjectsPage = (): string => {
  const initialSlide = forFunSlides[0];

  if (!initialSlide) {
    return `
      <section class="for-fun-carousel" data-for-fun-root>
        ${renderNav()}
        <div class="slider empty" aria-live="polite">
          <p>No experimental projects available right now.</p>
        </div>
        ${renderFooter(0)}
      </section>
    `;
  }

  return `
    <section class="for-fun-carousel" data-for-fun-root>
      ${renderNav()}
      ${renderSlideStructure(
        initialSlide.title,
        initialSlide.category,
        initialSlide.backgroundImage,
        initialSlide.foregroundImage,
      )}
      ${renderFooter(forFunSlides.length)}
    </section>
  `;
};

export const initProjectsPageInteractions = (): void => {
  if (typeof document === 'undefined' || !forFunSlides.length) {
    return;
  }

  initCarouselSlider(SLIDER_SELECTOR, forFunSlides);
};

export const cleanupProjectsPage = (): void => {
  destroyCarouselSlider(SLIDER_SELECTOR);
};
