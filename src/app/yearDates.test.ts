import { describe, expect, it } from 'vitest';
import { suggestedTributoCodes } from '../domain/tributos.catalog';
import {
  buildPlan,
  cleanVectorDates,
  groupPlan,
  monthStart,
  patternDates,
  planSummary,
  yearOf,
} from './yearDates';

const TODAY = '2026-10-23';
const BASE = suggestedTributoCodes(false); // 0114022, 0510122, 0530222
const WITH_EMPLOYEES = suggestedTributoCodes(true);
const keyOf = (d: { tributoCodigo: string; periodoClave: string }) =>
  `${d.tributoCodigo}|${d.periodoClave}`;

describe('yearOf and monthStart', () => {
  it('takes the year and the first day of the month of today', () => {
    expect(yearOf('2026-10-23')).toBe(2026);
    expect(monthStart('2026-10-23')).toBe('2026-10-01');
    expect(monthStart('2026-01-01')).toBe('2026-01-01');
  });

  it('rejects an invalid date', () => {
    expect(() => yearOf('2026-13-01')).toThrow();
    expect(() => monthStart('hoy')).toThrow();
  });
});

describe('buildPlan (option A: from the current month on)', () => {
  it('creates only periods due on or after the first day of this month', () => {
    const plan = buildPlan({ activeTributos: BASE, today: TODAY });
    expect(plan.every((d) => d.vence >= '2026-10-01')).toBe(true);
  });

  it('keeps September (due in October) and drops August (due in September)', () => {
    const keys = buildPlan({ activeTributos: BASE, today: TODAY }).map(keyOf);
    expect(keys).toContain('0114022|2026-09');
    expect(keys).not.toContain('0114022|2026-08');
    expect(keys).toContain('0114022|2026-12');
  });

  it('creates 4 monthly rows per monthly tributo plus the annual one', () => {
    const plan = buildPlan({ activeTributos: BASE, today: TODAY });
    expect(plan).toHaveLength(9);
    const annual = plan.find((d) => d.tributoCodigo === '0530222');
    expect(annual?.vence).toBe('2027-04-30');
  });

  it('adds the employee tributos, including the quarterly one', () => {
    const plan = buildPlan({ activeTributos: WITH_EMPLOYEES, today: TODAY });
    expect(plan).toHaveLength(23);
    expect(plan.filter((d) => d.tributoCodigo === '0610322')).toHaveLength(2);
  });

  it('uses the calculated date as origin when there is no vector date', () => {
    const plan = buildPlan({ activeTributos: BASE, today: TODAY });
    expect(plan.every((d) => d.venceOrigen === 'calculada')).toBe(true);
    expect(plan.find((d) => keyOf(d) === '0114022|2026-09')?.vence).toBe('2026-10-20');
  });

  it('returns an empty plan when only eventual or unknown tributos are active', () => {
    expect(buildPlan({ activeTributos: ['0730122', '9999999'], today: TODAY })).toEqual([]);
  });

  it('creates the whole year when today is in January', () => {
    const plan = buildPlan({ activeTributos: BASE, today: '2026-01-15' });
    expect(plan).toHaveLength(25);
  });

  it('keeps only the last two monthly periods when today is in December', () => {
    const plan = buildPlan({ activeTributos: BASE, today: '2026-12-05' });
    expect(plan).toHaveLength(5);
  });

  it('is sorted by due date', () => {
    const dates = buildPlan({ activeTributos: WITH_EMPLOYEES, today: TODAY }).map((d) => d.vence);
    expect(dates).toEqual([...dates].sort());
  });
});

describe('buildPlan with vector dates', () => {
  const KEY = '0114022|2026-09';

  it('replaces the calculated date and marks the origin as vector', () => {
    const plan = buildPlan({ activeTributos: BASE, today: TODAY, vectorDates: { [KEY]: '2026-10-15' } });
    const row = plan.find((d) => keyOf(d) === KEY);
    expect(row?.vence).toBe('2026-10-15');
    expect(row?.venceOrigen).toBe('vector');
    expect(plan.filter((d) => d.venceOrigen === 'vector')).toHaveLength(1);
  });

  it('keeps the row even if the vector date is before this month', () => {
    const plan = buildPlan({ activeTributos: BASE, today: TODAY, vectorDates: { [KEY]: '2026-09-30' } });
    expect(plan).toHaveLength(9);
    expect(plan.find((d) => keyOf(d) === KEY)?.vence).toBe('2026-09-30');
  });

  it('does not create a row for a period the plan leaves out', () => {
    const plan = buildPlan({
      activeTributos: BASE,
      today: TODAY,
      vectorDates: { '0114022|2026-08': '2026-10-02' },
    });
    expect(plan).toHaveLength(9);
    expect(plan.map(keyOf)).not.toContain('0114022|2026-08');
  });

  it('ignores invalid or empty vector values', () => {
    const plan = buildPlan({
      activeTributos: BASE,
      today: TODAY,
      vectorDates: { [KEY]: '2026-02-30', '0114022|2026-10': '' },
    });
    expect(plan.every((d) => d.venceOrigen === 'calculada')).toBe(true);
  });
});

describe('cleanVectorDates', () => {
  it('keeps valid dates and drops empty or invalid ones', () => {
    expect(cleanVectorDates({ a: '2026-10-15', b: '', c: '15/10/2026', d: '2026-02-30' })).toEqual({
      a: '2026-10-15',
    });
  });

  it('accepts undefined', () => {
    expect(cleanVectorDates(undefined)).toEqual({});
  });
});

describe('groupPlan', () => {
  it('groups by tributo, ordered by code, with the short name', () => {
    const groups = groupPlan(buildPlan({ activeTributos: BASE, today: TODAY }));
    expect(groups.map((g) => g.code)).toEqual(['0114022', '0510122', '0530222']);
    expect(groups.map((g) => g.name)).toEqual(['Ventas y servicios', 'ISIP mensual', 'ISIP anual']);
    expect(groups.map((g) => g.rows.length)).toEqual([4, 4, 1]);
  });

  it('is empty for an empty plan', () => {
    expect(groupPlan([])).toEqual([]);
  });
});

describe('planSummary', () => {
  it('gives count and date range', () => {
    const s = planSummary(buildPlan({ activeTributos: BASE, today: TODAY }));
    expect(s.count).toBe(9);
    expect(s.first).toBe('2026-10-20');
    expect(s.last).toBe('2027-04-30');
  });

  it('handles an empty plan', () => {
    expect(planSummary([])).toEqual({ count: 0, first: null, last: null });
  });
});

describe('patternDates', () => {
  it('maps each key of the plan to its calculated date', () => {
    const map = patternDates({ activeTributos: BASE, today: TODAY });
    expect(Object.keys(map)).toHaveLength(9);
    expect(map['0114022|2026-09']).toBe('2026-10-20');
  });
});
