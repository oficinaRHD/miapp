import { describe, expect, it } from 'vitest';
import type { Obligacion } from '../data/models';
import {
  buildMonthGrid,
  defaultSelected,
  filterByTributo,
  groupByMonth,
  obligationsOn,
  statusOf,
  tributoCodes,
  worstStatus,
} from './calendario';

function ob(over: Partial<Obligacion> & Pick<Obligacion, 'vence'>): Obligacion {
  return {
    id: over.id ?? `${over.tributoCodigo ?? '0114022'}-${over.vence}`,
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

describe('buildMonthGrid', () => {
  it('builds complete Monday-first weeks (October 2026: 5 weeks)', () => {
    const grid = buildMonthGrid(2026, 10, [], today);
    expect(grid).toHaveLength(5);
    for (const week of grid) expect(week).toHaveLength(7);
    // 1 Oct 2026 is a Thursday: three padding days from September.
    expect(grid[0]![0]!.date).toBe('2026-09-28');
    expect(grid[0]![0]!.inMonth).toBe(false);
    expect(grid[0]![3]!.date).toBe('2026-10-01');
    expect(grid[0]![3]!.inMonth).toBe(true);
    expect(grid[4]![6]!.date).toBe('2026-11-01');
    expect(grid[4]![6]!.inMonth).toBe(false);
  });

  it('needs no padding when the month fits exactly (February 2027: 4 weeks)', () => {
    const grid = buildMonthGrid(2027, 2, [], today);
    expect(grid).toHaveLength(4);
    expect(grid[0]![0]!.date).toBe('2027-02-01');
    expect(grid[3]![6]!.date).toBe('2027-02-28');
    expect(grid.flat().every((c) => c.inMonth)).toBe(true);
  });

  it('marks only today', () => {
    const cells = buildMonthGrid(2026, 10, [], today).flat();
    expect(cells.filter((c) => c.isToday).map((c) => c.date)).toEqual([today]);
  });

  it('counts obligations and picks the most severe status per day', () => {
    const list = [
      ob({ vence: '2026-10-20', tributoCodigo: '0114022' }),
      ob({ vence: '2026-10-20', tributoCodigo: '0510122', estado: 'pagada' }),
      ob({ vence: '2026-10-28', tributoCodigo: '0114022' }),
      ob({ vence: '2026-11-13', tributoCodigo: '0810132' }),
    ];
    const cells = buildMonthGrid(2026, 10, list, today).flat();
    const c20 = cells.find((c) => c.date === '2026-10-20')!;
    expect(c20.count).toBe(2);
    expect(c20.status).toBe('vencida');
    const c28 = cells.find((c) => c.date === '2026-10-28')!;
    expect(c28.status).toBe('urgente');
    // 13 Nov is not in the October grid.
    expect(cells.some((c) => c.date === '2026-11-13')).toBe(false);
  });

  it('ignores obligations that fall on padding days', () => {
    const list = [ob({ vence: '2026-09-30' })];
    const cell = buildMonthGrid(2026, 10, list, today).flat().find((c) => c.date === '2026-09-30')!;
    expect(cell.inMonth).toBe(false);
    expect(cell.count).toBe(0);
    expect(cell.status).toBeNull();
  });

  it('shows a paid-only day as pagada', () => {
    const list = [ob({ vence: '2026-10-20', estado: 'pagada' })];
    const cell = buildMonthGrid(2026, 10, list, today).flat().find((c) => c.date === '2026-10-20')!;
    expect(cell.status).toBe('pagada');
  });
});

describe('statusOf and worstStatus', () => {
  it('maps states and days left', () => {
    expect(statusOf(ob({ vence: '2026-10-20' }), today)).toBe('vencida');
    expect(statusOf(ob({ vence: '2026-10-25' }), today)).toBe('urgente');
    expect(statusOf(ob({ vence: '2026-10-30' }), today)).toBe('pronto');
    expect(statusOf(ob({ vence: '2026-11-20' }), today)).toBe('tranquila');
    expect(statusOf(ob({ vence: '2026-10-20', estado: 'pagada' }), today)).toBe('pagada');
    expect(statusOf(ob({ vence: '2026-10-20', estado: 'omitida' }), today)).toBe('omitida');
  });

  it('orders by severity', () => {
    expect(worstStatus([])).toBeNull();
    expect(worstStatus(['omitida', 'pagada'])).toBe('pagada');
    expect(worstStatus(['tranquila', 'pagada', 'pronto'])).toBe('pronto');
    expect(worstStatus(['pagada', 'vencida', 'urgente'])).toBe('vencida');
  });
});

describe('filters and lists', () => {
  const list = [
    ob({ vence: '2026-11-20', tributoCodigo: '0510122' }),
    ob({ vence: '2026-11-20', tributoCodigo: '0114022' }),
    ob({ vence: '2026-11-13', tributoCodigo: '0810132' }),
    ob({ vence: '2027-04-30', tributoCodigo: '0530222', periodoTipo: 'anual', periodoClave: '2026' }),
  ];

  it('filters by tributo and returns a copy when there is no filter', () => {
    expect(filterByTributo(list, null)).toHaveLength(4);
    expect(filterByTributo(list, null)).not.toBe(list);
    expect(filterByTributo(list, '0810132').map((o) => o.vence)).toEqual(['2026-11-13']);
    expect(filterByTributo(list, 'nope')).toEqual([]);
  });

  it('lists distinct tributo codes sorted', () => {
    expect(tributoCodes(list)).toEqual(['0114022', '0510122', '0530222', '0810132']);
  });

  it('lists the obligations of a day ordered by code', () => {
    expect(obligationsOn(list, '2026-11-20').map((o) => o.tributoCodigo)).toEqual(['0114022', '0510122']);
    expect(obligationsOn(list, '2026-11-21')).toEqual([]);
  });

  it('groups a year by due month and skips empty months and other years', () => {
    const g2026 = groupByMonth(list, 2026);
    expect(g2026.map((g) => g.month)).toEqual([11]);
    expect(g2026[0]!.items.map((o) => o.tributoCodigo)).toEqual(['0810132', '0114022', '0510122']);
    expect(groupByMonth(list, 2027).map((g) => g.month)).toEqual([4]);
    expect(groupByMonth(list, 2028)).toEqual([]);
  });
});

describe('defaultSelected', () => {
  it('uses today for the current month and the 1st otherwise', () => {
    expect(defaultSelected(2026, 10, today)).toBe('2026-10-25');
    expect(defaultSelected(2026, 11, today)).toBe('2026-11-01');
    expect(defaultSelected(2027, 10, today)).toBe('2027-10-01');
  });
});
