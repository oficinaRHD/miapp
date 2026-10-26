import { describe, expect, it } from 'vitest';
import { calcMonth, draftFromTotals, evaluateDraft, isEdited, percentText } from './calculadora';

describe('calcMonth', () => {
  it('is zero without income', () => {
    expect(calcMonth({ ventas: 0, ingresos: 0 })).toEqual({
      ventas: 0,
      ingresos: 0,
      ventasTax: 0,
      isipTax: 0,
      total: 0,
    });
  });
  it('applies both rules: 10 % of 1,000.00 and 5 % of (5,000.00 - 3,260.00)', () => {
    const r = calcMonth({ ventas: 100_000, ingresos: 500_000 });
    expect(r.ventasTax).toBe(10_000);
    expect(r.isipTax).toBe(8_700);
    expect(r.total).toBe(18_700);
  });
  it('charges no ISIP up to the monthly exempt minimum', () => {
    expect(calcMonth({ ventas: 300_000, ingresos: 300_000 }).isipTax).toBe(0);
    expect(calcMonth({ ventas: 326_000, ingresos: 326_000 }).isipTax).toBe(0);
  });
  it('rounds half up', () => {
    expect(calcMonth({ ventas: 12_345, ingresos: 12_345 }).ventasTax).toBe(1_235);
    expect(calcMonth({ ventas: 326_100, ingresos: 326_100 }).isipTax).toBe(5);
  });
});

describe('draft', () => {
  it('starts from the month totals and detects edits', () => {
    const t = { ventas: 100_000, ingresos: 125_050 };
    const d = draftFromTotals(t);
    expect(d).toEqual({ ventasText: '1000', ingresosText: '1250.50' });
    expect(isEdited(d, t)).toBe(false);
    expect(isEdited({ ...d, ingresosText: '1,250.50' }, t)).toBe(false);
    expect(isEdited({ ...d, ingresosText: '1300' }, t)).toBe(true);
  });
  it('evaluates a valid draft', () => {
    const e = evaluateDraft({ ventasText: '1000', ingresosText: '5000' });
    expect(e.errors).toEqual([]);
    expect(e.result?.total).toBe(18_700);
  });
  it('accepts zero but not empty or malformed text', () => {
    expect(evaluateDraft({ ventasText: '0', ingresosText: '0' }).result?.total).toBe(0);
    expect(evaluateDraft({ ventasText: '', ingresosText: '10' })).toEqual({
      result: null,
      errors: ['ventas-invalid'],
    });
    expect(evaluateDraft({ ventasText: '1', ingresosText: 'x' }).errors).toEqual(['ingresos-invalid']);
    expect(evaluateDraft({ ventasText: '', ingresosText: '' }).errors).toEqual([
      'ventas-invalid',
      'ingresos-invalid',
    ]);
  });
  it('rejects sales above total income', () => {
    expect(evaluateDraft({ ventasText: '600', ingresosText: '500' })).toEqual({
      result: null,
      errors: ['ventas-exceeds'],
    });
  });
});

describe('percentText', () => {
  it('prints basis points as a percentage', () => {
    expect(percentText(1000)).toBe('10 %');
    expect(percentText(500)).toBe('5 %');
    expect(percentText(10)).toBe('0.1 %');
  });
});
