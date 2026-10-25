// Pure logic of V04 (Obligaciones): filters, counts, grouping by due month and amount to show.
// No fiscal rules here: only dates and states of already generated obligations.
import type { Obligacion } from '../data/models';
import { compareDates, parseISODate } from '../domain/dates';
import type { Centavos, ISODate } from '../domain/types';

export const FILTERS = ['pendientes', 'vencidas', 'pagadas', 'omitidas'] as const;
export type ObligationFilter = (typeof FILTERS)[number];

export interface ObligationMonthGroup {
  /** 'YYYY-MM' of the due date. */
  key: string;
  year: number;
  month: number; // 1-12
  items: Obligacion[];
}

export type AmountInfo =
  | { kind: 'pagado' | 'oficial' | 'estimado'; centavos: Centavos }
  | { kind: 'ninguno' };

/**
 * - pendientes: every `pendiente` one, overdue included (they are shown in red).
 * - vencidas: `pendiente` with a due date before today (a subset of pendientes).
 * - pagadas / omitidas: by state.
 */
export function matchesFilter(o: Obligacion, filter: ObligationFilter, today: ISODate): boolean {
  switch (filter) {
    case 'pendientes':
      return o.estado === 'pendiente';
    case 'vencidas':
      return o.estado === 'pendiente' && compareDates(o.vence, today) < 0;
    case 'pagadas':
      return o.estado === 'pagada';
    case 'omitidas':
      return o.estado === 'omitida';
  }
}

export function filterObligations(
  obligaciones: readonly Obligacion[],
  filter: ObligationFilter,
  today: ISODate,
): Obligacion[] {
  return obligaciones.filter((o) => matchesFilter(o, filter, today));
}

export function filterCounts(
  obligaciones: readonly Obligacion[],
  today: ISODate,
): Record<ObligationFilter, number> {
  const counts: Record<ObligationFilter, number> = { pendientes: 0, vencidas: 0, pagadas: 0, omitidas: 0 };
  for (const o of obligaciones) {
    for (const f of FILTERS) if (matchesFilter(o, f, today)) counts[f]++;
  }
  return counts;
}

function byDueThenCode(a: Obligacion, b: Obligacion): number {
  return compareDates(a.vence, b.vence) || a.tributoCodigo.localeCompare(b.tributoCodigo);
}

/** Groups by the month of the due date, oldest month first. Items ordered by date, then code. */
export function groupByDueMonth(obligaciones: readonly Obligacion[]): ObligationMonthGroup[] {
  const groups = new Map<string, ObligationMonthGroup>();
  for (const o of [...obligaciones].sort(byDueThenCode)) {
    const p = parseISODate(o.vence);
    if (!p) continue;
    const key = o.vence.slice(0, 7);
    const group = groups.get(key) ?? { key, year: p.year, month: p.month, items: [] };
    group.items.push(o);
    groups.set(key, group);
  }
  return [...groups.values()];
}

/** Amount shown in a row: paid amount, else official, else estimated, else none. */
export function amountOf(o: Obligacion): AmountInfo {
  if (o.estado === 'pagada' && o.importePagado !== undefined) {
    return { kind: 'pagado', centavos: o.importePagado };
  }
  if (o.importeOficial !== undefined) return { kind: 'oficial', centavos: o.importeOficial };
  if (o.importeEstimado !== undefined) return { kind: 'estimado', centavos: o.importeEstimado };
  return { kind: 'ninguno' };
}
