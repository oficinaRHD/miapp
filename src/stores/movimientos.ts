// Movement store for V06/V07. Thin layer over the repositories; no fiscal logic.
import { db } from '../data';
import { DataError } from '../data/errors';
import type { Categoria, Movimiento, TipoMovimiento } from '../data/models';
import { categoriasRepo } from '../data/repositories/categorias';
import { movimientosRepo, type MovimientoInput } from '../data/repositories/movimientos';
import { nowISO } from '../data/util';

const movs = movimientosRepo(db);
const cats = categoriasRepo(db);

export function listCategories(tipo?: TipoMovimiento): Promise<Categoria[]> {
  return cats.list(tipo);
}

export function getMovement(id: string): Promise<Movimiento | undefined> {
  return movs.get(id);
}

/** `mes` is 'YYYY-MM'. */
export function listMovementsByMonth(mes: string, tipo?: TipoMovimiento): Promise<Movimiento[]> {
  return movs.listByMonth(mes, tipo);
}

export function addMovement(input: MovimientoInput): Promise<Movimiento> {
  return movs.add(input);
}

/**
 * Replaces the whole record (keeps id and creation time). `repo.update` merges, so an
 * emptied description or counterpart would come back; `restore` writes exactly what we pass.
 */
export async function updateMovement(id: string, input: MovimientoInput): Promise<Movimiento> {
  const cur = await movs.get(id);
  if (!cur) throw new DataError('not-found', `movimiento ${id}`);
  return movs.restore({ ...input, id, creadoEn: cur.creadoEn, actualizadoEn: nowISO() });
}

/** Deletes and returns the record so the UI can offer "undo". */
export function removeMovement(id: string): Promise<Movimiento> {
  return movs.remove(id);
}

export function restoreMovement(m: Movimiento): Promise<Movimiento> {
  return movs.restore(m);
}
