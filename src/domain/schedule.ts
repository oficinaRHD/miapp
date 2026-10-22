import { NO_HOLIDAYS, nextBusinessDay, nthBusinessDayOfMonth, type Holidays } from './businessDays';
import { compareDates, isValidISODate, makeISODate, daysInMonth, monthKey, monthName, monthShort, shiftMonth } from './dates';
import { findTributo, type DateRule } from './tributos.catalog';
import type { ISODate, OrigenFecha, PeriodoTipo } from './types';

/**
 * An obligation before it is stored: no id and no timestamps.
 * Field names follow `Obligacion` in 04 so the repository (M2) can complete it.
 */
export interface ObligationDraft {
  tributoCodigo: string;
  periodoTipo: Exclude<PeriodoTipo, 'eventual'>;
  periodoClave: string; // '2026-09' | '2026-T3' | '2026'
  periodoEtiqueta: string; // 'Septiembre 2026'
  vence: ISODate;
  venceOrigen: OrigenFecha;
}

export interface ScheduleOptions {
  /** Codes of the active tributos from the profile. Unknown and eventual codes are ignored. */
  activeTributos: readonly string[];
  /** Fiscal year of the periods (Jan-Dec of this year). Due dates may fall in the next year. */
  year: number;
  holidays?: Holidays;
  /** Dates copied from the vector, keyed by `obligationKey(code, periodoClave)`. */
  vectorDates?: Readonly<Record<string, ISODate>>;
}

interface Period {
  key: string;
  label: string;
  closeYear: number;
  closeMonth: number;
}

/** Unique key of an obligation (same pair the unique index of 04 uses). */
export function obligationKey(tributoCodigo: string, periodoClave: string): string {
  return `${tributoCodigo}|${periodoClave}`;
}

function periodsOf(periodicity: ObligationDraft['periodoTipo'], year: number): Period[] {
  if (periodicity === 'mensual') {
    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      return { key: monthKey(year, month), label: `${monthName(month)} ${year}`, closeYear: year, closeMonth: month };
    });
  }
  if (periodicity === 'trimestral') {
    return [1, 2, 3, 4].map((q) => ({
      key: `${year}-T${q}`,
      label: `T${q} ${year} (${monthShort(q * 3 - 2)}-${monthShort(q * 3)})`,
      closeYear: year,
      closeMonth: q * 3,
    }));
  }
  return [{ key: String(year), label: `Año ${year}`, closeYear: year, closeMonth: 12 }];
}

function computeDueDate(rule: DateRule, closeYear: number, closeMonth: number, holidays: Holidays): ISODate | null {
  switch (rule.kind) {
    case 'fixedDay': {
      const next = shiftMonth(closeYear, closeMonth, 1);
      const day = Math.min(rule.day, daysInMonth(next.year, next.month));
      return nextBusinessDay(makeISODate(next.year, next.month, day), holidays);
    }
    case 'nthBusinessDay': {
      const next = shiftMonth(closeYear, closeMonth, 1);
      return nthBusinessDayOfMonth(next.year, next.month, rule.n, holidays);
    }
    case 'annualDate':
      // Used as written in the vector: no business-day adjustment.
      return makeISODate(closeYear + 1, rule.month, rule.day);
    case 'manual':
      return null;
  }
}

/**
 * Generates the obligations of a year for the active tributos.
 * Calculated dates are only a proposal (venceOrigen 'calculada'); a date copied
 * from the vector replaces it (venceOrigen 'vector'). Result sorted by due date, then code.
 */
export function generateObligations(options: ScheduleOptions): ObligationDraft[] {
  const holidays = options.holidays ?? NO_HOLIDAYS;
  const vector = options.vectorDates ?? {};
  const drafts: ObligationDraft[] = [];

  for (const code of new Set(options.activeTributos)) {
    const tributo = findTributo(code);
    if (!tributo || tributo.periodicity === 'eventual') continue;

    for (const period of periodsOf(tributo.periodicity, options.year)) {
      const calculated = computeDueDate(tributo.dateRule, period.closeYear, period.closeMonth, holidays);
      if (calculated === null) continue;

      const fromVector = vector[obligationKey(code, period.key)];
      const useVector = fromVector !== undefined && isValidISODate(fromVector);

      drafts.push({
        tributoCodigo: code,
        periodoTipo: tributo.periodicity,
        periodoClave: period.key,
        periodoEtiqueta: period.label,
        vence: useVector ? fromVector : calculated,
        venceOrigen: useVector ? 'vector' : 'calculada',
      });
    }
  }

  return drafts.sort(
    (a, b) => compareDates(a.vence, b.vence) || (a.tributoCodigo < b.tributoCodigo ? -1 : a.tributoCodigo > b.tributoCodigo ? 1 : 0),
  );
}

/** Keeps only drafts that are not stored yet (idempotent generation; never touches existing ones). */
export function onlyNew(drafts: readonly ObligationDraft[], existingKeys: ReadonlySet<string>): ObligationDraft[] {
  return drafts.filter((d) => !existingKeys.has(obligationKey(d.tributoCodigo, d.periodoClave)));
}
