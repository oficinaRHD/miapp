// Holidays as reactive state for the views that count business days (payment sheet, date patterns).
// Loaded once at startup and after every change of the list (V14) or restore of a backup (V15).
import { NO_HOLIDAYS, type Holidays } from '../domain/businessDays';
import { loadHolidays } from './feriados';

let current = $state<Holidays>(NO_HOLIDAYS);

export const holidaysStore = {
  /** The saved holidays; an empty set until loaded or if the user typed none. */
  get value(): Holidays {
    return current;
  },
};

/** Reads the list again. Never throws: on failure the previous value stays. */
export async function refreshHolidays(): Promise<void> {
  try {
    current = await loadHolidays();
  } catch {
    // Keep the previous list.
  }
}
