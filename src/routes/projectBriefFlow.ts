import {
  renderProjectCaseStudyPage,
  initProjectCaseStudyPage,
  cleanupProjectCaseStudyPage,
} from '@/components/ProjectCaseStudyPage';
import type { CaseStudyId } from '@/config/caseStudies';
import type { RouteModule } from './types';

const CASE_STUDY_ID: CaseStudyId = 'briefflow';

const projectBriefFlowRoute: RouteModule = {
  render: () => renderProjectCaseStudyPage(CASE_STUDY_ID),
  init: () => {
    requestAnimationFrame(() => {
      initProjectCaseStudyPage(CASE_STUDY_ID);
    });
  },
  cleanup: () => {
    cleanupProjectCaseStudyPage(CASE_STUDY_ID);
  },
};

export default projectBriefFlowRoute;
