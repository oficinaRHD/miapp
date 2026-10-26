import { describe, expect, it } from 'vitest';
import { todayLocal } from './today';

describe('todayLocal', () => {
  it('formats local date parts with zero padding', () => {
    expect(todayLocal(new Date(2026, 9, 26, 23, 59))).toBe('2026-10-26');
    expect(todayLocal(new Date(2027, 0, 5, 0, 1))).toBe('2027-01-05');
  });
  it('defaults to now and returns a valid shape', () => {
    expect(todayLocal()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
