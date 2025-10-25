import forFunContentData from './forFunContent.json';

export type BentoCardSize = 'xl' | 'lg' | 'md' | 'sm' | 'tall' | 'wide';

export interface ForFunSlide {
  title: string;
  category: string;
  backgroundImage: string;
  foregroundImage: string;
  size?: BentoCardSize;
  accentColor?: string;
  link?: string;
  external?: boolean;
}

export interface ForFunContent {
  slides: ForFunSlide[];
}

const forFunContent = forFunContentData as ForFunContent;

export const { slides: forFunSlides } = forFunContent;

const DEFAULT_BENTO_SIZES: BentoCardSize[] = ['xl', 'lg', 'tall', 'md', 'md', 'wide', 'lg'];

export const getBentoCardSize = (index: number): BentoCardSize => {
  const slide = forFunSlides[index];

  if (slide?.size) {
    return slide.size;
  }

  if (DEFAULT_BENTO_SIZES.length === 0) {
    return 'md';
  }

  const fallbackIndex = ((index % DEFAULT_BENTO_SIZES.length) + DEFAULT_BENTO_SIZES.length) % DEFAULT_BENTO_SIZES.length;
  return DEFAULT_BENTO_SIZES[fallbackIndex] ?? 'md';
};

/**
 * @deprecated Use {@link ForFunSlide} and {@link forFunSlides} instead.
 */
export interface ForFunPanelStat {
  label: string;
  value: string;
}

/**
 * @deprecated Use {@link ForFunSlide} and {@link forFunSlides} instead.
 */
export interface ForFunPanelCta {
  label: string;
  href: string;
  external?: boolean;
}

/**
 * @deprecated Use {@link ForFunSlide} and {@link forFunSlides} instead.
 */
export interface ForFunPanel {
  id: string;
  title: string;
  tagline: string;
  copy: string;
  image: string;
  stats: ForFunPanelStat[];
  cta?: ForFunPanelCta | null;
  foregroundImage?: string;
}

/**
 * @deprecated Use {@link ForFunSlide} and {@link forFunSlides} instead.
 */
export interface ForFunHero {
  heading: string;
  subheading: string;
  description: string;
}

const getPanelCopy = (slide: ForFunSlide): string =>
  `Explore "${slide.title}" — a ${slide.category} concept from the For Fun collection.`;

/**
 * @deprecated Use {@link forFunSlides} instead.
 */
export const forFunPanels: ForFunPanel[] = forFunSlides.map((slide, index) => ({
  id: `for-fun-slide-${index}`,
  title: slide.title,
  tagline: slide.category,
  copy: getPanelCopy(slide),
  image: slide.backgroundImage,
  stats: [],
  cta: null,
  foregroundImage: slide.foregroundImage,
}));

const fallbackHeroHeading = forFunSlides[0]?.title ?? 'Creative Playground';
const fallbackHeroSubheading = forFunSlides[0]?.category ?? 'For Fun Experiments';
const fallbackHeroDescription = forFunSlides.length
  ? `Explore ${forFunSlides.length} experimental concepts, starting with ${fallbackHeroHeading}.`
  : 'Explore experimental concepts from the For Fun collection.';

/**
 * @deprecated Use {@link forFunSlides} instead.
 */
export const forFunHero: ForFunHero = {
  heading: fallbackHeroHeading,
  subheading: fallbackHeroSubheading,
  description: fallbackHeroDescription,
};

export const getForFunSlide = (index: number): ForFunSlide | null => {
  if (!Number.isInteger(index) || index < 0 || index >= forFunContent.slides.length) return null;
  const slide = forFunContent.slides[index];
  return slide ?? null;
};

export default forFunContent;
