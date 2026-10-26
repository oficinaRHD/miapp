import { describe, expect, it } from 'vitest';
import type { Obligacion } from '../data/models';
import { nextYearPlan, nextYearToGenerate } from './nextYear';
import { planSummary } from './yearDates';

function ob(periodoClave: string, vence: string): Obligacion {
  return {
    id: `${periodoClave}-${vence}`,
    tributoCodigo: '0114022',
    periodoTipo: 'mensual',
    periodoClave,
    periodoEtiqueta: periodoClave,
    vence,
    venceOrigen: 'calculada',
    estado: 'pendiente',
    creadoEn: '2026-10-01T08:00:00-04:00',
    actualizadoEn: '2026-10-01T08:00:00-04:00',
  };
}

describe('nextYearToGenerate', () => {
  it('offers the next year when it has no obligations', () => {
    expect(nextYearToGenerate([ob('2026-10', '2026-11-20')], '2026-10-25')).toBe(2027);
    expect(nextYearToGenerate([], '2026-10-25')).toBe(2027);
  });

  it('does not count a December period due in January as next year', () => {
    expect(nextYearToGenerate([ob('2026-12', '2027-01-20')], '2026-10-25')).toBe(2027);
  });

  it('offers nothing once next year already has obligations', () => {
    expect(nextYearToGenerate([ob('2026-10', '2026-11-20'), ob('2027-01', '2027-02-22')], '2026-10-25')).toBeNull();
  });

  it('follows the year of today', () => {
    expect(nextYearToGenerate([ob('2027-01', '2027-02-22')], '2027-03-02')).toBe(2028);
  });
});

describe('nextYearPlan', () => {
  it('creates all 12 months of a monthly tributo, sorted by due date', () => {
    const plan = nextYearPlan(['0114022'], 2027);
    expect(plan).toHaveLength(12);
    expect(plan[0]!.periodoClave).toBe('2027-01');
    expect(plan[0]!.vence).toBe('2027-02-22'); // the 20th is a Saturday
    expect(plan[11]!.vence).toBe('2028-01-20');
    expect(plan.every((d) => d.venceOrigen === 'calculada')).toBe(true);
  });

  it('includes the annual tributo with its fixed date', () => {
    const plan = nextYearPlan(['0114022', '0530222'], 2027);
    expect(plan).toHaveLength(13);
    expect(planSummary(plan).last).toBe('2028-04-30');
  });

  it('is empty without active tributos and ignores unknown or eventual ones', () => {
    expect(nextYearPlan([], 2027)).toEqual([]);
    expect(nextYearPlan(['0730122', 'nope'], 2027)).toEqual([]);
  });
});
