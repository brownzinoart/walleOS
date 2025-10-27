import type { RouteComponentId } from '@/utils/router';

export const MAIN_CONTENT_BASE_CLASSES = 'main-content-area w-full min-h-screen';
export const MAIN_CONTENT_DEFAULT_PADDING = 'p-6 pt-20 md:p-8 md:pt-20 lg:p-12';
export const MAIN_CONTENT_FOR_FUN_PADDING = 'for-fun-container';

export const getMainContentPaddingClass = (
  route: RouteComponentId,
): string => (route === 'playground' ? MAIN_CONTENT_FOR_FUN_PADDING : MAIN_CONTENT_DEFAULT_PADDING);
