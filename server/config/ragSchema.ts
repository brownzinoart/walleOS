export type CategoryHint = 'home' | 'resume';
export type CategoryPriorityMap = Record<string, number>;

export const CATEGORY_PRIORITY_BASE: CategoryPriorityMap = {
  narrative: 1.0,
  portfolio: 0.95,
  experience: 0.9,
  resume: 0.9,
  skills: 0.85,
  faq: 0.8,
  funfacts: 0.7,
  metrics: 0.7,
};

export const CATEGORY_PRIORITY_HOME: CategoryPriorityMap = {
  narrative: 1.0,
  portfolio: 0.95,
  skills: 0.9,
  experience: 0.85,
  resume: 0.85,
  metrics: 0.8,
  faq: 0.75,
  funfacts: 0.7,
};

export const CATEGORY_PRIORITY_RESUME: CategoryPriorityMap = {
  experience: 1.0,
  resume: 1.0,
  portfolio: 0.95,
  metrics: 0.9,
  skills: 0.85,
  narrative: 0.8,
  faq: 0.7,
  funfacts: 0.6,
};

export function getCategoryPriorityMapFromHint(hint?: CategoryHint): CategoryPriorityMap {
  if (hint === 'resume') {
    return CATEGORY_PRIORITY_RESUME;
  }

  return CATEGORY_PRIORITY_HOME;
}
