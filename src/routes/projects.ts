import { renderProjectsPage, initProjectsPageInteractions, cleanupProjectsPage } from '@/components/ProjectsPage';
import type { RouteModule } from './types';

const projectsRoute: RouteModule = {
  render: () => renderProjectsPage(),
  init: () => {
    requestAnimationFrame(() => {
      void initProjectsPageInteractions();
    });
  },
  cleanup: () => {
    cleanupProjectsPage();
  },
};

export default projectsRoute;
