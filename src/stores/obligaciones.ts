// Obligations access for views. Data access goes through the obligations repository only.
import { db } from '../data';
import type { Obligacion } from '../data/models';
import {
  obligacionesRepo,
  type ObligacionDraftInput,
  type ObligacionFilter,
} from '../data/repositories/obligaciones';

const repo = obligacionesRepo(db);

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
