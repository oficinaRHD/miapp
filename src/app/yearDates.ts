import type { Holidays } from '../domain/businessDays';
import { compareDates, isValidISODate } from '../domain/dates';
import { generateObligations, obligationKey, type ObligationDraft } from '../domain/schedule';
import { findTributo } from '../domain/tributos.catalog';
import type { ISODate } from '../domain/types';

// Pure logic of onboarding step 5 (year dates). No UI, no DB, no fiscal rules:
// due dates come from `generateObligations` in the domain.

export type YearDatesMode = 'patron' | 'vector';

export type VectorDates = Readonly<Record<string, ISODate>>;

export interface PlanOptions {
  activeTributos: readonly string[];
  /** Today, YYYY-MM-DD (local date). Passed in so the function stays pure. */
  today: ISODate;
  /** Dates copied from the vector, keyed by `obligationKey(code, periodoClave)`. */
  vectorDates?: VectorDates;
  holidays?: Holidays;
}

export interface PlanGroup {
  code: string;
  name: string;
  rows: ObligationDraft[];
}

export interface PlanSummary {
  count: number;
  first: ISODate | null;
  last: ISODate | null;
}

function assertDate(today: ISODate): void {
  if (!isValidISODate(today)) throw new RangeError(`invalid date: ${today}`);
}

/** Fiscal year generated at onboarding: the year of today. */
export function yearOf(today: ISODate): number {
  assertDate(today);
  return Number(today.slice(0, 4));
}

/** First day of the month of `today`. */
export function monthStart(today: ISODate): ISODate {
  assertDate(today);
  return `${today.slice(0, 8)}01`;
}

/** Keeps only non-empty, valid dates. Invalid input is dropped, never guessed. */
export function cleanVectorDates(input: VectorDates | undefined): Record<string, ISODate> {
  const out: Record<string, ISODate> = {};
  if (!input) return out;
  for (const [key, value] of Object.entries(input)) {
    if (value && isValidISODate(value)) out[key] = value;
  }
  return out;
}

/**
 * Obligations to create at onboarding (option A): the periods of this year whose
 * calculated due date is on or after the first day of the current month. Earlier
 * periods are not created. The set of rows is decided by the calculated date, so
 * typing a vector date never adds or removes a row; the vector date then replaces
 * the calculated one (venceOrigen 'vector').
 */
export function buildPlan(options: PlanOptions): ObligationDraft[] {
  const year = yearOf(options.today);
  const from = monthStart(options.today);
  const holidays = options.holidays ? { holidays: options.holidays } : {};

  const pattern = generateObligations({ activeTributos: options.activeTributos, year, ...holidays });
  const keep = new Set(
    pattern
      .filter((d) => compareDates(d.vence, from) >= 0)
      .map((d) => obligationKey(d.tributoCodigo, d.periodoClave)),
  );

  const vectorDates = cleanVectorDates(options.vectorDates);
  const full = generateObligations({
    activeTributos: options.activeTributos,
    year,
    vectorDates,
    ...holidays,
  });
  return full.filter((d) => keep.has(obligationKey(d.tributoCodigo, d.periodoClave)));
}

/** Plan rows grouped by tributo (ordered by code); rows keep their date order. */
export function groupPlan(plan: readonly ObligationDraft[]): PlanGroup[] {
  const byCode = new Map<string, PlanGroup>();
  for (const row of plan) {
    let group = byCode.get(row.tributoCodigo);
    if (!group) {
      group = {
        code: row.tributoCodigo,
        name: findTributo(row.tributoCodigo)?.shortName ?? row.tributoCodigo,
        rows: [],
      };
      byCode.set(row.tributoCodigo, group);
    }
    group.rows.push(row);
  }
  return [...byCode.values()].sort((a, b) => (a.code < b.code ? -1 : a.code > b.code ? 1 : 0));
}

/** Count and date range of a plan (the plan is already sorted by due date). */
export function planSummary(plan: readonly ObligationDraft[]): PlanSummary {
  if (plan.length === 0) return { count: 0, first: null, last: null };
  return {
    count: plan.length,
    first: plan[0]!.vence,
    last: plan[plan.length - 1]!.vence,
  };
}

/** Due dates by key as the pattern calculates them (to show next to a vector field). */
export function patternDates(options: Omit<PlanOptions, 'vectorDates'>): Record<string, ISODate> {
  const out: Record<string, ISODate> = {};
  for (const d of buildPlan(options)) out[obligationKey(d.tributoCodigo, d.periodoClave)] = d.vence;
  return out;
}
