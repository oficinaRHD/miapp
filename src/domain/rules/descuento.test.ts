import { describe, expect, it } from 'vitest';
import { electronicDiscount } from './descuento.js';

describe('electronicDiscount', () => {
  it('is 3 % of the amount', () => {
    expect(electronicDiscount(125_000)).toEqual({ discount: 3_750, total: 121_250 });
    expect(electronicDiscount(0)).toEqual({ discount: 0, total: 0 });
  });

  it('rounds half up', () => {
    expect(electronicDiscount(50)).toEqual({ discount: 2, total: 48 }); // 1.5 -> 2
  });
});
