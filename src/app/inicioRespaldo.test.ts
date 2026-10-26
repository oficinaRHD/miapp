import { describe, expect, it } from 'vitest';
import { showBackupAlert } from './inicioRespaldo';

describe('showBackupAlert', () => {
  it('shows when there is no backup or it is due', () => {
    expect(showBackupAlert({ status: 'never', days: null }, true)).toBe(true);
    expect(showBackupAlert({ status: 'due', days: 45 }, true)).toBe(true);
  });
  it('hides when the backup is recent', () => {
    expect(showBackupAlert({ status: 'ok', days: 3 }, true)).toBe(false);
  });
  it('hides when the user turned the reminder off', () => {
    expect(showBackupAlert({ status: 'never', days: null }, false)).toBe(false);
    expect(showBackupAlert({ status: 'due', days: 45 }, false)).toBe(false);
  });
});
