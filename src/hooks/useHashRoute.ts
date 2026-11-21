import { useEffect, useState } from 'react';

export type Route = 'home' | 'guide' | 'capabilities' | 'about' | 'notfound';

const ROUTES: Record<string, Route> = {
  '#/guide': 'guide',
  '#/capabilities': 'capabilities',
  '#/about': 'about',
};

/**
 * Plain anchors such as the skip link's "#main" are not routes and must not leave the page.
 * Only "#/something" that we do not know is a missing page.
 */
export function parseRoute(hash: string): Route {
  if (!hash.startsWith('#/')) return 'home';
  const clean = hash.length > 2 ? hash.replace(/\/+$/, '') : hash; // "#/guide/" is "#/guide"
  if (clean === '#/') return 'home';
  return ROUTES[clean] ?? 'notfound';
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
