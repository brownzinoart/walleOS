import type { RouteComponentId } from '@/utils/router';

export const MAIN_CONTENT_BASE_CLASSES = 'main-content-area w-full min-h-screen';
export const MAIN_CONTENT_DEFAULT_PADDING = 'p-6 pt-20 md:p-8 md:pt-20 lg:p-12';
export const MAIN_CONTENT_PLAYGROUND_PADDING = 'playground-container';

export const getMainContentPaddingClass = (
  route: RouteComponentId,
): string => {
  // Use playground container padding for playground and related routes
  if (route === 'playground' || route === 'art-gallery' || route === 'playground-games') {
    return MAIN_CONTENT_PLAYGROUND_PADDING;
  }
  return MAIN_CONTENT_DEFAULT_PADDING;
};
