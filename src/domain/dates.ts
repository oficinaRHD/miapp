import type { ISODate } from './types';

export interface DateParts {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
}

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;

export const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
] as const;

export const MONTH_SHORT = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
] as const;

export function monthName(month: number): string {
  return MONTH_NAMES[month - 1] ?? '';
}

export function monthShort(month: number): string {
  return MONTH_SHORT[month - 1] ?? '';
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Parses 'YYYY-MM-DD'. Returns null if the text is not a real calendar date (year >= 1900). */
export function parseISODate(value: string): DateParts | null {
  const m = ISO_RE.exec(value);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (year < 1900 || month < 1 || month > 12 || day < 1) return null;
  if (day > daysInMonth(year, month)) return null;
  return { year, month, day };
}

export function isValidISODate(value: string): boolean {
  return parseISODate(value) !== null;
}

/** Builds 'YYYY-MM-DD'. Throws if the parts are not a real date. */
export function makeISODate(year: number, month: number, day: number): ISODate {
  const text = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  if (!isValidISODate(text)) throw new RangeError(`Invalid date: ${text}`);
  return text;
}

function mustParse(date: ISODate): DateParts {
  const parts = parseISODate(date);
  if (!parts) throw new RangeError(`Invalid date: ${date}`);
  return parts;
}

function epochDay(date: ISODate): number {
  const { year, month, day } = mustParse(date);
  return Date.UTC(year, month - 1, day) / MS_PER_DAY;
}

function fromEpochDay(n: number): ISODate {
  const d = new Date(n * MS_PER_DAY);
  return makeISODate(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

/** Day of week: 0 = Sunday ... 6 = Saturday. */
export function dayOfWeek(date: ISODate): number {
  const { year, month, day } = mustParse(date);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function addDays(date: ISODate, days: number): ISODate {
  return fromEpochDay(epochDay(date) + days);
}

/** Whole days from `from` to `to` (negative if `to` is earlier). */
export function diffDays(from: ISODate, to: ISODate): number {
  return epochDay(to) - epochDay(from);
}

export function compareDates(a: ISODate, b: ISODate): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Moves a (year, month) pair by `delta` months. */
export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const index = year * 12 + (month - 1) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

/** 'YYYY-MM' */
export function monthKey(year: number, month: number): string {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}`;
}

/** Local calendar date of a JS Date (the phone runs in Cuba time). */
export function localISODate(d: Date): ISODate {
  return makeISODate(d.getFullYear(), d.getMonth() + 1, d.getDate());
}
