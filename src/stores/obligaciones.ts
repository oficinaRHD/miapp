// Obligations access for views. Data access goes through the obligations repository only.
import { db } from '../data';
import type { ISODate, Obligacion } from '../data/models';
import {
  obligacionesRepo,
  type ObligacionDraftInput,
  type ObligacionFilter,
  type PagoInput,
} from '../data/repositories/obligaciones';

const repo = obligacionesRepo(db);

export interface DueDateChange {
  id: string;
  vence: ISODate;
}

export interface SaveResult {
  updated: number;
  failed: { id: string; message: string }[];
}

/** Stores the generated obligations. Idempotent: existing ones are never overwritten. */
export function addObligationDrafts(
  drafts: readonly ObligacionDraftInput[],
): Promise<{ added: number; skipped: number }> {
  return repo.addDrafts(drafts);
}

/** Reads obligations ordered by due date. Optional filter by state and due-date range. */
export function listObligations(filter: ObligacionFilter = {}): Promise<Obligacion[]> {
  return repo.list(filter);
}

/** One obligation by id, or undefined. */
export function getObligation(id: string): Promise<Obligacion | undefined> {
  return repo.get(id);
}

/** Marks an obligation as paid. Returns the stored obligation. */
export function markObligationPaid(id: string, pago: PagoInput): Promise<Obligacion> {
  return repo.markPaid(id, pago);
}

/** Omits a pending obligation (a paid one is locked by the repository). */
export function omitObligation(id: string, motivo?: string): Promise<Obligacion> {
  return repo.markOmitted(id, motivo);
}

/** Back to pending, clearing the payment data. */
export function reopenObligation(id: string): Promise<Obligacion> {
  return repo.reopen(id);
}

/**
 * Saves the dates copied from the vector (venceOrigen 'vector'), one by one. A failure on one
 * obligation (for example a paid one, which the repository locks) does not stop the others.
 */
export async function setObligationDueDates(changes: readonly DueDateChange[]): Promise<SaveResult> {
  const result: SaveResult = { updated: 0, failed: [] };
  for (const c of changes) {
    try {
      await repo.setDueDate(c.id, c.vence, 'vector');
      result.updated++;
    } catch (e) {
      result.failed.push({ id: c.id, message: e instanceof Error ? e.message : String(e) });
    }
  }
  return result;
}
