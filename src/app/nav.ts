// Pure definition of the dropdown menu (the ☰ button). No data access, no fiscal logic.

export type NavId = 'inicio' | 'calendario' | 'obligaciones' | 'registro' | 'calculadora' | 'ajustes';

export interface NavItem {
  id: NavId;
  /** Hash route (no '#') the link opens. */
  ruta: string;
}

/** Order of the menu. Perfil, Notificaciones, Respaldo and Acerca de live inside Ajustes (V14). */
export const NAV_ITEMS: readonly NavItem[] = [
  { id: 'inicio', ruta: '/' },
  { id: 'calendario', ruta: '/calendario' },
  { id: 'obligaciones', ruta: '/obligaciones' },
  { id: 'registro', ruta: '/registro' },
  { id: 'calculadora', ruta: '/calculadora' },
  { id: 'ajustes', ruta: '/ajustes' },
];

/** The menu entry that contains `path` (Obligación detail belongs to Obligaciones, and so on). */
export function activeNav(path: string): NavId | null {
  for (const item of NAV_ITEMS) {
    if (item.ruta === '/') {
      if (path === '/') return item.id;
    } else if (path === item.ruta || path.startsWith(item.ruta + '/')) {
      return item.id;
    }
  }
  return null;
}

/** The menu is hidden on the onboarding path (the guard would redirect every other link). */
export function showMenu(onboardingDone: boolean): boolean {
  return onboardingDone;
}
