// Holiday list for V14 and for the business-day calculations. Data access through the repository only.
import { db } from '../data';
import type { Feriado } from '../data/models';
import { feriadosRepo } from '../data/repositories/feriados';
import { toHolidaySet, type Holidays } from '../domain/businessDays';

const repo = feriadosRepo(db);

export function listFeriados(): Promise<Feriado[]> {
  return repo.list();
}

/** Replaces the whole list (validated by the repository). */
export function saveFeriados(items: readonly Feriado[]): Promise<number> {
  return repo.replaceAll(items);
}

/** The saved holidays as the set the domain functions take. Empty set if none were typed. */
export async function loadHolidays(): Promise<Holidays> {
  return toHolidaySet((await repo.list()).map((f) => f.fecha));
}
