import {
  renderProjectHQPage,
  initProjectHQPage,
  cleanupProjectHQPage,
} from '@/components/ProjectHQPage';
import type { RouteModule } from './types';

const projectHQRoute: RouteModule = {
  render: () => renderProjectHQPage(),
  init: () => {
    requestAnimationFrame(() => {
      initProjectHQPage();
    });
  },
  cleanup: () => {
    cleanupProjectHQPage();
  },
};

export default projectHQRoute;
