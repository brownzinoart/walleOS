export type RouteComponentId =
  | "home"
  | "projects"
  | "project-weready"
  | "project-listingpal"
  | "project-echo"
  | "project-briefflow"
  | "project-clockit"
  | "project-hq"
  | "project-gesturegalactica"
  | "resume"
  | "playground"
  | "art-gallery"
  | "playground-games";

export type Route = {
  path: string;
  component: RouteComponentId;
  title: string;
};

export type RouterState = {
  currentRoute: RouteComponentId;
  routes: Map<string, Route>;
};

const DEFAULT_ROUTE: RouteComponentId = "home";

const routerState: RouterState = {
  currentRoute: DEFAULT_ROUTE,
  routes: new Map([
    ["#home", { path: "#home", component: "home", title: "Home" }],
    [
      "#projects",
      { path: "#projects", component: "projects", title: "Projects" },
    ],
    [
      "#project-weready",
      {
        path: "#project-weready",
        component: "project-weready",
        title: "WeReady Case Study",
      },
    ],
    [
      "#project-listingpal",
      {
        path: "#project-listingpal",
        component: "project-listingpal",
        title: "ListingPal Case Study",
      },
    ],
    [
      "#project-echo",
      {
        path: "#project-echo",
        component: "project-echo",
        title: "Echo Case Study",
      },
    ],
    [
      "#project-briefflow",
      {
        path: "#project-briefflow",
        component: "project-briefflow",
        title: "BriefFlow Case Study",
      },
    ],
    [
      "#project-clockit",
      {
        path: "#project-clockit",
        component: "project-clockit",
        title: "ClockIt Case Study",
      },
    ],
    [
      "#project-hq",
      { path: "#project-hq", component: "project-hq", title: "HQ Case Study" },
    ],
    [
      "#project-gesturegalactica",
      {
        path: "#project-gesturegalactica",
        component: "project-gesturegalactica",
        title: "Gesture Galactica Case Study",
      },
    ],
    ["#resume", { path: "#resume", component: "resume", title: "Resume" }],
    ["#playground", { path: "#playground", component: "playground", title: "Playground" }],
    [
      "#playground/art-gallery",
      { path: "#playground/art-gallery", component: "art-gallery", title: "Art Gallery" },
    ],
    [
      "#playground/games",
      { path: "#playground/games", component: "playground-games", title: "Games" },
    ],
    [
      "#playground-games",
      { path: "#playground/games", component: "playground-games", title: "Games" },
    ],
  ]),
};

export const getCurrentRoute = (): RouteComponentId => {
  const hash = window.location.hash || "#home";
  return routerState.routes.get(hash)?.component || DEFAULT_ROUTE;
};

export const getRouteTitle = (route: RouteComponentId): string => {
  return routerState.routes.get(`#${route}`)?.title || "Home";
};

export const navigateTo = (route: RouteComponentId): void => {
  const routeData = routerState.routes.get(`#${route}`);
  if (routeData) {
    window.location.hash = route;
    document.title = `${routeData.title} - WalleOS`;
  }
};

export const isRouteActive = (route: RouteComponentId): boolean => {
  return getCurrentRoute() === route;
};

export const initRouter = (): void => {
  // Handle initial load
  const handleHashChange = () => {
    const newRoute = getCurrentRoute();
    if (newRoute !== routerState.currentRoute) {
      routerState.currentRoute = newRoute;
      document.dispatchEvent(
        new CustomEvent("route:change", {
          detail: { route: newRoute },
        }),
      );
    }
  };

  // Listen for hash changes
  window.addEventListener("hashchange", handleHashChange);

  // Handle initial route
  handleHashChange();

  // Set initial title
  const initialRoute = getCurrentRoute();
  const initialTitle = getRouteTitle(initialRoute);
  document.title = `${initialTitle} - WalleOS`;
};
