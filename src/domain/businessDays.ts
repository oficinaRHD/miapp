import { addDays, dayOfWeek, daysInMonth, diffDays, makeISODate } from './dates';
import type { ISODate } from './types';

export type Holidays = ReadonlySet<ISODate>;

/**
 * Default: no holidays. The Cuban holiday calendar is still pending (see 01, section 7, item 3),
 * so until the user configures it, only Saturdays and Sundays are skipped.
 */
export const NO_HOLIDAYS: Holidays = new Set<ISODate>();

export function toHolidaySet(dates: readonly ISODate[]): Holidays {
  return new Set(dates);
}

/** Monday to Friday that is not a holiday. */
export function isBusinessDay(date: ISODate, holidays: Holidays = NO_HOLIDAYS): boolean {
  const dow = dayOfWeek(date);
  return dow !== 0 && dow !== 6 && !holidays.has(date);
}

/** The date itself if it is a business day, otherwise the next one. */
export function nextBusinessDay(date: ISODate, holidays: Holidays = NO_HOLIDAYS): ISODate {
  let current = date;
  for (let i = 0; i < 366; i++) {
    if (isBusinessDay(current, holidays)) return current;
    current = addDays(current, 1);
  }
  throw new RangeError(`No business day found after ${date}`);
}

/** The n-th business day (n >= 1) of a month. */
export function nthBusinessDayOfMonth(
  year: number,
  month: number,
  n: number,
  holidays: Holidays = NO_HOLIDAYS,
): ISODate {
  if (!Number.isInteger(n) || n < 1) throw new RangeError(`Invalid n: ${n}`);
  let count = 0;
  for (let day = 1; day <= daysInMonth(year, month); day++) {
    const date = makeISODate(year, month, day);
    if (isBusinessDay(date, holidays)) {
      count++;
      if (count === n) return date;
    }
  }
  throw new RangeError(`Month ${year}-${month} has fewer than ${n} business days`);
}

/**
 * Business days of delay: business days in the range (due, paid].
 * Zero if paid on or before the due date.
 */
export function lateBusinessDays(due: ISODate, paid: ISODate, holidays: Holidays = NO_HOLIDAYS): number {
  const span = diffDays(due, paid);
  let count = 0;
  for (let i = 1; i <= span; i++) {
    if (isBusinessDay(addDays(due, i), holidays)) count++;
  }
  return count;
}
