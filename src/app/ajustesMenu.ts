// Pure definition of the V14 hub entries. No fiscal logic; no data access.

export type AjusteId = 'perfil' | 'notificaciones' | 'respaldo' | 'feriados' | 'apariencia' | 'acerca';

export interface AjusteEntry {
  id: AjusteId;
  /** Hash route (no '#'). null while the view does not exist yet. */
  ruta: string | null;
}

/** Order as in 03 (V14). Entries with `ruta: null` are shown as "próximamente". */
export const AJUSTES_MENU: readonly AjusteEntry[] = [
  { id: 'perfil', ruta: '/ajustes/perfil' },
  { id: 'notificaciones', ruta: '/ajustes/notificaciones' },
  { id: 'respaldo', ruta: '/ajustes/respaldo' },
  { id: 'feriados', ruta: null },
  { id: 'apariencia', ruta: '/ajustes/apariencia' },
  { id: 'acerca', ruta: '/ajustes/acerca' },
];

export function isAvailable(entry: AjusteEntry): boolean {
  return entry.ruta !== null;
}

/** Entries that already open a view. */
export function availableEntries(menu: readonly AjusteEntry[] = AJUSTES_MENU): AjusteEntry[] {
  return menu.filter(isAvailable);
}
