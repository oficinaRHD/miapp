import { describe, expect, it } from 'vitest';
import { MONTHLY_EXEMPT_MINIMUM, monthlyIsip } from './isipMensual';

describe('monthlyIsip (0510122)', () => {
  it('is zero up to the exempt minimum of 3,260.00', () => {
    expect(MONTHLY_EXEMPT_MINIMUM).toBe(326_000);
    expect(monthlyIsip(0)).toBe(0);
    expect(monthlyIsip(300_000)).toBe(0);
    expect(monthlyIsip(326_000)).toBe(0);
  });

  it('is 5 % of the excess over the minimum', () => {
    expect(monthlyIsip(1_250_000)).toBe(46_200); // 5 % x 9,240.00 = 462.00
    expect(monthlyIsip(326_100)).toBe(5); // 5 % x 1.00 = 0.05
  });

  it('rounds half up', () => {
    expect(monthlyIsip(326_010)).toBe(1); // 5 % x 0.10 = 0.005 -> 1 centavo
    expect(monthlyIsip(326_009)).toBe(0); // 0.00045 -> 0
  });
});
