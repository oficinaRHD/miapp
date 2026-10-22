import { describe, expect, it } from 'vitest';
import { salesTax } from './ventas';

describe('salesTax (0114022)', () => {
  it('is 10 % of the monthly income', () => {
    expect(salesTax(1_250_000)).toBe(125_000); // 12,500.00 -> 1,250.00
    expect(salesTax(0)).toBe(0);
  });

  it('rounds half up', () => {
    expect(salesTax(5)).toBe(1); // 0.5 centavo -> 1
    expect(salesTax(4)).toBe(0); // 0.4 -> 0
  });
});
