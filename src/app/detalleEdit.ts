// Pure checks for the inline edits of V05: due date, barcode and official amount.
import type { OrigenFecha } from '../data/models';
import { isValidISODate } from '../domain/dates';
import { parseCup } from '../domain/money';
import type { Centavos, ISODate } from '../domain/types';

export type EditError =
  | 'date-invalid'
  | 'date-same'
  | 'barcode-empty'
  | 'barcode-too-long'
  | 'amount-invalid';

export type Checked<T> = { ok: true; value: T } | { ok: false; error: EditError };

export const BARCODE_MAX = 60;

/** The date must be valid and differ from the stored one, or the origin must change. */
export function checkDueDate(
  value: string,
  current: { vence: ISODate; venceOrigen: OrigenFecha },
  origin: OrigenFecha,
): Checked<ISODate> {
  if (!isValidISODate(value)) return { ok: false, error: 'date-invalid' };
  if (value === current.vence && origin === current.venceOrigen) return { ok: false, error: 'date-same' };
  return { ok: true, value };
}

/** Trims and collapses inner spaces ('764  -  16' becomes '764 - 16'). Empty is refused. */
export function checkBarcode(text: string): Checked<string> {
  const value = text.trim().replace(/\s+/g, ' ');
  if (value === '') return { ok: false, error: 'barcode-empty' };
  if (value.length > BARCODE_MAX) return { ok: false, error: 'barcode-too-long' };
  return { ok: true, value };
}

export function checkOfficialAmount(text: string): Checked<Centavos> {
  const value = parseCup(text);
  return value === null ? { ok: false, error: 'amount-invalid' } : { ok: true, value };
}
