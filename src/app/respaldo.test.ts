import { describe, expect, it } from 'vitest';
import {
  BACKUP_DUE_DAYS,
  backupState,
  isWipeConfirmed,
  parseBool,
  parseLastBackup,
  shouldRecordBackup,
} from './respaldo';

describe('parseLastBackup', () => {
  it('accepts an ISO date-time with offset', () => {
    expect(parseLastBackup('2026-10-20T08:36:00-04:00')).toBe('2026-10-20T08:36:00-04:00');
  });
  it('rejects non-strings, malformed text and impossible dates', () => {
    expect(parseLastBackup(undefined)).toBeUndefined();
    expect(parseLastBackup(42)).toBeUndefined();
    expect(parseLastBackup('2026-10-20')).toBeUndefined();
    expect(parseLastBackup('2026-02-30T10:00:00-05:00')).toBeUndefined();
  });
});

describe('backupState', () => {
  it('is "never" without a date', () => {
    expect(backupState(undefined, '2026-10-26')).toEqual({ status: 'never', days: null });
  });
  it('is "ok" under the threshold', () => {
    expect(backupState('2026-10-26T09:00:00-04:00', '2026-10-26')).toEqual({ status: 'ok', days: 0 });
    expect(backupState('2026-09-28T09:00:00-04:00', '2026-10-26')).toEqual({ status: 'ok', days: 28 });
  });
  it('is "due" at the threshold and beyond', () => {
    expect(BACKUP_DUE_DAYS).toBe(30);
    expect(backupState('2026-09-26T09:00:00-04:00', '2026-10-26')).toEqual({ status: 'due', days: 30 });
    expect(backupState('2026-01-01T09:00:00-05:00', '2026-10-26').status).toBe('due');
  });
  it('treats a future date as 0 days', () => {
    expect(backupState('2026-11-01T09:00:00-04:00', '2026-10-26')).toEqual({ status: 'ok', days: 0 });
  });
  it('counts across a year boundary', () => {
    expect(backupState('2026-12-20T09:00:00-05:00', '2027-01-18')).toEqual({ status: 'ok', days: 29 });
  });
});

describe('shouldRecordBackup', () => {
  it('records shared and downloaded, not cancelled', () => {
    expect(shouldRecordBackup('shared')).toBe(true);
    expect(shouldRecordBackup('downloaded')).toBe(true);
    expect(shouldRecordBackup('cancelled')).toBe(false);
  });
});

describe('isWipeConfirmed', () => {
  it('needs the word, ignoring case and spaces', () => {
    expect(isWipeConfirmed('BORRAR')).toBe(true);
    expect(isWipeConfirmed('  borrar ')).toBe(true);
    expect(isWipeConfirmed('borrar todo')).toBe(false);
    expect(isWipeConfirmed('')).toBe(false);
  });
});

describe('parseBool', () => {
  it('uses the fallback for non-booleans', () => {
    expect(parseBool(true, false)).toBe(true);
    expect(parseBool(false, true)).toBe(false);
    expect(parseBool('yes', true)).toBe(true);
    expect(parseBool(undefined, false)).toBe(false);
  });
});
