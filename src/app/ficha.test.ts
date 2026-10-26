import { describe, expect, it } from 'vitest';
import { buildSheetText } from './ficha';

const base = {
  tributoName: 'Ventas y servicios',
  tributoCodigo: '0114022',
  periodoEtiqueta: 'Septiembre 2026',
  vence: '2026-10-20',
  codigoBarras: '764 - 16',
  importe: 125050,
  rc05: '1234-5678-9012-3456',
};

describe('buildSheetText', () => {
  it('includes every field when present', () => {
    expect(buildSheetText(base).split('\n')).toEqual([
      'Ficha de pago',
      'Tributo: Ventas y servicios (0114022)',
      'Período: Septiembre 2026',
      'Fecha límite: 20 oct 2026',
      'Código de barras: 764 - 16',
      'Importe a pagar: 1250.50 CUP',
      'RC-05: 1234-5678-9012-3456',
      '',
      'Estimación orientativa. Confirma con tu vector fiscal.',
    ]);
  });

  it('leaves out what is missing, and never the RC-05 unless given', () => {
    const text = buildSheetText({ ...base, codigoBarras: undefined, importe: null, rc05: undefined });
    expect(text).not.toContain('Código de barras');
    expect(text).not.toContain('Importe a pagar');
    expect(text).not.toContain('RC-05');
    expect(text).toContain('Tributo: Ventas y servicios (0114022)');
  });

  it('writes a zero amount, not nothing', () => {
    expect(buildSheetText({ ...base, importe: 0 })).toContain('Importe a pagar: 0.00 CUP');
  });
});
