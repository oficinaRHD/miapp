import { describe, expect, it } from 'vitest';
import type { Categoria, Movimiento } from '../data/models';
import {
  amountFromText,
  amountToText,
  canSave,
  categoryName,
  draftFromMovimiento,
  filterByTipo,
  groupByDay,
  hasChanges,
  isMonthKey,
  monthKeyOf,
  monthTotals,
  newDraft,
  setTipo,
  sortForList,
  toMovimientoInput,
  validateDraft,
} from './registro';

const CATS: Categoria[] = [
  { id: 'cat-ing-ventas', nombre: 'Ventas', tipo: 'ingreso', esSistema: true },
  { id: 'cat-gas-transporte', nombre: 'Transporte', tipo: 'gasto', esSistema: true },
];

function mov(p: Partial<Movimiento> & Pick<Movimiento, 'id' | 'fecha' | 'tipo' | 'monto'>): Movimiento {
  return {
    categoriaId: p.tipo === 'ingreso' ? 'cat-ing-ventas' : 'cat-gas-transporte',
    metodo: 'efectivo',
    cuentaParaVentas: p.tipo === 'ingreso',
    justificado: false,
    creadoEn: '2026-10-01T10:00:00-04:00',
    actualizadoEn: '2026-10-01T10:00:00-04:00',
    ...p,
  };
}

describe('amountFromText', () => {
  it('parses plain and decimal amounts', () => {
    expect(amountFromText('1250')).toBe(125000);
    expect(amountFromText('1250.5')).toBe(125050);
    expect(amountFromText('1250.50')).toBe(125050);
    expect(amountFromText('0.05')).toBe(5);
    expect(amountFromText('.5')).toBe(50);
  });
  it('accepts comma decimals and grouped thousands', () => {
    expect(amountFromText('12,5')).toBe(1250);
    expect(amountFromText('1,250.50')).toBe(125050);
    expect(amountFromText('1.250,50')).toBe(125050);
    expect(amountFromText('1 250')).toBe(125000);
  });
  it('reads one separator plus 3 digits as thousands', () => {
    expect(amountFromText('1,250')).toBe(125000);
    expect(amountFromText('1.234')).toBe(123400);
    expect(amountFromText('1.234.567')).toBe(123456700);
  });
  it('rejects empty, malformed or too many decimals', () => {
    for (const bad of ['', '  ', 'abc', '-5', '1.234,567', '12,345.6789', '1..2', '.', ',']) {
      expect(amountFromText(bad)).toBeNull();
    }
  });
  it('rejects values beyond the safe integer range', () => {
    expect(amountFromText('99999999999999999999')).toBeNull();
  });
});

describe('amountToText', () => {
  it('round-trips', () => {
    expect(amountToText(125050)).toBe('1250.50');
    expect(amountToText(125000)).toBe('1250');
    expect(amountToText(5)).toBe('0.05');
    expect(amountFromText(amountToText(123407))).toBe(123407);
  });
});

