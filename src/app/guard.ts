// Pure onboarding guard. Decides if the current route must redirect.
import type { Route, RouteName } from './routes';

// Reachable before onboarding is done: the wizard itself and the backup screen
// (so a new phone can restore a backup instead of redoing the wizard).
const OPEN_BEFORE_ONBOARDING: ReadonlySet<RouteName> = new Set<RouteName>(['onboarding', 'respaldo']);

/**
 * Returns the path to redirect to, or null if the route is allowed.
 * - Onboarding not done: only OPEN_BEFORE_ONBOARDING routes are allowed.
 * - Onboarding done: '/onboarding' redirects to '/'.
 */
export function resolveRedirect(route: Route, onboardingDone: boolean): string | null {
  if (!onboardingDone) {
    return OPEN_BEFORE_ONBOARDING.has(route.name) ? null : '/onboarding';
  }
  return route.name === 'onboarding' ? '/' : null;
}
