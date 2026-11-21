import { useEffect, useState } from 'react';

export type Route = 'home' | 'guide' | 'capabilities' | 'about';

const ROUTES: Record<string, Route> = {
  '#/guide': 'guide',
  '#/capabilities': 'capabilities',
  '#/about': 'about',
};

export function parseRoute(hash: string): Route {
  return ROUTES[hash] ?? 'home';
}

export function routeHref(route: Route): string {
  return route === 'home' ? '#/' : `#/${route}`;
}

/** Tiny hash router: no dependency, works on any static host without rewrite rules. */
export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash));

  useEffect(() => {
    const onChange = () => {
      setRoute(parseRoute(window.location.hash));
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  return route;
}
