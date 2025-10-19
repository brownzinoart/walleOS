const WEREADY_IMAGES = [
  '/images/projects/weready/Screenshot 2025-10-18 at 6.48.35 PM.png',
  '/images/projects/weready/Screenshot 2025-10-18 at 6.48.48 PM.png',
  '/images/projects/weready/Screenshot 2025-10-18 at 6.49.34 PM.png',
];

const STORAGE_KEY = 'weready-random-image';

export const getRandomWereadyImage = (): string => {
  if (typeof sessionStorage === 'undefined') {
    return WEREADY_IMAGES[0] || '';
  }

  const stored = sessionStorage.getItem(STORAGE_KEY);
  if (stored && WEREADY_IMAGES.includes(stored)) {
    return stored;
  }

  const randomIndex = Math.floor(Math.random() * WEREADY_IMAGES.length);
  const selected = WEREADY_IMAGES[randomIndex] || '';
  sessionStorage.setItem(STORAGE_KEY, selected);
  return selected;
};