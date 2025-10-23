import {
  renderProjectClockItPage,
  initProjectClockItPage,
  cleanupProjectClockItPage,
} from '@/components/ProjectClockItPage';
import type { RouteModule } from './types';

const projectClockItRoute: RouteModule = {
  render: () => renderProjectClockItPage(),
  init: () => {
    requestAnimationFrame(() => {
      initProjectClockItPage();
    });
  },
  cleanup: () => {
    cleanupProjectClockItPage();
  },
};

export default projectClockItRoute;
