import { describe, expect, it } from 'vitest';
import type { Obligacion } from '../data/models';
import {
  defaultYear,
  editableRows,
  fiscalYearOf,
  fiscalYears,
  groupEditable,
  patternByKey,
  pendingChanges,
  setEditDate,
} from './editDates';

function ob(over: Partial<Obligacion> & Pick<Obligacion, 'id' | 'vence'>): Obligacion {
  return {
    tributoCodigo: '0114022',
    periodoTipo: 'mensual',
    periodoClave: '2026-09',
    periodoEtiqueta: 'Septiembre 2026',
    venceOrigen: 'calculada',
    estado: 'pendiente',
    creadoEn: '2026-10-01T08:00:00-04:00',
    actualizadoEn: '2026-10-01T08:00:00-04:00',
    ...over,
  };
}

const list = [
  ob({ id: 'a', vence: '2026-11-20', periodoClave: '2026-10' }),
  ob({ id: 'b', vence: '2026-10-20', periodoClave: '2026-09' }),
  ob({ id: 'c', vence: '2026-10-20', tributoCodigo: '0510122', periodoClave: '2026-09' }),
  ob({ id: 'd', vence: '2026-09-21', estado: 'pagada', periodoClave: '2026-08' }),
  ob({ id: 'e', vence: '2026-09-21', estado: 'omitida', periodoClave: '2026-08' }),
  ob({ id: 'f', vence: '2027-04-30', tributoCodigo: '0530222', periodoTipo: 'anual', periodoClave: '2026' }),
  ob({ id: 'g', vence: '2027-01-20', periodoClave: '2026-12' }),
  ob({ id: 'h', vence: '2027-02-22', periodoClave: '2027-01' }),
];

describe('fiscalYearOf and fiscalYears', () => {
  it('takes the year from the period, not from the due date', () => {
    expect(fiscalYearOf(list[5]!)).toBe(2026); // annual 2026, due in April 2027
    expect(fiscalYearOf(list[6]!)).toBe(2026); // December 2026, due in January 2027
    expect(fiscalYearOf(ob({ id: 'x', vence: '2026-10-20', periodoClave: '2026-T3' }))).toBe(2026);
  });

  it('lists the years with pending obligations, ascending', () => {
    expect(fiscalYears(list)).toEqual([2026, 2027]);
  });

  it('ignores years that only have paid or omitted obligations', () => {
    const only = [ob({ id: 'p', vence: '2025-10-20', periodoClave: '2025-09', estado: 'pagada' })];
    expect(fiscalYears(only)).toEqual([]);
  });
});

describe('defaultYear', () => {
  it('uses the current year when it is available, else the latest one', () => {
    expect(defaultYear([2026, 2027], 2026)).toBe(2026);
    expect(defaultYear([2025, 2026], 2027)).toBe(2026);
    expect(defaultYear([], 2026)).toBe(2026);
  });
});

describe('editableRows and groupEditable', () => {
  it('keeps only pending obligations of the year, ordered by code then date', () => {
    expect(editableRows(list, 2026).map((o) => o.id)).toEqual(['b', 'a', 'g', 'c', 'f']);
    expect(editableRows(list, 2027).map((o) => o.id)).toEqual(['h']);
  });

  it('groups by tributo with its short name', () => {
    const groups = groupEditable(editableRows(list, 2026));
    expect(groups.map((g) => g.code)).toEqual(['0114022', '0510122', '0530222']);
    expect(groups[0]!.name).toBe('Ventas y servicios');
    expect(groups[0]!.rows.map((o) => o.id)).toEqual(['b', 'a', 'g']);
  });
});

describe('setEditDate', () => {
  it('sets, replaces and removes without mutating the original', () => {
    const empty = {};
    const one = setEditDate(empty, 'a', '2026-11-19');
    const two = setEditDate(one, 'a', '2026-11-18');
    expect(two).toEqual({ a: '2026-11-18' });
    expect(setEditDate(two, 'a', '')).toEqual({});
    expect(empty).toEqual({});
    expect(one).toEqual({ a: '2026-11-19' });
  });
});

describe('pendingChanges', () => {
  it('returns only valid dates that differ from the stored one', () => {
    const draft = { a: '2026-11-19', b: '2026-10-20', c: 'hola', g: '2027-02-30' };
    expect(pendingChanges(list, draft)).toEqual([{ id: 'a', vence: '2026-11-19' }]);
  });

  it('never changes paid or omitted obligations, nor unknown ids', () => {
    const draft = { d: '2026-09-25', e: '2026-09-25', zzz: '2026-09-25' };
    expect(pendingChanges(list, draft)).toEqual([]);
  });

  it('includes edits of every year, not only the one on screen', () => {
    const draft = { a: '2026-11-19', h: '2027-02-23' };
    expect(pendingChanges(list, draft).map((c) => c.id)).toEqual(['a', 'h']);
  });
});

describe('patternByKey', () => {
  it('calculates the pattern date of a monthly tributo by period key', () => {
    const p = patternByKey(['0114022', '0114022'], 2026);
    expect(p['0114022|2026-09']).toBe('2026-10-20');
    expect(Object.keys(p)).toHaveLength(12);
  });

  it('is empty without tributos', () => {
    expect(patternByKey([], 2026)).toEqual({});
  });
});
