import { renderResume, initResumeInteractions, cleanupResumeInteractions } from '@/components/Resume';
import type { RouteModule } from './types';

const resumeRoute: RouteModule = {
  render: () => renderResume(),
  init: () => {
    initResumeInteractions();
  },
  cleanup: () => {
    cleanupResumeInteractions();
  },
};

export default resumeRoute;
