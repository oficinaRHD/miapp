import { describe, expect, it } from 'vitest';
import { formatDate } from './format';

describe('formatDate', () => {
  it('formats a valid date', () => {
    expect(formatDate('2026-11-20')).toBe('20 nov 2026');
    expect(formatDate('2027-01-05')).toBe('5 ene 2027');
  });
  it('returns invalid text unchanged', () => {
    expect(formatDate('2026-02-30')).toBe('2026-02-30');
    expect(formatDate('hola')).toBe('hola');
  });
});
