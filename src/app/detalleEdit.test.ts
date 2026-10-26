import { describe, expect, it } from 'vitest';
import { BARCODE_MAX, checkBarcode, checkDueDate, checkOfficialAmount } from './detalleEdit';

const current = { vence: '2026-10-20', venceOrigen: 'calculada' } as const;

describe('checkDueDate', () => {
  it('accepts a different valid date', () => {
    expect(checkDueDate('2026-10-21', current, 'vector')).toEqual({ ok: true, value: '2026-10-21' });
  });
  it('accepts the same date when only the origin changes', () => {
    expect(checkDueDate('2026-10-20', current, 'vector')).toEqual({ ok: true, value: '2026-10-20' });
  });
  it('refuses the same date and origin', () => {
    expect(checkDueDate('2026-10-20', current, 'calculada')).toEqual({ ok: false, error: 'date-same' });
  });
  it('refuses invalid dates', () => {
    expect(checkDueDate('', current, 'vector')).toEqual({ ok: false, error: 'date-invalid' });
    expect(checkDueDate('2026-02-30', current, 'vector')).toEqual({ ok: false, error: 'date-invalid' });
  });
});

describe('checkBarcode', () => {
  it('trims and collapses spaces', () => {
    expect(checkBarcode('  764  -  16 ')).toEqual({ ok: true, value: '764 - 16' });
  });
  it('refuses empty and too long', () => {
    expect(checkBarcode('   ')).toEqual({ ok: false, error: 'barcode-empty' });
    expect(checkBarcode('1'.repeat(BARCODE_MAX + 1))).toEqual({ ok: false, error: 'barcode-too-long' });
    expect(checkBarcode('1'.repeat(BARCODE_MAX)).ok).toBe(true);
  });
});

describe('checkOfficialAmount', () => {
  it('parses typed amounts into centavos', () => {
    expect(checkOfficialAmount('1,250.50')).toEqual({ ok: true, value: 125050 });
    expect(checkOfficialAmount('30')).toEqual({ ok: true, value: 3000 });
  });
  it('refuses text that is not an amount', () => {
    expect(checkOfficialAmount('')).toEqual({ ok: false, error: 'amount-invalid' });
    expect(checkOfficialAmount('abc')).toEqual({ ok: false, error: 'amount-invalid' });
    expect(checkOfficialAmount('-5')).toEqual({ ok: false, error: 'amount-invalid' });
  });
});
