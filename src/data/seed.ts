import type { AppDB } from './db';
import type { Categoria } from './models';

// Fixed ids so the seed is idempotent and backups from different phones agree.
export const SEED_CATEGORIAS: readonly Categoria[] = [
  { id: 'cat-ing-ventas', nombre: 'Ventas', tipo: 'ingreso', esSistema: true },
  { id: 'cat-ing-servicios', nombre: 'Servicios', tipo: 'ingreso', esSistema: true },
  { id: 'cat-ing-otros', nombre: 'Otros ingresos', tipo: 'ingreso', esSistema: true },
  { id: 'cat-gas-materiales', nombre: 'Materiales e insumos', tipo: 'gasto', esSistema: true },
  {
    id: 'cat-gas-electricidad-comunicaciones',
    nombre: 'Electricidad y comunicaciones',
    tipo: 'gasto',
    esSistema: true,
  },
  { id: 'cat-gas-transporte', nombre: 'Transporte', tipo: 'gasto', esSistema: true },
  { id: 'cat-gas-alquiler', nombre: 'Alquiler', tipo: 'gasto', esSistema: true },
  { id: 'cat-gas-equipos', nombre: 'Equipos y herramientas', tipo: 'gasto', esSistema: true },
  { id: 'cat-gas-salarios', nombre: 'Salarios', tipo: 'gasto', esSistema: true },
  {
    id: 'cat-gas-tributos',
    nombre: 'Tributos y contribuciones',
    tipo: 'gasto',
    esSistema: true,
  },
  { id: 'cat-gas-otros', nombre: 'Otros gastos', tipo: 'gasto', esSistema: true },
];

/**
 * Inserts the system categories that are missing. Existing rows (renamed colors, etc.)
 * are never overwritten. Safe to call on every start. Returns how many were inserted.
 * The tax catalog is not seeded: it lives in code (src/domain/tributos.catalog.ts).
 */
export async function ensureSeed(db: AppDB): Promise<number> {
  return db.transaction('rw', db.categorias, async () => {
    const have = new Set<string>(await db.categorias.toCollection().primaryKeys());
    const missing = SEED_CATEGORIAS.filter((c) => !have.has(c.id)).map((c) => ({ ...c }));
    if (missing.length > 0) await db.categorias.bulkAdd(missing);
    return missing.length;
  });
}
