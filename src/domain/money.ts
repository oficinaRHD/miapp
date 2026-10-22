import type { Centavos } from './types';

const BASIS_POINTS = 10_000;

/** True for a non-negative safe integer (valid amount in centavos). */
export function isCentavos(value: unknown): value is Centavos {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

/**
 * Applies a rate expressed in basis points (1 bp = 0.01 %, so 10 % = 1000)
 * to an amount in centavos. Rounds half up to a whole centavo.
 * The official rounding method is still pending (see 01, section 7, item 6).
 */
export function applyRateBp(base: Centavos, rateBp: number): Centavos {
  if (!isCentavos(base)) throw new RangeError(`Invalid amount: ${base}`);
  if (!Number.isInteger(rateBp) || rateBp < 0) {
    throw new RangeError(`Invalid rate (basis points): ${rateBp}`);
  }
  const scaled = base * rateBp;
  if (!Number.isSafeInteger(scaled)) throw new RangeError('Amount too large');
  return Math.floor((scaled + BASIS_POINTS / 2) / BASIS_POINTS);
}

/** max(0, a - b) for amounts in centavos. */
export function subtractFloor(a: Centavos, b: Centavos): Centavos {
  return Math.max(0, a - b);
}

/**
 * Parses text typed by the user into centavos.
 * Accepts '1250', '1250.5', '1,250.50', '1,250.50 CUP' and a decimal comma
 * only when 1-2 digits follow it ('1250,5'). Returns null if it is not valid.
 */
export function parseCup(text: string): Centavos | null {
  const clean = text.replace(/\s|CUP/gi, '');
  let normalized: string;
  if (/^\d{1,3}(,\d{3})+(\.\d{1,2})?$/.test(clean)) {
    normalized = clean.replace(/,/g, '');
  } else if (/^\d+(\.\d{1,2})?$/.test(clean)) {
    normalized = clean;
  } else if (/^\d+,\d{1,2}$/.test(clean)) {
    normalized = clean.replace(',', '.');
  } else {
    return null;
  }
  const parts = normalized.split('.');
  const pesos = Number(parts[0] ?? '0');
  const cents = Number(((parts[1] ?? '') + '00').slice(0, 2));
  const total = pesos * 100 + cents;
  return Number.isSafeInteger(total) ? total : null;
}

/** Formats centavos as '1,250.50 CUP' (or without the suffix). */
export function formatCup(amount: Centavos, withSuffix = true): string {
  if (!Number.isSafeInteger(amount)) throw new RangeError(`Invalid amount: ${amount}`);
  const sign = amount < 0 ? '-' : '';
  const abs = Math.abs(amount);
  const pesos = Math.floor(abs / 100);
  const cents = abs % 100;
  const grouped = String(pesos).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const text = `${sign}${grouped}.${String(cents).padStart(2, '0')}`;
  return withSuffix ? `${text} CUP` : text;
}
