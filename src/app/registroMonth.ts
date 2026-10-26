import type { TipoMovimiento } from '../data/models';
import type { TipoFilter } from './registro';

/** 'YYYY-MM' from a year and a month number (1 to 12). */
export function monthKeyFrom(year: number, month: number): string {
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12 || year < 1000 || year > 9999) {
    throw new RangeError(`invalid month: ${year}-${month}`);
  }
  return `${year}-${String(month).padStart(2, '0')}`;
}

/** Why the list is empty: no movements at all this month, or none for the chosen filter. */
export type EmptyKind = 'month' | 'filter' | null;

export function emptyKind(total: number, shown: number): EmptyKind {
  if (total === 0) return 'month';
  if (shown === 0) return 'filter';
  return null;
}

/** Net amount text; the formatter only ever receives non-negative centavos. */
export function formatNet(neto: number, fmt: (centavos: number) => string): string {
  return neto < 0 ? `-${fmt(-neto)}` : fmt(neto);
}

/** Type for the floating "+" button: the filtered type, income when showing everything. */
export function tipoForNew(f: TipoFilter): TipoMovimiento {
  return f === 'gasto' ? 'gasto' : 'ingreso';
}
