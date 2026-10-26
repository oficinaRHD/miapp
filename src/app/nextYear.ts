// Pure logic of "Generar obligaciones del año siguiente" (V04).
// Dates come from `generateObligations` in the domain: calculated by pattern, only a proposal.
// The user then adjusts them with "Editar fechas del año" using their vector.
import type { Obligacion } from '../data/models';
import { generateObligations, type ObligationDraft } from '../domain/schedule';
import type { ISODate } from '../domain/types';
import { fiscalYearOf } from './editDates';
import { yearOf } from './yearDates';

/**
 * Year to offer: the one after the year of `today`, if no obligation of that fiscal year exists yet.
 * The fiscal year is the one of the period, so a December period due in January does not count.
 */
export function nextYearToGenerate(obligaciones: readonly Obligacion[], today: ISODate): number | null {
  const next = yearOf(today) + 1;
  return obligaciones.some((o) => fiscalYearOf(o) === next) ? null : next;
}

/** Every period of `year` for the active tributos (no "from this month" cut: it is a whole new year). */
export function nextYearPlan(activeTributos: readonly string[], year: number): ObligationDraft[] {
  return generateObligations({ activeTributos, year });
}
