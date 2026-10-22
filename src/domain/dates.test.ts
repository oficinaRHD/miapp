import { describe, expect, it } from 'vitest';
import {
  addDays,
  compareDates,
  daysInMonth,
  dayOfWeek,
  diffDays,
  isValidISODate,
  localISODate,
  makeISODate,
  monthKey,
  monthName,
  parseISODate,
  shiftMonth,
} from './dates';

describe('parseISODate', () => {
  it('parses valid dates', () => {
    expect(parseISODate('2026-10-20')).toEqual({ year: 2026, month: 10, day: 20 });
    expect(isValidISODate('2028-02-29')).toBe(true);
  });

  it('rejects invalid dates', () => {
    for (const bad of ['2026-02-29', '2026-13-01', '2026-00-10', '2026-1-1', 'abc', '', '1800-01-01']) {
      expect(isValidISODate(bad)).toBe(false);
    }
  });
});

describe('calendar helpers', () => {
  it('daysInMonth handles leap years', () => {
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2028, 2)).toBe(29);
    expect(daysInMonth(2026, 12)).toBe(31);
  });

  it('dayOfWeek: 0 = Sunday', () => {
    expect(dayOfWeek('2026-10-20')).toBe(2); // Tuesday
    expect(dayOfWeek('2026-10-24')).toBe(6); // Saturday
    expect(dayOfWeek('2026-10-25')).toBe(0); // Sunday
  });

  it('addDays crosses month, year and leap boundaries', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
  });

  it('diffDays and compareDates', () => {
    expect(diffDays('2026-10-20', '2026-11-20')).toBe(31);
    expect(diffDays('2026-11-20', '2026-10-20')).toBe(-31);
    expect(compareDates('2026-10-20', '2026-10-21')).toBe(-1);
    expect(compareDates('2026-10-21', '2026-10-20')).toBe(1);
    expect(compareDates('2026-10-20', '2026-10-20')).toBe(0);
  });

  it('shiftMonth wraps years', () => {
    expect(shiftMonth(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
    expect(shiftMonth(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
    expect(shiftMonth(2026, 9, 3)).toEqual({ year: 2026, month: 12 });
  });

  it('formatting helpers', () => {
    expect(monthKey(2026, 9)).toBe('2026-09');
    expect(makeISODate(2026, 9, 5)).toBe('2026-09-05');
    expect(() => makeISODate(2026, 2, 30)).toThrow(RangeError);
    expect(monthName(9)).toBe('Septiembre');
    expect(localISODate(new Date(2026, 9, 22, 6, 40))).toBe('2026-10-22');
  });
});
