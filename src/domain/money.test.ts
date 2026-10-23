import { describe, expect, it } from 'vitest';
import { applyRateBp, formatCup, isCentavos, parseCup, subtractFloor } from './money.js';

describe('parseCup', () => {
  it('parses plain and decimal amounts', () => {
    expect(parseCup('1250')).toBe(125000);
    expect(parseCup('1250.5')).toBe(125050);
    expect(parseCup('1250.50')).toBe(125050);
    expect(parseCup('0.05')).toBe(5);
  });

  it('accepts thousands commas and a CUP suffix', () => {
    expect(parseCup('1,250.50 CUP')).toBe(125050);
    expect(parseCup('12,500')).toBe(1250000);
  });

  it('accepts a decimal comma only with 1-2 digits after it', () => {
    expect(parseCup('1250,5')).toBe(125050);
    expect(parseCup('12,25')).toBe(1225);
  });

  it('rejects invalid text', () => {
    for (const bad of ['', 'abc', '-5', '1.234', '1,2,3', '12.345', '.5']) {
      expect(parseCup(bad)).toBeNull();
    }
  });
});

describe('formatCup', () => {
  it('formats with thousands separators and two decimals', () => {
    expect(formatCup(125050)).toBe('1,250.50 CUP');
    expect(formatCup(5)).toBe('0.05 CUP');
    expect(formatCup(0)).toBe('0.00 CUP');
    expect(formatCup(100000000)).toBe('1,000,000.00 CUP');
  });

  it('supports negatives and no suffix', () => {
    expect(formatCup(-125050)).toBe('-1,250.50 CUP');
    expect(formatCup(125050, false)).toBe('1,250.50');
  });

  it('rejects non-integers', () => {
    expect(() => formatCup(1.5)).toThrow(RangeError);
  });
});

describe('applyRateBp', () => {
  it('applies percentages in basis points', () => {
    expect(applyRateBp(1250000, 1000)).toBe(125000);
    expect(applyRateBp(0, 1000)).toBe(0);
  });

  it('rounds half up to a whole centavo', () => {
    expect(applyRateBp(10, 500)).toBe(1); // 0.5 -> 1
    expect(applyRateBp(9, 500)).toBe(0); // 0.45 -> 0
    expect(applyRateBp(5, 1000)).toBe(1); // 0.5 -> 1
  });

  it('rejects invalid inputs', () => {
    expect(() => applyRateBp(-1, 500)).toThrow(RangeError);
    expect(() => applyRateBp(1.5, 500)).toThrow(RangeError);
    expect(() => applyRateBp(100, -1)).toThrow(RangeError);
    expect(() => applyRateBp(100, 0.5)).toThrow(RangeError);
  });
});

describe('helpers', () => {
  it('subtractFloor never goes below zero', () => {
    expect(subtractFloor(500, 200)).toBe(300);
    expect(subtractFloor(200, 500)).toBe(0);
  });

  it('isCentavos validates safe non-negative integers', () => {
    expect(isCentavos(0)).toBe(true);
    expect(isCentavos(125050)).toBe(true);
    expect(isCentavos(-1)).toBe(false);
    expect(isCentavos(1.5)).toBe(false);
    expect(isCentavos('5')).toBe(false);
  });
});
