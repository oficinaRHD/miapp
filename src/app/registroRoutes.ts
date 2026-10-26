import type { TipoMovimiento } from '../data/models';

/** What the V06/V07 paths mean. `null` = not a registro path. */
export type RegistroRoute =
  | { kind: 'list' }
  | { kind: 'new' }
  | { kind: 'edit'; id: string };

/**
 * Reads the registro paths of 03: '/registro', '/registro/nuevo', '/registro/:id'.
 * Works on the path only (no '#', no query). Trailing slash is ignored.
 */
export function registroRoute(path: string): RegistroRoute | null {
  const clean = path.split('?')[0]?.replace(/\/+$/, '') ?? '';
  if (clean === '/registro') return { kind: 'list' };
  if (clean === '/registro/nuevo') return { kind: 'new' };
  const m = /^\/registro\/([^/]+)$/.exec(clean);
  if (!m || m[1] === undefined) return null;
  let id = m[1];
  try {
    id = decodeURIComponent(id);
  } catch {
    // malformed escape: keep the raw text (same rule as the router)
  }
  return { kind: 'edit', id };
}

/** '#/registro/nuevo?tipo=gasto' gives 'gasto'; anything else gives 'ingreso'. */
export function tipoFromHash(hash: string): TipoMovimiento {
  const q = hash.split('?')[1] ?? '';
  return new URLSearchParams(q).get('tipo') === 'gasto' ? 'gasto' : 'ingreso';
}

/** Path to open the new-movement form for a type. */
export function newMovementPath(tipo: TipoMovimiento): string {
  return `/registro/nuevo?tipo=${tipo}`;
}

/** Path to edit a saved movement. */
export function editMovementPath(id: string): string {
  return `/registro/${encodeURIComponent(id)}`;
}
