// Reactive hash router for Svelte 5. All matching logic lives in routes.ts.
import { buildPath, parseRoute, type Route, type RouteName } from './routes';

export const router = $state<{ route: Route }>({
  route: parseRoute(typeof window === 'undefined' ? '' : window.location.hash),
});

function sync(): void {
  router.route = parseRoute(window.location.hash);
}

/** Starts listening to hash changes. Returns a cleanup function. */
export function initRouter(): () => void {
  sync();
  window.addEventListener('hashchange', sync);
  return () => window.removeEventListener('hashchange', sync);
}

/** Navigates to a path like '/calendario'. With replace, no history entry is added. */
export function navigate(path: string, replace = false): void {
  const hash = '#' + path;
  if (replace) {
    const url = window.location.pathname + window.location.search + hash;
    window.history.replaceState(null, '', url);
    sync();
  } else {
    window.location.hash = hash;
  }
}

export function navigateTo(name: Exclude<RouteName, 'no-encontrada'>, params: Record<string, string> = {}, replace = false): void {
  navigate(buildPath(name, params), replace);
}
