// Obligations access for views. Data access goes through the obligations repository only.
import { db } from '../data';
import { obligacionesRepo, type ObligacionDraftInput } from '../data/repositories/obligaciones';

const repo = obligacionesRepo(db);

/** Stores the generated obligations. Idempotent: existing ones are never overwritten. */
export function addObligationDrafts(
  drafts: readonly ObligacionDraftInput[],
): Promise<{ added: number; skipped: number }> {
  return repo.addDrafts(drafts);
}
