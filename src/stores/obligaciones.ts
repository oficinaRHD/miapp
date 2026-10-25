// Obligations access for views. Data access goes through the obligations repository only.
import { db } from '../data';
import type { ISODate, Obligacion } from '../data/models';
import {
  obligacionesRepo,
  type ObligacionDraftInput,
  type ObligacionFilter,
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
