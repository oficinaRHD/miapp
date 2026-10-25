// Pure logic of V03 (Calendario): month grid, per-day status, tributo filter and year list.
// No fiscal rules here: only dates and states of already generated obligations.
import type { Obligacion } from '../data/models';
import { addDays, compareDates, dayOfWeek, daysInMonth, diffDays, makeISODate, parseISODate } from '../domain/dates';
import type { ISODate } from '../domain/types';
import { urgencyOf, type Urgency } from './inicio';

/** Status of an obligation as shown in the calendar. */
export type DayStatus = Urgency | 'pagada' | 'omitida';

/** Most severe first. A day shows the dot of its most severe obligation. */
const SEVERITY: readonly DayStatus[] = ['vencida', 'urgente', 'pronto', 'tranquila', 'pagada', 'omitida'];

export interface CalendarCell {
  date: ISODate;
  day: number;
  /** False for the padding days of the previous and next month. */
  inMonth: boolean;
  isToday: boolean;
  /** Most severe status of the day, or null when there is nothing (always null outside the month). */
  status: DayStatus | null;
  count: number;
}

export interface MonthGroup {
  month: number; // 1-12
  items: Obligacion[];
}

export function statusOf(o: Obligacion, today: ISODate): DayStatus {
  if (o.estado === 'pagada') return 'pagada';
  if (o.estado === 'omitida') return 'omitida';
  return urgencyOf(diffDays(today, o.vence));
}

export function worstStatus(statuses: readonly DayStatus[]): DayStatus | null {
  let best = SEVERITY.length;
  for (const s of statuses) {
    const idx = SEVERITY.indexOf(s);
    if (idx < best) best = idx;
  }
  return best === SEVERITY.length ? null : (SEVERITY[best] ?? null);
}

/** `code` null = no filter. Returns a new array. */
export function filterByTributo(obligaciones: readonly Obligacion[], code: string | null): Obligacion[] {
  return code === null ? [...obligaciones] : obligaciones.filter((o) => o.tributoCodigo === code);
}

/** Distinct tributo codes present in the list, sorted. */
export function tributoCodes(obligaciones: readonly Obligacion[]): string[] {
  return [...new Set(obligaciones.map((o) => o.tributoCodigo))].sort();
}

function byDueThenCode(a: Obligacion, b: Obligacion): number {
  return compareDates(a.vence, b.vence) || a.tributoCodigo.localeCompare(b.tributoCodigo);
}

/** Obligations due on `date`, ordered by tributo code. */
export function obligationsOn(obligaciones: readonly Obligacion[], date: ISODate): Obligacion[] {
  return obligaciones.filter((o) => o.vence === date).sort(byDueThenCode);
}

/**
 * Weeks of the month, Monday first. Complete weeks: the first and last rows
 * include days of the neighbour months (inMonth false, no status).
 */
export function buildMonthGrid(
  year: number,
  month: number,
  obligaciones: readonly Obligacion[],
  today: ISODate,
): CalendarCell[][] {
  const byDate = new Map<ISODate, DayStatus[]>();
  for (const o of obligaciones) {
    const list = byDate.get(o.vence) ?? [];
    list.push(statusOf(o, today));
    byDate.set(o.vence, list);
  }

  const first = makeISODate(year, month, 1);
  const offset = (dayOfWeek(first) + 6) % 7; // Monday = 0
  const weeks = Math.ceil((offset + daysInMonth(year, month)) / 7);
  const start = addDays(first, -offset);

  const grid: CalendarCell[][] = [];
  for (let w = 0; w < weeks; w++) {
    const row: CalendarCell[] = [];
    for (let d = 0; d < 7; d++) {
      const date = addDays(start, w * 7 + d);
      const parts = parseISODate(date)!;
      const inMonth = parts.year === year && parts.month === month;
      const statuses = inMonth ? (byDate.get(date) ?? []) : [];
      row.push({
        date,
        day: parts.day,
        inMonth,
        isToday: date === today,
        status: worstStatus(statuses),
        count: statuses.length,
      });
    }
    grid.push(row);
  }
  return grid;
}

/** Obligations whose due date is in `year`, grouped by month. Months without items are omitted. */
export function groupByMonth(obligaciones: readonly Obligacion[], year: number): MonthGroup[] {
  const groups = new Map<number, Obligacion[]>();
  for (const o of obligaciones) {
    const p = parseISODate(o.vence);
    if (!p || p.year !== year) continue;
    const list = groups.get(p.month) ?? [];
    list.push(o);
    groups.set(p.month, list);
  }
  return [...groups.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([month, items]) => ({ month, items: items.sort(byDueThenCode) }));
}

/** Day selected when a month is shown: today if it belongs to that month, otherwise the 1st. */
export function defaultSelected(year: number, month: number, today: ISODate): ISODate {
  const t = parseISODate(today);
  return t && t.year === year && t.month === month ? today : makeISODate(year, month, 1);
}
