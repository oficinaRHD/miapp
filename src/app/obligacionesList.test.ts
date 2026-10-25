import { describe, expect, it } from 'vitest';
import type { Obligacion } from '../data/models';
import {
  amountOf,
  filterCounts,
  filterObligations,
  groupByDueMonth,
  matchesFilter,
} from './obligacionesList';

function ob(over: Partial<Obligacion> & Pick<Obligacion, 'vence'>): Obligacion {
  return {
    id: over.id ?? `${over.tributoCodigo ?? '0114022'}-${over.vence}-${over.estado ?? 'pendiente'}`,
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

const today = '2026-10-25';
const list = [
  ob({ vence: '2026-10-20' }), // overdue
  ob({ vence: '2026-10-25', tributoCodigo: '0510122' }), // due today
  ob({ vence: '2026-11-20' }), // future
  ob({ vence: '2026-09-20', estado: 'pagada' }),
  ob({ vence: '2026-10-20', estado: 'omitida', tributoCodigo: '0810132' }),
];

describe('matchesFilter', () => {
  it('pendientes includes overdue and due-today ones', () => {
    expect(filterObligations(list, 'pendientes', today).map((o) => o.vence)).toEqual([
      '2026-10-20',
      '2026-10-25',
      '2026-11-20',
    ]);
  });

  it('vencidas is only pending with a date before today', () => {
    expect(filterObligations(list, 'vencidas', today).map((o) => o.vence)).toEqual(['2026-10-20']);
    expect(matchesFilter(ob({ vence: today }), 'vencidas', today)).toBe(false);
  });

  it('a paid or omitted obligation is never overdue', () => {
    const paid = ob({ vence: '2026-01-10', estado: 'pagada' });
    const skipped = ob({ vence: '2026-01-10', estado: 'omitida' });
    expect(matchesFilter(paid, 'vencidas', today)).toBe(false);
    expect(matchesFilter(skipped, 'vencidas', today)).toBe(false);
    expect(matchesFilter(paid, 'pagadas', today)).toBe(true);
    expect(matchesFilter(skipped, 'omitidas', today)).toBe(true);
  });
});

describe('filterCounts', () => {
  it('counts each filter', () => {
    expect(filterCounts(list, today)).toEqual({ pendientes: 3, vencidas: 1, pagadas: 1, omitidas: 1 });
  });
  it('is all zero without obligations', () => {
    expect(filterCounts([], today)).toEqual({ pendientes: 0, vencidas: 0, pagadas: 0, omitidas: 0 });
  });
});

describe('groupByDueMonth', () => {
  it('groups by due month, oldest first, items ordered by date then code', () => {
    const groups = groupByDueMonth(list);
    expect(groups.map((g) => g.key)).toEqual(['2026-09', '2026-10', '2026-11']);
    expect(groups[1]!.month).toBe(10);
    expect(groups[1]!.year).toBe(2026);
    expect(groups[1]!.items.map((o) => o.tributoCodigo)).toEqual(['0114022', '0810132', '0510122']);
  });

  it('puts January of the next year after December', () => {
    const groups = groupByDueMonth([ob({ vence: '2027-01-20' }), ob({ vence: '2026-12-21' })]);
    expect(groups.map((g) => g.key)).toEqual(['2026-12', '2027-01']);
  });

  it('returns nothing for an empty list and does not mutate the input', () => {
    expect(groupByDueMonth([])).toEqual([]);
    const input = [ob({ vence: '2026-11-20' }), ob({ vence: '2026-10-20' })];
    groupByDueMonth(input);
    expect(input.map((o) => o.vence)).toEqual(['2026-11-20', '2026-10-20']);
  });
});

describe('amountOf', () => {
  it('uses the paid amount only for paid obligations', () => {
    const paid = ob({ vence: '2026-10-20', estado: 'pagada', importePagado: 5000, importeOficial: 4000 });
    expect(amountOf(paid)).toEqual({ kind: 'pagado', centavos: 5000 });
  });
  it('prefers the official amount over the estimated one', () => {
    expect(amountOf(ob({ vence: today, importeOficial: 4000, importeEstimado: 3000 }))).toEqual({
      kind: 'oficial',
      centavos: 4000,
    });
  });
  it('falls back to estimated and then to none', () => {
    expect(amountOf(ob({ vence: today, importeEstimado: 3000 }))).toEqual({ kind: 'estimado', centavos: 3000 });
    expect(amountOf(ob({ vence: today }))).toEqual({ kind: 'ninguno' });
  });
  it('shows the official amount of a paid obligation that has no paid amount', () => {
    const paid = ob({ vence: today, estado: 'pagada', importeOficial: 4000 });
    expect(amountOf(paid)).toEqual({ kind: 'oficial', centavos: 4000 });
  });
});
