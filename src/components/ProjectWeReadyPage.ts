import {
  renderProjectCaseStudyPage,
  initProjectCaseStudyPage,
  cleanupProjectCaseStudyPage,
  setCaseStudyReferrerRoute,
} from '@/components/ProjectCaseStudyPage';
import type { CaseStudyId } from '@/config/caseStudies';
import type { RouteComponentId } from '@/utils/router';

const CASE_STUDY_ID: CaseStudyId = 'weready';

export const renderProjectWeReadyPage = (): string => {
  return renderProjectCaseStudyPage(CASE_STUDY_ID);
};

export const initProjectWeReadyPage = (): void => {
  initProjectCaseStudyPage(CASE_STUDY_ID);
};

export const cleanupProjectWeReadyPage = (): void => {
  cleanupProjectCaseStudyPage(CASE_STUDY_ID);
};

export const setReferrerRoute = (route: RouteComponentId | null): void => {
  setCaseStudyReferrerRoute(CASE_STUDY_ID, route);
};
