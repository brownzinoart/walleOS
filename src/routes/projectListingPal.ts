import {
  renderProjectCaseStudyPage,
  initProjectCaseStudyPage,
  cleanupProjectCaseStudyPage,
} from '@/components/ProjectCaseStudyPage';
import type { CaseStudyId } from '@/config/caseStudies';
import type { RouteModule } from './types';

const CASE_STUDY_ID: CaseStudyId = 'listingpal';

const projectListingPalRoute: RouteModule = {
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

export default projectListingPalRoute;
