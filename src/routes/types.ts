import type { RouteComponentId } from '@/utils/router';

export type RouteModule = {
  render: () => string;
  init?: () => void;
  cleanup?: () => void;
};

export type RouteRegistryEntry = {
  id: RouteComponentId;
  load: () => Promise<RouteModule>;
};
