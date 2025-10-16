import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
type GsapTimeline = ReturnType<typeof gsap.timeline>;

import type { ForFunSlide } from '@/config/forFunContent';
import { prefersReducedMotion } from '@/utils/performance';

type CarouselDirection = 'down' | 'up';
type CleanupFn = () => void;

interface CarouselElements {
  root: HTMLElement;
  slider: HTMLElement;
  mainImage: HTMLElement | null;
  titleContainer: HTMLElement | null;
  descriptionContainer: HTMLElement | null;
  counterContainer: HTMLElement | null;
}

interface CarouselState {
  currentIndex: number;
  totalSlides: number;
  isAnimating: boolean;
  scrollAllowed: boolean;
  lastScrollTimestamp: number;
  activeTimeline: GsapTimeline | null;
}

interface CarouselInstance {
  slides: ForFunSlide[];
  elements: CarouselElements;
  state: CarouselState;
  cleanupFns: CleanupFn[];
}

const SCROLL_THROTTLE_MS = 1000;
const SCROLL_RESET_DELAY_MS = 100;
const TOUCH_THRESHOLD_PX = 30;

const instances = new WeakMap<HTMLElement, CarouselInstance>();

const resolveElement = (target: string | HTMLElement): HTMLElement | null => {
  if (typeof document === 'undefined') {
    return null;
  }

  if (typeof target === 'string') {
    return document.querySelector<HTMLElement>(target);
  }

  return target ?? null;
};

gsap.registerPlugin(CustomEase);

const CAROUSEL_EASE = CustomEase.create('carouselEase', '.87,0,.13,1');

const getClipPathStart = (direction: CarouselDirection, invert = false): string => {
  const fromTop = invert ? direction === 'down' : direction === 'up';
  return fromTop
    ? 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)'
    : 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)';
};

const createSlide = (
  slide: ForFunSlide,
  direction: CarouselDirection,
  index: number,
): { element: HTMLElement; background: HTMLElement } => {
  const slideElement = document.createElement('div');
  slideElement.className = 'slide';
  slideElement.setAttribute('data-slide-index', String(index));
  slideElement.setAttribute('data-active', 'false');

  const background = document.createElement('div');
  background.className = 'slide-bg-img';
  background.style.setProperty('background-image', `url('${slide.backgroundImage}')`);
  background.style.setProperty('transform-origin', 'center center');

  slideElement.appendChild(background);

  gsap.set(background, {
    clipPath: getClipPathStart(direction),
    scale: 1.05,
  });

  return { element: slideElement, background };
};

const createMainImageWrapper = (
  slide: ForFunSlide,
  direction: CarouselDirection,
): { wrapper: HTMLElement; image: HTMLImageElement } => {
  const wrapper = document.createElement('div');
  wrapper.className = 'slide-main-img-wrapper';
  wrapper.setAttribute('data-active', 'false');

  const image = document.createElement('img');
  image.src = slide.foregroundImage;
  image.alt = slide.title;
  image.loading = 'lazy';

  wrapper.appendChild(image);

  gsap.set(wrapper, {
    clipPath: getClipPathStart(direction, true),
  });

  gsap.set(image, {
    yPercent: direction === 'down' ? 50 : -50,
  });

  return { wrapper, image };
};

const createTextElements = (
  slide: ForFunSlide,
  direction: CarouselDirection,
): { title: HTMLHeadingElement; description: HTMLParagraphElement } => {
  const title = document.createElement('h1');
  title.textContent = slide.title;
  title.setAttribute('data-active', 'false');

  const description = document.createElement('p');
  description.textContent = slide.category;
  description.setAttribute('data-active', 'false');

  gsap.set(title, {
    y: direction === 'down' ? 50 : -50,
    opacity: 0,
  });

  gsap.set(description, {
    y: direction === 'down' ? 20 : -20,
    opacity: 0,
  });

  return { title, description };
};

const createCounterElement = (index: number, direction: CarouselDirection): HTMLParagraphElement => {
  const counter = document.createElement('p');
  counter.textContent = String(index + 1);
  counter.setAttribute('data-active', 'false');

  gsap.set(counter, {
    y: direction === 'down' ? 18 : -18,
    opacity: 0,
  });

  return counter;
};

const getCarouselElements = (slider: HTMLElement): CarouselElements => {
  const root = slider.closest<HTMLElement>('[data-for-fun-root]') ?? slider;
  return {
    root,
    slider,
    mainImage: root.querySelector<HTMLElement>('.slide-main-img'),
    titleContainer: root.querySelector<HTMLElement>('.slide-title'),
    descriptionContainer: root.querySelector<HTMLElement>('.slide-description'),
    counterContainer: root.querySelector<HTMLElement>('.slider-counter .count'),
  };
};

