import forFunContentData from './playgroundContent.json';

export type BentoCardSize = 'xl' | 'lg' | 'md' | 'sm' | 'tall' | 'wide';

export interface PlaygroundSlide {
  title: string;
  category: string;
  backgroundImage: string;
  foregroundImage: string;
  size?: BentoCardSize;
  accentColor?: string;
  link?: string;
  external?: boolean;
}

export interface PlaygroundContent {
  slides: PlaygroundSlide[];
}

const playgroundContent = forFunContentData as PlaygroundContent;

export const { slides: playgroundSlides } = playgroundContent;

const DEFAULT_BENTO_SIZES: BentoCardSize[] = ['xl', 'lg', 'tall', 'md', 'md', 'wide', 'lg'];

export const getBentoCardSize = (index: number): BentoCardSize => {
  const slide = playgroundSlides[index];

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
export interface PlaygroundPanel {
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
export interface PlaygroundHero {
  heading: string;
  subheading: string;
  description: string;
}

const getPanelCopy = (slide: PlaygroundSlide): string =>
  `Explore "${slide.title}" — a ${slide.category} concept from the Playground collection.`;

/**
 * @deprecated Use {@link forFunSlides} instead.
 */
export const playgroundPanels: PlaygroundPanel[] = playgroundSlides.map((slide, index) => ({
  id: `for-fun-slide-${index}`,
  title: slide.title,
  tagline: slide.category,
  copy: getPanelCopy(slide),
  image: slide.backgroundImage,
  stats: [],
  cta: null,
  foregroundImage: slide.foregroundImage,
}));

const fallbackHeroHeading = playgroundSlides[0]?.title ?? 'The Playground';
const fallbackHeroSubheading = playgroundSlides[0]?.category ?? 'Hobbies & Recognitions';
const fallbackHeroDescription = playgroundSlides.length
  ? `Explore ${playgroundSlides.length} experimental concepts, starting with ${fallbackHeroHeading}.`
  : 'Explore experimental concepts from the Playground collection.';

/**
 * @deprecated Use {@link forFunSlides} instead.
 */
export const playgroundHero: PlaygroundHero = {
  heading: fallbackHeroHeading,
  subheading: fallbackHeroSubheading,
  description: fallbackHeroDescription,
};

export const getPlaygroundSlide = (index: number): PlaygroundSlide | null => {
  if (!Number.isInteger(index) || index < 0 || index >= playgroundContent.slides.length) return null;
  const slide = playgroundContent.slides[index];
  return slide ?? null;
};

export default playgroundContent;
