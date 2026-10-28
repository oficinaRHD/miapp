import { describe, expect, it } from 'vitest';
import {
  addFeriado,
  feriadoDateText,
  groupByYear,
  isValidISODate,
  mergeFeriados,
  removeFeriado,
  validateFeriado,
} from './feriadosForm';

const A = { fecha: '2026-05-01', nombre: 'Día de los Trabajadores' };

describe('isValidISODate', () => {
  it('accepts real dates only', () => {
    expect(isValidISODate('2026-10-27')).toBe(true);
    expect(isValidISODate('2028-02-29')).toBe(true);
    expect(isValidISODate('2026-02-29')).toBe(false);
    expect(isValidISODate('2026-13-01')).toBe(false);
    expect(isValidISODate('27/10/2026')).toBe(false);
    expect(isValidISODate('')).toBe(false);
  });
});

describe('validateFeriado', () => {
  it('checks date, name and duplicates in that order', () => {
    expect(validateFeriado({ fecha: '', nombre: 'x' }, [])).toBe('fecha');
    expect(validateFeriado({ fecha: '2026-05-02', nombre: '   ' }, [])).toBe('nombre');
    expect(validateFeriado({ fecha: A.fecha, nombre: 'otro' }, [A])).toBe('duplicada');
    expect(validateFeriado({ fecha: '2026-05-02', nombre: 'ok' }, [A])).toBe(null);
  });
});

describe('addFeriado and removeFeriado', () => {
  it('adds sorted by date with the name trimmed, without touching the original', () => {
    const base = [A];
    const next = addFeriado(base, { fecha: '2026-01-01', nombre: '  Año Nuevo ' });
    expect(next).toEqual([{ fecha: '2026-01-01', nombre: 'Año Nuevo' }, A]);
    expect(base).toEqual([A]);
  });
  it('throws on an invalid holiday', () => {
    expect(() => addFeriado([A], { fecha: A.fecha, nombre: 'dup' })).toThrow();
  });
  it('removes by date and ignores unknown dates', () => {
    expect(removeFeriado([A], A.fecha)).toEqual([]);
    expect(removeFeriado([A], '2026-01-01')).toEqual([A]);
  });
});

describe('groupByYear and feriadoDateText', () => {
  it('groups by year in ascending order', () => {
    const g = groupByYear([
      { fecha: '2027-01-01', nombre: 'c' },
      { fecha: '2026-12-25', nombre: 'b' },
      { fecha: '2026-05-01', nombre: 'a' },
    ]);
    expect(g.map((x) => x.year)).toEqual([2026, 2027]);
    expect(g[0]?.items.map((i) => i.nombre)).toEqual(['a', 'b']);
  });
  it('formats the date in Spanish', () => {
    expect(feriadoDateText('2026-10-07')).toBe('7 oct 2026');
    expect(feriadoDateText('basura')).toBe('basura');
  });
});

describe('mergeFeriados', () => {
  it('adds only the dates that are missing and keeps the user names', () => {
    const mine = { fecha: '2026-05-01', nombre: 'Mi nombre' };
    const r = mergeFeriados([mine], [
      { fecha: '2026-01-01', nombre: 'Año' },
      { fecha: '2026-05-01', nombre: 'Otro' },
    ]);
    expect(r.added).toBe(1);
    expect(r.list).toEqual([{ fecha: '2026-01-01', nombre: 'Año' }, mine]);
  });
  it('adds nothing when everything is there', () => {
    expect(mergeFeriados([A], [A]).added).toBe(0);
  });
});
