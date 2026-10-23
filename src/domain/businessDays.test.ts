import { describe, expect, it } from 'vitest';
import {
  isBusinessDay,
  lateBusinessDays,
  nextBusinessDay,
  nthBusinessDayOfMonth,
  toHolidaySet,
} from './businessDays.js';

describe('isBusinessDay', () => {
  it('skips weekends', () => {
    expect(isBusinessDay('2026-10-20')).toBe(true); // Tue
    expect(isBusinessDay('2026-10-24')).toBe(false); // Sat
    expect(isBusinessDay('2026-10-25')).toBe(false); // Sun
  });

  it('skips configured holidays', () => {
    const holidays = toHolidaySet(['2026-10-22']);
    expect(isBusinessDay('2026-10-22', holidays)).toBe(false);
    expect(isBusinessDay('2026-10-22')).toBe(true);
  });
});

describe('nextBusinessDay', () => {
  it('keeps a business day and moves weekends to Monday', () => {
    expect(nextBusinessDay('2026-10-20')).toBe('2026-10-20');
    expect(nextBusinessDay('2026-09-20')).toBe('2026-09-21'); // Sun -> Mon
    expect(nextBusinessDay('2026-10-24')).toBe('2026-10-26'); // Sat -> Mon
  });

  it('also skips holidays', () => {
    expect(nextBusinessDay('2026-10-26', toHolidaySet(['2026-10-26']))).toBe('2026-10-27');
  });
});

describe('nthBusinessDayOfMonth', () => {
  it('finds the 10th business day (no holidays)', () => {
    expect(nthBusinessDayOfMonth(2026, 8, 10)).toBe('2026-08-14');
    expect(nthBusinessDayOfMonth(2026, 11, 10)).toBe('2026-11-13');
  });

  it('shifts by one when a holiday falls in the first days', () => {
    expect(nthBusinessDayOfMonth(2027, 1, 10)).toBe('2027-01-14');
    expect(nthBusinessDayOfMonth(2027, 1, 10, toHolidaySet(['2027-01-01']))).toBe('2027-01-15');
  });

  it('rejects impossible requests', () => {
    expect(() => nthBusinessDayOfMonth(2026, 2, 0)).toThrow(RangeError);
    expect(() => nthBusinessDayOfMonth(2026, 2, 40)).toThrow(RangeError);
  });
});

describe('lateBusinessDays', () => {
  it('is zero when paid on time or early', () => {
    expect(lateBusinessDays('2026-10-20', '2026-10-20')).toBe(0);
    expect(lateBusinessDays('2026-10-20', '2026-10-10')).toBe(0);
  });

  it('counts business days after the due date, including the payment day', () => {
    expect(lateBusinessDays('2026-10-20', '2026-10-21')).toBe(1);
    expect(lateBusinessDays('2026-10-20', '2026-10-26')).toBe(4); // 21, 22, 23, 26
    expect(lateBusinessDays('2026-10-20', '2026-10-24')).toBe(3); // Saturday not counted
  });

  it('does not count holidays', () => {
    expect(lateBusinessDays('2026-10-20', '2026-10-23', toHolidaySet(['2026-10-22']))).toBe(2);
  });
});
