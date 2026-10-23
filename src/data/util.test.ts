import { describe, expect, it } from 'vitest';
import {
  backupFileName,
  backupStamp,
  isISODate,
  isISODateTime,
  isNonNegativeInt,
  newId,
  nowISO,
  todayISO,
} from './util';

describe('isISODate', () => {
  it('accepts real calendar dates', () => {
    expect(isISODate('2026-10-22')).toBe(true);
    expect(isISODate('2028-02-29')).toBe(true);
  });

  it('rejects impossible or malformed dates', () => {
    expect(isISODate('2027-02-29')).toBe(false);
    expect(isISODate('2026-13-01')).toBe(false);
    expect(isISODate('2026-10-32')).toBe(false);
    expect(isISODate('2026-1-5')).toBe(false);
    expect(isISODate('2026-10-22T10:00:00Z')).toBe(false);
    expect(isISODate(20261022)).toBe(false);
  });
});

describe('isISODateTime', () => {
  it('accepts offsets, Z and fractions', () => {
    expect(isISODateTime('2026-10-20T08:36:00-04:00')).toBe(true);
    expect(isISODateTime('2026-10-20T12:36:00Z')).toBe(true);
    expect(isISODateTime('2026-10-20T12:36:00.123Z')).toBe(true);
  });

  it('rejects dates without time or zone', () => {
    expect(isISODateTime('2026-10-20')).toBe(false);
    expect(isISODateTime('2026-10-20T08:36:00')).toBe(false);
    expect(isISODateTime('2026-10-20T25:61:00Z')).toBe(false);
  });
});

describe('isNonNegativeInt', () => {
  it('accepts integers and rejects decimals, negatives and non numbers', () => {
    expect(isNonNegativeInt(0)).toBe(true);
    expect(isNonNegativeInt(125050)).toBe(true);
    expect(isNonNegativeInt(1250.5)).toBe(false);
    expect(isNonNegativeInt(-1)).toBe(false);
    expect(isNonNegativeInt('10')).toBe(false);
    expect(isNonNegativeInt(Number.NaN)).toBe(false);
  });
});

describe('clock helpers', () => {
  it('nowISO uses the given local time and a valid offset', () => {
    const iso = nowISO(new Date(2026, 9, 20, 8, 36, 5));
    expect(iso.startsWith('2026-10-20T08:36:05')).toBe(true);
    expect(isISODateTime(iso)).toBe(true);
  });

  it('todayISO is the local date', () => {
    expect(todayISO(new Date(2026, 0, 5, 23, 59, 0))).toBe('2026-01-05');
  });

  it('backup names use the local stamp', () => {
    expect(backupStamp('2026-10-22T16:57:00-04:00')).toBe('2026-10-22-1657');
    expect(backupFileName('2026-10-22T16:57:00-04:00')).toBe(
      'asistente-tcp-respaldo-2026-10-22-1657.json',
    );
  });

  it('newId returns different uuid-shaped ids', () => {
    const a = newId();
    expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(newId()).not.toBe(a);
  });
});
