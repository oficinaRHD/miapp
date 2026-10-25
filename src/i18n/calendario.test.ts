import { describe, expect, it } from 'vitest';
import { dayCountText } from './calendario';

describe('dayCountText', () => {
  it('handles zero, one and many', () => {
    expect(dayCountText(0)).toBe('Sin vencimientos');
    expect(dayCountText(1)).toBe('1 vencimiento');
    expect(dayCountText(3)).toBe('3 vencimientos');
  });
});
