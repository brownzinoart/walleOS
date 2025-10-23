import {
  renderProjectCaseStudyPage,
  initProjectCaseStudyPage,
  cleanupProjectCaseStudyPage,
  setCaseStudyReferrerRoute,
} from '@/components/ProjectCaseStudyPage';
import type { CaseStudyId } from '@/config/caseStudies';
import type { RouteComponentId } from '@/utils/router';

const CASE_STUDY_ID: CaseStudyId = 'echo';

export const renderProjectEchoPage = (): string => {
  return renderProjectCaseStudyPage(CASE_STUDY_ID);
};

export const initProjectEchoPage = (): void => {
  initProjectCaseStudyPage(CASE_STUDY_ID);
};

export const cleanupProjectEchoPage = (): void => {
  cleanupProjectCaseStudyPage(CASE_STUDY_ID);
};

export const setReferrerRoute = (route: RouteComponentId | null): void => {
  setCaseStudyReferrerRoute(CASE_STUDY_ID, route);
};
