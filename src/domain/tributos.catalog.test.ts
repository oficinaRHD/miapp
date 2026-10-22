import { describe, expect, it } from 'vitest';
import { findTributo, RULES_VERSION, suggestedTributoCodes, TRIBUTOS } from './tributos.catalog';

describe('catalog', () => {
  it('has the 9 tributos of 01 with unique codes', () => {
    expect(TRIBUTOS).toHaveLength(9);
    expect(new Set(TRIBUTOS.map((t) => t.code)).size).toBe(9);
    expect(RULES_VERSION).toBe('2026.1');
  });

  it('periodicity matches 01', () => {
    expect(findTributo('0114022')?.periodicity).toBe('mensual');
    expect(findTributo('0610322')?.periodicity).toBe('trimestral');
    expect(findTributo('0530222')?.periodicity).toBe('anual');
    expect(findTributo('0730122')?.periodicity).toBe('eventual');
    expect(findTributo('1060122')?.periodicity).toBe('eventual');
  });

  it('only the late surcharge is missing from the vector', () => {
    expect(TRIBUTOS.filter((t) => !t.inVector).map((t) => t.code)).toEqual(['1060122']);
  });

  it('eventual tributos have a manual date rule', () => {
    for (const t of TRIBUTOS.filter((x) => x.periodicity === 'eventual')) {
      expect(t.dateRule.kind).toBe('manual');
    }
  });

  it('unknown code returns undefined', () => {
    expect(findTributo('9999999')).toBeUndefined();
  });
});

describe('suggestedTributoCodes', () => {
  it('without employees: the three own tributos', () => {
    expect(suggestedTributoCodes(false)).toEqual(['0114022', '0510122', '0530222']);
  });

  it('with employees: adds the four employee tributos', () => {
    const codes = suggestedTributoCodes(true);
    expect(codes).toHaveLength(7);
    for (const c of ['0520522', '0610322', '0810132', '0820232']) {
      expect(codes).toContain(c);
    }
    expect(codes).not.toContain('0730122');
    expect(codes).not.toContain('1060122');
  });
});
