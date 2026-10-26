import type { ISODate } from '../domain/types';

/** Today as 'YYYY-MM-DD' in the phone's local time (no time zone conversion). */
export function todayLocal(now: Date = new Date()): ISODate {
  const p = (n: number): string => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
}
