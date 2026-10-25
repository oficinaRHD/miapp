// Display helpers for dates. Spanish month abbreviations come from the domain (dates.ts).
import { monthShort, parseISODate } from '../domain/dates';
import type { ISODate } from '../domain/types';

/** '2026-11-20' -> '20 nov 2026'. Returns the input unchanged if it is not a valid date. */
export function formatDate(date: ISODate): string {
  const parts = parseISODate(date);
  if (!parts) return date;
  return `${parts.day} ${monthShort(parts.month)} ${parts.year}`;
}