describe('draft', () => {
  it('starts with defaults per type', () => {
    const i = newDraft('ingreso', '2026-10-26');
    expect(i.cuentaParaVentas).toBe(true);
    expect(i.fecha).toBe('2026-10-26');
    expect(newDraft('gasto', '2026-10-26').cuentaParaVentas).toBe(false);
  });

  it('validates amount, date and category', () => {
    const d = newDraft('ingreso', '2026-10-26');
    expect(validateDraft(d, CATS)).toEqual(['amount', 'category']);
    const ok = { ...d, montoText: '100', categoriaId: 'cat-ing-ventas' };
    expect(validateDraft(ok, CATS)).toEqual([]);
    expect(canSave(ok, CATS)).toBe(true);
    expect(validateDraft({ ...ok, montoText: '0' }, CATS)).toEqual(['amount']);
    expect(validateDraft({ ...ok, fecha: '2026-02-30' }, CATS)).toEqual(['date']);
    expect(validateDraft({ ...ok, categoriaId: 'nope' }, CATS)).toEqual(['category']);
    expect(validateDraft({ ...ok, categoriaId: 'cat-gas-transporte' }, CATS)).toEqual(['category-type']);
  });

  it('clears the category when the type changes', () => {
    const d = { ...newDraft('ingreso', '2026-10-26'), categoriaId: 'cat-ing-ventas' };
    const g = setTipo(d, 'gasto', CATS);
    expect(g.tipo).toBe('gasto');
    expect(g.categoriaId).toBe('');
    expect(g.cuentaParaVentas).toBe(false);
    expect(setTipo(d, 'ingreso', CATS)).toBe(d);
  });

  it('builds the repository input and omits empty optionals', () => {
    const d = { ...newDraft('ingreso', '2026-10-26'), montoText: '1,250.50', categoriaId: 'cat-ing-ventas' };
    const input = toMovimientoInput(d);
    expect(input).toEqual({
      fecha: '2026-10-26',
      tipo: 'ingreso',
      monto: 125050,
      categoriaId: 'cat-ing-ventas',
      metodo: 'efectivo',
      cuentaParaVentas: true,
      justificado: false,
    });
    expect('descripcion' in input).toBe(false);
    const withText = toMovimientoInput({ ...d, descripcion: ' Venta ', contraparte: ' Ana ' });
    expect(withText.descripcion).toBe('Venta');
    expect(withText.contraparte).toBe('Ana');
  });

  it('forces type-specific flags', () => {
    const g = {
      ...newDraft('gasto', '2026-10-26'),
      montoText: '50',
      categoriaId: 'cat-gas-transporte',
      cuentaParaVentas: true,
      justificado: true,
    };
    const input = toMovimientoInput(g);
    expect(input.cuentaParaVentas).toBe(false);
    expect(input.justificado).toBe(true);
    const i = { ...newDraft('ingreso', '2026-10-26'), montoText: '50', categoriaId: 'cat-ing-ventas', justificado: true };
    expect(toMovimientoInput(i).justificado).toBe(false);
  });

  it('throws on an invalid amount', () => {
    expect(() => toMovimientoInput(newDraft('ingreso', '2026-10-26'))).toThrow();
  });

  it('detects changes against the saved record', () => {
    const m = mov({ id: 'a', fecha: '2026-10-05', tipo: 'ingreso', monto: 125050, descripcion: 'x' });
    const d = draftFromMovimiento(m);
    expect(d.montoText).toBe('1250.50');
    expect(hasChanges(d, m)).toBe(false);
    expect(hasChanges({ ...d, montoText: '1250.51' }, m)).toBe(true);
    expect(hasChanges({ ...d, descripcion: 'y' }, m)).toBe(true);
  });
});

describe('monthTotals', () => {
  it('sums income, expenses, sales basis and justified expenses', () => {
    const t = monthTotals([
      mov({ id: '1', fecha: '2026-10-01', tipo: 'ingreso', monto: 100000 }),
      mov({ id: '2', fecha: '2026-10-02', tipo: 'ingreso', monto: 50000, cuentaParaVentas: false }),
      mov({ id: '3', fecha: '2026-10-03', tipo: 'gasto', monto: 30000, justificado: true }),
      mov({ id: '4', fecha: '2026-10-04', tipo: 'gasto', monto: 20000 }),
    ]);
    expect(t).toEqual({
      ingresos: 150000,
      gastos: 50000,
      neto: 100000,
      ventas: 100000,
      gastosJustificados: 30000,
      count: 4,
    });
  });
  it('handles empty and negative net', () => {
    expect(monthTotals([]).neto).toBe(0);
    expect(monthTotals([mov({ id: '1', fecha: '2026-10-01', tipo: 'gasto', monto: 500 })]).neto).toBe(-500);
  });
});

describe('list helpers', () => {
  const rows = [
    mov({ id: 'a', fecha: '2026-10-05', tipo: 'ingreso', monto: 100, creadoEn: '2026-10-05T09:00:00-04:00' }),
    mov({ id: 'b', fecha: '2026-10-05', tipo: 'gasto', monto: 40, creadoEn: '2026-10-05T11:00:00-04:00' }),
    mov({ id: 'c', fecha: '2026-10-09', tipo: 'ingreso', monto: 70 }),
  ];
  it('filters by type', () => {
    expect(filterByTipo(rows, 'todos')).toHaveLength(3);
    expect(filterByTipo(rows, 'gasto').map((m) => m.id)).toEqual(['b']);
  });
  it('sorts newest first and does not mutate', () => {
    expect(sortForList(rows).map((m) => m.id)).toEqual(['c', 'b', 'a']);
    expect(rows.map((m) => m.id)).toEqual(['a', 'b', 'c']);
  });
  it('groups by day with totals', () => {
    const g = groupByDay(rows);
    expect(g.map((x) => x.fecha)).toEqual(['2026-10-09', '2026-10-05']);
    expect(g[1]).toMatchObject({ ingresos: 100, gastos: 40 });
    expect(g[1]?.items.map((m) => m.id)).toEqual(['b', 'a']);
  });
  it('month key helpers', () => {
    expect(monthKeyOf('2026-10-26')).toBe('2026-10');
    expect(isMonthKey('2026-10')).toBe(true);
    expect(isMonthKey('2026-13')).toBe(false);
    expect(isMonthKey('2026-1')).toBe(false);
  });
  it('category name falls back to the id', () => {
    expect(categoryName('cat-ing-ventas', CATS)).toBe('Ventas');
    expect(categoryName('gone', CATS)).toBe('gone');
  });
});
