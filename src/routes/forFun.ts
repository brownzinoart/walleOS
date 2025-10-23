import { renderForFunPage, initForFunPageInteractions, cleanupForFunPage } from '@/components/ForFunPage';
import type { RouteModule } from './types';

const forFunRoute: RouteModule = {
  render: () => renderForFunPage(),
  init: () => {
    requestAnimationFrame(() => {
      initForFunPageInteractions();
    });
  },
  cleanup: () => {
    cleanupForFunPage();
  },
};

export default forFunRoute;
