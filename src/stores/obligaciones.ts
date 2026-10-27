// Obligations access for views. Data access goes through the obligations repository only.
import { db } from '../data';
import type { ISODate, Obligacion, OrigenFecha } from '../data/models';
import {
  obligacionesRepo,
  type ObligacionChanges,
  type ObligacionDraftInput,
  type ObligacionFilter,
  type PagoInput,
} from '../data/repositories/obligaciones';
import { rescheduleNotices } from './avisos';

const repo = obligacionesRepo(db);

export interface DueDateChange {
  id: string;
  vence: ISODate;
}

export interface SaveResult {
  updated: number;
  failed: { id: string; message: string }[];
}

/**
 * Recalculates the deadline notices after a change (paid, omitted, reopened, new date, new
 * obligations). Fire and forget: `rescheduleNotices` never throws, so a notification problem
 * can never break the change that was just saved.
 */
function refreshNotices(): void {
  void rescheduleNotices();
}

/** Stores the generated obligations. Idempotent: existing ones are never overwritten. */
export async function addObligationDrafts(
  drafts: readonly ObligacionDraftInput[],
): Promise<{ added: number; skipped: number }> {
  const result = await repo.addDrafts(drafts);
  if (result.added > 0) refreshNotices();
  return result;
}

/** Reads obligations ordered by due date. Optional filter by state and due-date range. */
export function listObligations(filter: ObligacionFilter = {}): Promise<Obligacion[]> {
  return repo.list(filter);
}

/** One obligation by id, or undefined. */
export function getObligation(id: string): Promise<Obligacion | undefined> {
  return repo.get(id);
}

/** Marks an obligation as paid. Returns the stored obligation. Its notices are cancelled. */
export async function markObligationPaid(id: string, pago: PagoInput): Promise<Obligacion> {
  const obligation = await repo.markPaid(id, pago);
  refreshNotices();
  return obligation;
}

/** Omits a pending obligation (a paid one is locked by the repository). Its notices are cancelled. */
export async function omitObligation(id: string, motivo?: string): Promise<Obligacion> {
  const obligation = await repo.markOmitted(id, motivo);
  refreshNotices();
  return obligation;
}

/** Back to pending, clearing the payment data. Its notices are scheduled again. */
export async function reopenObligation(id: string): Promise<Obligacion> {
  const obligation = await repo.reopen(id);
  refreshNotices();
  return obligation;
}

/** Changes the due date of a pending obligation and records where the date came from. */
export async function setObligationDate(
  id: string,
  vence: ISODate,
  origen: OrigenFecha,
): Promise<Obligacion> {
  const obligation = await repo.setDueDate(id, vence, origen);
  refreshNotices();
  return obligation;
}

/** Changes the official amount, barcode or notes. Notices do not depend on them. */
export function updateObligation(id: string, changes: ObligacionChanges): Promise<Obligacion> {
  return repo.update(id, changes);
}

/**
 * Saves the dates copied from the vector (venceOrigen 'vector'), one by one. A failure on one
 * obligation (for example a paid one, which the repository locks) does not stop the others.
 * Notices are recalculated once at the end.
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
  if (result.updated > 0) refreshNotices();
  return result;
}
