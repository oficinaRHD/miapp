import { describe, expect, it } from 'vitest';
import { daysText, overdueText } from './inicio';

describe('daysText', () => {
  it('describes days left or passed', () => {
    expect(daysText(0)).toBe('hoy');
    expect(daysText(1)).toBe('mañana');
    expect(daysText(5)).toBe('en 5 días');
    expect(daysText(-1)).toBe('hace 1 día');
    expect(daysText(-5)).toBe('hace 5 días');
  });
});

describe('overdueText', () => {
  it('handles singular and plural', () => {
    expect(overdueText(1)).toBe('Tienes 1 obligación vencida.');
    expect(overdueText(3)).toBe('Tienes 3 obligaciones vencidas.');
  });
});
