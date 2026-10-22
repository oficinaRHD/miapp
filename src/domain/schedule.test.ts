import { describe, expect, it } from 'vitest';
import { toHolidaySet } from './businessDays';
import { generateObligations, obligationKey, onlyNew, type ObligationDraft } from './schedule';
import { suggestedTributoCodes } from './tributos.catalog';

// Test-only assumption derived from the vector: Jan 1 2027 is not a business day,
// which reproduces the vector date 15/01/2027. This is NOT the app's holiday data (pending in 01).
const HOLIDAYS_FIXTURE = toHolidaySet(['2027-01-01']);

const ALL = ['0810132', '0820232', '0114022', '0510122', '0520522', '0610322', '0530222'];

function find(list: ObligationDraft[], code: string, key: string): ObligationDraft | undefined {
  return list.find((d) => d.tributoCodigo === code && d.periodoClave === key);
}

describe('generateObligations: vector 2026-27 (01, section 2)', () => {
  const list = generateObligations({ activeTributos: ALL, year: 2026, holidays: HOLIDAYS_FIXTURE });

  it('generates 12 + 12 + 12 + 12 + 12 monthly, 4 quarterly and 1 annual', () => {
    expect(list).toHaveLength(65);
  });

  it('social security (0810132 and 0820232): 10th business day', () => {
    const expected: Record<string, string> = {
      '2026-07': '2026-08-14',
      '2026-08': '2026-09-14',
      '2026-09': '2026-10-14',
      '2026-10': '2026-11-13',
      '2026-11': '2026-12-14',
      '2026-12': '2027-01-15',
    };
    for (const code of ['0810132', '0820232']) {
      for (const [key, due] of Object.entries(expected)) {
        expect(find(list, code, key)?.vence, `${code} ${key}`).toBe(due);
      }
    }
  });

  it('0114022, 0510122 and 0520522: day 20, weekend moves to Monday', () => {
    const expected: Record<string, string> = {
      '2026-07': '2026-08-20',
      '2026-08': '2026-09-21',
      '2026-09': '2026-10-20',
      '2026-10': '2026-11-20',
      '2026-11': '2026-12-21',
      '2026-12': '2027-01-20',
    };
    for (const code of ['0114022', '0510122', '0520522']) {
      for (const [key, due] of Object.entries(expected)) {
        expect(find(list, code, key)?.vence, `${code} ${key}`).toBe(due);
      }
    }
  });

  it('0610322 quarterly and 0530222 annual', () => {
    expect(find(list, '0610322', '2026-T3')?.vence).toBe('2026-10-20');
    expect(find(list, '0610322', '2026-T4')?.vence).toBe('2027-01-20');
    expect(find(list, '0530222', '2026')?.vence).toBe('2027-04-30');
  });

  it('labels and origin', () => {
    const sept = find(list, '0114022', '2026-09');
    expect(sept?.periodoEtiqueta).toBe('Septiembre 2026');
    expect(sept?.periodoTipo).toBe('mensual');
    expect(sept?.venceOrigen).toBe('calculada');
    expect(find(list, '0610322', '2026-T3')?.periodoEtiqueta).toBe('T3 2026 (jul-sep)');
    expect(find(list, '0530222', '2026')?.periodoEtiqueta).toBe('Año 2026');
  });

  it('is sorted by due date', () => {
    for (let i = 1; i < list.length; i++) {
      const prev = list[i - 1];
      const cur = list[i];
      expect((prev?.vence ?? '') <= (cur?.vence ?? '')).toBe(true);
    }
  });
});

describe('generateObligations: options', () => {
  it('without holidays, January SS is one day earlier (14/01)', () => {
    const list = generateObligations({ activeTributos: ['0810132'], year: 2026 });
    expect(find(list, '0810132', '2026-12')?.vence).toBe('2027-01-14');
  });

  it('a vector date replaces the calculated one', () => {
    const key = obligationKey('0114022', '2026-09');
    const list = generateObligations({
      activeTributos: ['0114022'],
      year: 2026,
      vectorDates: { [key]: '2026-10-19' },
    });
    const item = find(list, '0114022', '2026-09');
    expect(item?.vence).toBe('2026-10-19');
    expect(item?.venceOrigen).toBe('vector');
    expect(find(list, '0114022', '2026-08')?.venceOrigen).toBe('calculada');
  });

  it('an invalid vector date is ignored', () => {
    const key = obligationKey('0114022', '2026-09');
    const list = generateObligations({ activeTributos: ['0114022'], year: 2026, vectorDates: { [key]: '2026-02-30' } });
    expect(find(list, '0114022', '2026-09')?.venceOrigen).toBe('calculada');
  });

  it('ignores eventual and unknown codes, and duplicates', () => {
    const list = generateObligations({ activeTributos: ['0730122', '1060122', '9999999', '0530222', '0530222'], year: 2026 });
    expect(list).toHaveLength(1);
  });

  it('default suggestion without employees: 12 + 12 + 1', () => {
    const list = generateObligations({ activeTributos: suggestedTributoCodes(false), year: 2026 });
    expect(list).toHaveLength(25);
  });
});

describe('onlyNew', () => {
  it('is idempotent: existing keys are skipped', () => {
    const list = generateObligations({ activeTributos: ['0114022'], year: 2026 });
    const existing = new Set([obligationKey('0114022', '2026-01'), obligationKey('0114022', '2026-02')]);
    expect(onlyNew(list, existing)).toHaveLength(10);
    const all = new Set(list.map((d) => obligationKey(d.tributoCodigo, d.periodoClave)));
    expect(onlyNew(list, all)).toHaveLength(0);
  });
});
