export type Route = {
  path: string;
  component: string;
  title: string;
};

export type RouterState = {
  currentRoute: string;
  routes: Map<string, Route>;
};

const routerState: RouterState = {
  currentRoute: 'home',
  routes: new Map([
    ['#home', { path: '#home', component: 'home', title: 'Home' }],
    ['#projects', { path: '#projects', component: 'projects', title: 'Projects' }],
    ['#resume', { path: '#resume', component: 'resume', title: 'Resume' }],
  ]),
};

export const getCurrentRoute = (): string => {
  const hash = window.location.hash || '#home';
  return routerState.routes.get(hash)?.component || 'home';
};

export const getRouteTitle = (route: string): string => {
  return routerState.routes.get(`#${route}`)?.title || 'Home';
};

export const navigateTo = (route: string): void => {
  const routeData = routerState.routes.get(`#${route}`);
  if (routeData) {
    window.location.hash = route;
    document.title = `${routeData.title} - WalleOS`;
  }
};

export const isRouteActive = (route: string): boolean => {
  return getCurrentRoute() === route;
};

export const initRouter = (): void => {
  // Handle initial load
  const handleHashChange = () => {
    const newRoute = getCurrentRoute();
    if (newRoute !== routerState.currentRoute) {
      routerState.currentRoute = newRoute;
      document.dispatchEvent(new CustomEvent('route:change', {
        detail: { route: newRoute }
      }));
    }
  };

  // Listen for hash changes
  window.addEventListener('hashchange', handleHashChange);

  // Handle initial route
  handleHashChange();

  // Set initial title
  const initialRoute = getCurrentRoute();
  const initialTitle = getRouteTitle(initialRoute);
  document.title = `${initialTitle} - WalleOS`;
};
