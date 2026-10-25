import { describe, expect, it } from 'vitest';
import type { Obligacion } from '../data/models';
import { buildInicioSummary, daysUntil, urgencyOf } from './inicio';

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

describe('daysUntil', () => {
  it('counts days forward and backward', () => {
    expect(daysUntil('2026-10-20', '2026-10-20')).toBe(0);
    expect(daysUntil('2026-10-20', '2026-11-20')).toBe(31);
    expect(daysUntil('2026-10-20', '2026-10-19')).toBe(-1);
  });
  it('crosses year and leap-day boundaries', () => {
    expect(daysUntil('2026-12-31', '2027-01-01')).toBe(1);
    expect(daysUntil('2028-02-28', '2028-03-01')).toBe(2);
  });
});

describe('urgencyOf', () => {
  it('maps days left to urgency', () => {
    expect(urgencyOf(-1)).toBe('vencida');
    expect(urgencyOf(0)).toBe('urgente');
    expect(urgencyOf(3)).toBe('urgente');
    expect(urgencyOf(4)).toBe('pronto');
    expect(urgencyOf(7)).toBe('pronto');
    expect(urgencyOf(8)).toBe('tranquila');
  });
});

describe('buildInicioSummary', () => {
  const today = '2026-10-25';

  it('is empty without obligations', () => {
    expect(buildInicioSummary([], today)).toEqual({ overdue: [], next: null, upcoming: [] });
  });

  it('ignores paid and omitted obligations', () => {
    const list = [
      ob({ vence: '2026-10-26', estado: 'pagada' }),
      ob({ vence: '2026-10-27', estado: 'omitida' }),
    ];
    const s = buildInicioSummary(list, today);
    expect(s.next).toBeNull();
    expect(s.upcoming).toEqual([]);
    expect(s.overdue).toEqual([]);
  });

  it('separates overdue from upcoming and picks the next one', () => {
    const list = [
      ob({ vence: '2026-11-13', tributoCodigo: '0810132' }),
      ob({ vence: '2026-10-20', tributoCodigo: '0510122' }),
      ob({ vence: '2026-11-20', tributoCodigo: '0114022' }),
    ];
    const s = buildInicioSummary(list, today);
    expect(s.overdue.map((i) => i.obligacion.vence)).toEqual(['2026-10-20']);
    expect(s.overdue[0]?.dias).toBe(-5);
    expect(s.next?.obligacion.vence).toBe('2026-11-13');
    expect(s.next?.dias).toBe(19);
    expect(s.upcoming.map((i) => i.obligacion.vence)).toEqual(['2026-11-13', '2026-11-20']);
  });

  it('counts an obligation due today as upcoming, not overdue', () => {
    const s = buildInicioSummary([ob({ vence: today })], today);
    expect(s.overdue).toEqual([]);
    expect(s.next?.dias).toBe(0);
    expect(s.next?.urgencia).toBe('urgente');
  });

  it('keeps day 30 inside the window and day 31 outside, but next still finds it', () => {
    const s30 = buildInicioSummary([ob({ vence: '2026-11-24' })], today);
    expect(s30.upcoming).toHaveLength(1);
    const s31 = buildInicioSummary([ob({ vence: '2026-11-25' })], today);
    expect(s31.upcoming).toEqual([]);
    expect(s31.next?.dias).toBe(31);
  });

  it('orders ties by tributo code', () => {
    const list = [
      ob({ vence: '2026-11-20', tributoCodigo: '0510122' }),
      ob({ vence: '2026-11-20', tributoCodigo: '0114022' }),
    ];
    const s = buildInicioSummary(list, today);
    expect(s.upcoming.map((i) => i.obligacion.tributoCodigo)).toEqual(['0114022', '0510122']);
  });
});
