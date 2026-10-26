import { describe, expect, it } from 'vitest';
import { emptyKind, formatNet, monthKeyFrom, tipoForNew } from './registroMonth';

describe('registroMonth', () => {
  it('builds month keys with zero padding', () => {
    expect(monthKeyFrom(2026, 10)).toBe('2026-10');
    expect(monthKeyFrom(2027, 2)).toBe('2027-02');
  });
  it('rejects invalid months', () => {
    expect(() => monthKeyFrom(2026, 0)).toThrow();
    expect(() => monthKeyFrom(2026, 13)).toThrow();
    expect(() => monthKeyFrom(2026.5, 1)).toThrow();
  });
  it('tells why the list is empty', () => {
    expect(emptyKind(0, 0)).toBe('month');
    expect(emptyKind(3, 0)).toBe('filter');
    expect(emptyKind(3, 2)).toBeNull();
  });
  it('formats a net amount with its sign', () => {
    const fmt = (c: number): string => `${c / 100} CUP`;
    expect(formatNet(12500, fmt)).toBe('125 CUP');
    expect(formatNet(0, fmt)).toBe('0 CUP');
    expect(formatNet(-5000, fmt)).toBe('-50 CUP');
  });
  it('picks the type for the new-movement button', () => {
    expect(tipoForNew('todos')).toBe('ingreso');
    expect(tipoForNew('ingreso')).toBe('ingreso');
    expect(tipoForNew('gasto')).toBe('gasto');
  });
});
