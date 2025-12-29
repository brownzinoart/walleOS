import type { RouteComponentId } from "@/utils/router";
import type { RouteModule } from "./types";

type LazyRouteMap = Partial<
  Record<RouteComponentId, () => Promise<RouteModule>>
>;

const lazyRouteLoaders: LazyRouteMap = {
  projects: () => import("./projects").then((mod) => mod.default),
  "project-weready": () =>
    import("./projectWeReady").then((mod) => mod.default),
  "project-listingpal": () =>
    import("./projectListingPal").then((mod) => mod.default),
  "project-echo": () => import("./projectEcho").then((mod) => mod.default),
  "project-briefflow": () =>
    import("./projectBriefFlow").then((mod) => mod.default),
  "project-clockit": () =>
    import("./projectClockIt").then((mod) => mod.default),
  "project-hq": () => import("./projectHQ").then((mod) => mod.default),
  "project-gesturegalactica": () =>
    import("./projectGestureGalactica").then((mod) => mod.default),
  resume: () => import("./resume").then((mod) => mod.default),
  "playground": () => import("./playground/index"),
  "art-gallery": () => import("./artGallery").then((mod) => mod.default),
  "playground-games": () => import("./playground/games"),
};

const routeModuleCache = new Map<RouteComponentId, RouteModule>();

export const hasLazyRoute = (routeId: RouteComponentId): boolean => {
  return typeof lazyRouteLoaders[routeId] === "function";
};

export const loadRouteModule = async (
  routeId: RouteComponentId,
): Promise<RouteModule | null> => {
  if (!hasLazyRoute(routeId)) {
    return null;
  }

  const cached = routeModuleCache.get(routeId);

  if (cached) {
    return cached;
  }

  const loader = lazyRouteLoaders[routeId];

  if (!loader) {
    return null;
  }

  const module = await loader();
  routeModuleCache.set(routeId, module);
  return module;
};
