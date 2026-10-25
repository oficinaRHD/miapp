// Pure logic of "Editar fechas del año" (V04). Works on obligations already stored:
// the user types the dates of their vector and only the changed ones are saved.
// No fiscal rules here: calculated dates come from `generateObligations` in the domain.
import type { Obligacion } from '../data/models';
import { compareDates, isValidISODate } from '../domain/dates';
import { generateObligations, obligationKey } from '../domain/schedule';
import { findTributo } from '../domain/tributos.catalog';
import type { ISODate } from '../domain/types';

/** Dates typed by the user, by obligation id. Only edited rows appear. */
export type EditDraft = Readonly<Record<string, string>>;

export interface DateChange {
  id: string;
  vence: ISODate;
}

export interface EditGroup {
  code: string;
  name: string;
  rows: Obligacion[];
}

/** Fiscal year of the period ('2026-09', '2026-T3' and '2026' are all 2026), not of the due date. */
export function fiscalYearOf(o: Obligacion): number {
  return Number(o.periodoClave.slice(0, 4));
}

/** Years that have at least one pending obligation, ascending. */
export function fiscalYears(obligaciones: readonly Obligacion[]): number[] {
  const years = new Set<number>();
  for (const o of obligaciones) {
    const y = fiscalYearOf(o);
    if (o.estado === 'pendiente' && Number.isInteger(y)) years.add(y);
  }
  return [...years].sort((a, b) => a - b);
}

/** The current year if it has pending obligations, else the latest available year. */
export function defaultYear(years: readonly number[], currentYear: number): number {
  return years.includes(currentYear) ? currentYear : (years[years.length - 1] ?? currentYear);
}

function byCodeThenDue(a: Obligacion, b: Obligacion): number {
  return a.tributoCodigo.localeCompare(b.tributoCodigo) || compareDates(a.vence, b.vence);
}

/** Pending obligations of one fiscal year. Paid and omitted ones are never editable here. */
export function editableRows(obligaciones: readonly Obligacion[], year: number): Obligacion[] {
  return obligaciones
    .filter((o) => o.estado === 'pendiente' && fiscalYearOf(o) === year)
    .sort(byCodeThenDue);
}

/** Rows grouped by tributo (ordered by code); rows keep their date order. */
export function groupEditable(rows: readonly Obligacion[]): EditGroup[] {
  const byCode = new Map<string, EditGroup>();
  for (const o of [...rows].sort(byCodeThenDue)) {
    let group = byCode.get(o.tributoCodigo);
    if (!group) {
      group = {
        code: o.tributoCodigo,
        name: findTributo(o.tributoCodigo)?.shortName ?? o.tributoCodigo,
        rows: [],
      };
      byCode.set(o.tributoCodigo, group);
    }
    group.rows.push(o);
  }
  return [...byCode.values()].sort((a, b) => a.code.localeCompare(b.code));
}

/** Sets the typed date of one obligation. An empty value removes the edit. Returns a new draft. */
export function setEditDate(draft: EditDraft, id: string, value: string): EditDraft {
  const next = { ...draft };
  if (value === '') delete next[id];
  else next[id] = value;
  return next;
}

/**
 * Dates to save: pending obligations whose typed date is a valid date different from the
 * stored one. Invalid text and unchanged dates are ignored, never guessed.
 */
export function pendingChanges(obligaciones: readonly Obligacion[], draft: EditDraft): DateChange[] {
  const changes: DateChange[] = [];
  for (const o of obligaciones) {
    if (o.estado !== 'pendiente') continue;
    const value = draft[o.id];
    if (value === undefined || !isValidISODate(value) || value === o.vence) continue;
    changes.push({ id: o.id, vence: value });
  }
  return changes;
}

/** Due dates as the pattern calculates them, by `obligationKey` (shown next to each field). */
export function patternByKey(codes: readonly string[], year: number): Record<string, ISODate> {
  const out: Record<string, ISODate> = {};
  for (const d of generateObligations({ activeTributos: [...new Set(codes)], year })) {
    out[obligationKey(d.tributoCodigo, d.periodoClave)] = d.vence;
  }
  return out;
}
