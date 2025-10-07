import { resume } from '@/config/content';
import type { Experience, ExperienceContext, ExperienceContextListener } from '@/types';

// NOTE: This module is currently unused in the inline chat implementation.
// It's preserved for potential future use or features that rely on global
// experience context tracking. Consider removing if no longer needed.

const listeners = new Set<ExperienceContextListener>();

const createEmptyContext = (): ExperienceContext => ({
  experienceId: null,
  experience: null,
  timestamp: new Date(0),
});

let currentContext: ExperienceContext = createEmptyContext();

const findExperienceById = (experienceId: string): Experience | undefined => {
  return resume.experiences.find((experience) => experience.id === experienceId);
};

export const getExperienceContext = (): ExperienceContext => currentContext;

export const hasActiveContext = (): boolean => Boolean(currentContext.experienceId && currentContext.experience);

const notifyListeners = (nextContext: ExperienceContext, previousContext: ExperienceContext): void => {
  listeners.forEach((listener) => listener(nextContext, previousContext));
};

export const setExperienceContext = (experienceId: string | null): void => {
  const previousContext = currentContext;

  if (!experienceId) {
    currentContext = {
      experienceId: null,
      experience: null,
      timestamp: new Date(),
    };
    notifyListeners(currentContext, previousContext);
    return;
  }

  const experience = findExperienceById(experienceId) ?? null;

  currentContext = {
    experienceId: experience ? experience.id : null,
    experience,
    timestamp: new Date(),
  };

  notifyListeners(currentContext, previousContext);
};

export const clearExperienceContext = (): void => {
  setExperienceContext(null);
};

export const subscribeToExperienceContext = (
  listener: ExperienceContextListener,
): (() => void) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};
