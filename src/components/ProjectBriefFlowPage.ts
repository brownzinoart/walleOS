import {
  renderProjectCaseStudyPage,
  initProjectCaseStudyPage,
  cleanupProjectCaseStudyPage,
  setCaseStudyReferrerRoute,
} from '@/components/ProjectCaseStudyPage';
import type { CaseStudyId } from '@/config/caseStudies';
import type { RouteComponentId } from '@/utils/router';

const CASE_STUDY_ID: CaseStudyId = 'briefflow';

export const renderProjectBriefFlowPage = (): string => {
  return renderProjectCaseStudyPage(CASE_STUDY_ID);
};

export const initProjectBriefFlowPage = (): void => {
  initProjectCaseStudyPage(CASE_STUDY_ID);
};

export const cleanupProjectBriefFlowPage = (): void => {
  cleanupProjectCaseStudyPage(CASE_STUDY_ID);
};

export const setReferrerRoute = (route: RouteComponentId | null): void => {
  setCaseStudyReferrerRoute(CASE_STUDY_ID, route);
};
