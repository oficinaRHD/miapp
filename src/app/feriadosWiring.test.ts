import { describe, expect, it } from 'vitest';
import { patternByKey } from './editDates';
import { nextYearPlan } from './nextYear';

// Business-day dates must move when the calculated date becomes a holiday.
describe('holidays in the calculated dates', () => {
  it('nextYearPlan moves a date that is declared a holiday', () => {
    const base = nextYearPlan(['0810132'], 2027);
    const first = base[0]!;
    const moved = nextYearPlan(['0810132'], 2027, new Set([first.vence]));
    const same = moved.find((d) => d.periodoClave === first.periodoClave)!;
    expect(same.vence > first.vence).toBe(true);
  });

  it('nextYearPlan without holidays equals the plan with an empty set', () => {
    expect(nextYearPlan(['0810132'], 2027, new Set())).toEqual(nextYearPlan(['0810132'], 2027));
  });

  it('patternByKey moves a date that is declared a holiday', () => {
    const base = patternByKey(['0810132'], 2027);
    const [key, due] = Object.entries(base)[0]!;
    const moved = patternByKey(['0810132'], 2027, new Set([due]));
    expect(moved[key]! > due).toBe(true);
  });
});