const cleanupInstance = (slider: HTMLElement): void => {
  const existing = instances.get(slider);

  if (!existing) {
    return;
  }

  existing.cleanupFns.forEach((fn) => fn());
  existing.cleanupFns.length = 0;

  if (existing.state.activeTimeline) {
    existing.state.activeTimeline.kill();
    existing.state.activeTimeline = null;
  }

  instances.delete(slider);
};

const animateSlide = (
  instance: CarouselInstance,
  direction: CarouselDirection,
): void => {
  const { slides, state, elements } = instance;
  const { slider, mainImage, titleContainer, descriptionContainer, counterContainer } = elements;

  if (state.isAnimating || !state.scrollAllowed || slides.length < 2) {
    return;
  }

  state.lastScrollTimestamp = Date.now();
  state.isAnimating = true;
  state.scrollAllowed = false;

  const nextIndex =
    (state.currentIndex + (direction === 'down' ? 1 : -1) + state.totalSlides) % state.totalSlides;
  const nextSlide = slides[nextIndex];

  if (!nextSlide) {
    state.isAnimating = false;
    state.scrollAllowed = true;
    return;
  }

  const currentSlideElement = slider.querySelector<HTMLElement>('.slide[data-active="true"]');
  const currentBackground = currentSlideElement?.querySelector<HTMLElement>('.slide-bg-img') ?? null;
  const currentMainWrapper = mainImage?.querySelector<HTMLElement>(
    '.slide-main-img-wrapper[data-active="true"]',
  ) ?? null;
  const currentMainImage = currentMainWrapper?.querySelector<HTMLImageElement>('img') ?? null;
  const currentTitle = titleContainer?.querySelector<HTMLElement>('h1[data-active="true"]') ?? null;
  const currentDescription =
    descriptionContainer?.querySelector<HTMLElement>('p[data-active="true"]') ?? null;
  const currentCounter = counterContainer?.querySelector<HTMLElement>('p[data-active="true"]') ?? null;

  const newSlide = createSlide(nextSlide, direction, nextIndex);
  slider.appendChild(newSlide.element);

  const newMain = createMainImageWrapper(nextSlide, direction);
  mainImage?.appendChild(newMain.wrapper);

  const newText = createTextElements(nextSlide, direction);
  titleContainer?.appendChild(newText.title);
  descriptionContainer?.appendChild(newText.description);

  const newCounter = counterContainer ? createCounterElement(nextIndex, direction) : null;

  if (newCounter && counterContainer) {
    counterContainer.appendChild(newCounter);
  }

  const reducedMotion = prefersReducedMotion();
  const duration = reducedMotion ? 0.01 : 1.25;
  const ease = reducedMotion ? 'linear' : CAROUSEL_EASE;

  state.activeTimeline?.kill();

  const timeline = gsap.timeline({
    defaults: { duration, ease },
    onComplete: () => {
      currentSlideElement?.remove();
      currentMainWrapper?.remove();
      currentTitle?.remove();
      currentDescription?.remove();
      currentCounter?.remove();

      newSlide.element.setAttribute('data-active', 'true');
      newMain.wrapper.setAttribute('data-active', 'true');
      newText.title.setAttribute('data-active', 'true');
      newText.description.setAttribute('data-active', 'true');
      if (newCounter) {
        newCounter.setAttribute('data-active', 'true');
      }

      state.currentIndex = nextIndex;
      state.isAnimating = false;
      state.activeTimeline = null;

      window.setTimeout(() => {
        state.scrollAllowed = true;
      }, SCROLL_RESET_DELAY_MS);
    },
  });

  timeline.to(newSlide.background, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', scale: 1 }, 0);

  if (currentBackground) {
    timeline.to(currentBackground, { scale: 1.5 }, 0);
  }

  timeline.to(
    newMain.wrapper,
    { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' },
    0,
  );

  if (currentMainWrapper) {
    timeline.to(
      currentMainWrapper,
      { yPercent: direction === 'down' ? -50 : 50 },
      0,
    );
  }

  timeline.to(newMain.image, { yPercent: 0 }, 0);

  if (currentMainImage) {
    timeline.to(currentMainImage, { yPercent: direction === 'down' ? -50 : 50 }, 0);
  }

  if (currentTitle) {
    timeline.to(currentTitle, { y: direction === 'down' ? -50 : 50, opacity: 0 }, 0);
  }

  timeline.to(newText.title, { y: 0, opacity: 1 }, 0);

  if (currentDescription) {
    timeline.to(currentDescription, { y: direction === 'down' ? -20 : 20, opacity: 0 }, 0);
  }

  timeline.to(newText.description, { y: 0, opacity: 1 }, 0);

  if (currentCounter) {
    timeline.to(currentCounter, { y: direction === 'down' ? -18 : 18, opacity: 0 }, 0);
  }

  if (newCounter) {
    timeline.to(newCounter, { y: 0, opacity: 1 }, 0);
  }

  state.activeTimeline = timeline;
};

export const initCarouselSlider = (target: string | HTMLElement, slides: ForFunSlide[]): void => {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return;
  }

  const slider = resolveElement(target);

  if (!slider || slides.length === 0) {
    return;
  }

  cleanupInstance(slider);

  if (slides.length < 2) {
    // no interactions needed, just render initial state
    instances.set(slider, {
      slides,
      elements: getCarouselElements(slider),
      state: {
        currentIndex: 0,
        totalSlides: slides.length,
        isAnimating: false,
        scrollAllowed: true,
        lastScrollTimestamp: 0,
        activeTimeline: null,
      },
      cleanupFns: [],
    });
    return;
  }

  const elements = getCarouselElements(slider);

  const instance: CarouselInstance = {
    slides,
    elements,
    state: {
      currentIndex: 0,
      totalSlides: slides.length,
      isAnimating: false,
      scrollAllowed: true,
      lastScrollTimestamp: 0,
      activeTimeline: null,
    },
    cleanupFns: [],
  };

  // Track whether we've gently shifted focus to the carousel due to
  // a keyboard arrow interaction (to avoid stealing focus on load).
  let hasFocusedRootOnKeyboard = false;

  const handleScroll = (direction: CarouselDirection) => {
    const now = Date.now();

    if (now - instance.state.lastScrollTimestamp < SCROLL_THROTTLE_MS) {
      return;
    }

    animateSlide(instance, direction);
  };

  const handleWheel = (event: WheelEvent) => {
    event.preventDefault();
    if (event.deltaY === 0) {
      return;
    }
    handleScroll(event.deltaY > 0 ? 'down' : 'up');
  };

  let touchStartY = 0;
  let lastTouchY = 0;
  let isTouchActive = false;

  const onTouchStart = (event: TouchEvent) => {
    if (!event.touches || event.touches.length === 0) {
      return;
    }
    const touch = event.touches[0];
    if (!touch) {
      return;
    }
    isTouchActive = true;
    touchStartY = touch.clientY;
    lastTouchY = touchStartY;
  };

  const onTouchMove = (event: TouchEvent) => {
    if (!isTouchActive || !event.touches || event.touches.length === 0) {
      return;
    }
    const touch = event.touches[0];
    if (!touch) {
      return;
    }
    lastTouchY = touch.clientY;
    event.preventDefault();
  };

  const onTouchEnd = () => {
    if (!isTouchActive) {
      return;
    }

    const deltaY = lastTouchY - touchStartY;

    if (Math.abs(deltaY) > TOUCH_THRESHOLD_PX) {
      handleScroll(deltaY < 0 ? 'down' : 'up');
    }

    isTouchActive = false;
  };

  const isRootInteractable = (): boolean => {
    const root = elements.root;
    if (!root || root.offsetParent === null) {
      return false;
    }
    const rect = root.getBoundingClientRect();
    const inViewport = rect.bottom > 0 && rect.right > 0 && rect.top < window.innerHeight && rect.left < window.innerWidth;
    const isFocused = document.activeElement === root || root.contains(document.activeElement);
    return inViewport && isFocused;
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
      return;
    }

    // If the carousel root isn't interactable yet (e.g., not focused),
    // gently guide focus on first arrow key press without scrolling.
    if (!isRootInteractable()) {
      if (!hasFocusedRootOnKeyboard) {
        elements.root.focus({ preventScroll: true });
        hasFocusedRootOnKeyboard = true;
      }
      return;
    }

    event.preventDefault();
    handleScroll(event.key === 'ArrowDown' ? 'down' : 'up');
  };

  // Scope scroll/touch events to the carousel root instead of window
  elements.root.addEventListener('wheel', handleWheel, { passive: false });
  elements.root.addEventListener('touchstart', onTouchStart, { passive: false });
  elements.root.addEventListener('touchmove', onTouchMove, { passive: false });
  elements.root.addEventListener('touchend', onTouchEnd, { passive: false });
  // Keep keyboard on window for accessibility but guard by focus/visibility
  window.addEventListener('keydown', onKeyDown);

  instance.cleanupFns.push(() => elements.root.removeEventListener('wheel', handleWheel));
  instance.cleanupFns.push(() => elements.root.removeEventListener('touchstart', onTouchStart));
  instance.cleanupFns.push(() => elements.root.removeEventListener('touchmove', onTouchMove));
  instance.cleanupFns.push(() => elements.root.removeEventListener('touchend', onTouchEnd));
  instance.cleanupFns.push(() => window.removeEventListener('keydown', onKeyDown));

  instances.set(slider, instance);
};

export const destroyCarouselSlider = (target: string | HTMLElement): void => {
  const slider = resolveElement(target);

  if (!slider) {
    return;
  }

  cleanupInstance(slider);
};
