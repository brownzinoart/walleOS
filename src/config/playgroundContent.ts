import playgroundContentData from './playgroundContent.json';

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

const playgroundContent = playgroundContentData as PlaygroundContent;

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

export const getPlaygroundSlide = (index: number): PlaygroundSlide | null => {
  if (!Number.isInteger(index) || index < 0 || index >= playgroundContent.slides.length) return null;
  const slide = playgroundContent.slides[index];
  return slide ?? null;
};

export default playgroundContent;
