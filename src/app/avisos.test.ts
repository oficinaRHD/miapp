import { describe, expect, it } from 'vitest';
import type { Obligacion } from '../data/models';
import { findTributo } from '../domain/tributos.catalog';
import {
  DEFAULT_AVISOS,
  MAX_OFFSET_DAYS,
  WINDOW_DAYS,
  noticeId,
  parseAvisosSettings,
  planNotices,
  whenText,
} from './avisos';

function ob(id: string, vence: string, estado: Obligacion['estado'] = 'pendiente', code = '0114022'): Obligacion {
  return {
    id,
    tributoCodigo: code,
    periodoTipo: 'mensual',
    periodoClave: '2026-10',
    periodoEtiqueta: 'Octubre 2026',
    vence,
    venceOrigen: 'calculada',
    estado,
    creadoEn: '2026-10-01T08:00:00-04:00',
    actualizadoEn: '2026-10-01T08:00:00-04:00',
  };
}

const NOW = '2026-10-26T18:55';

describe('noticeId', () => {
  it('is deterministic and differs by offset', () => {
    expect(noticeId('abc', 3)).toBe(noticeId('abc', 3));
    expect(noticeId('abc', 3)).not.toBe(noticeId('abc', 1));
    expect(noticeId('abc', 0) % 32).toBe(0);
    expect(noticeId('abc', 7) % 32).toBe(7);
  });
  it('stays inside a 31-bit integer', () => {
    for (let i = 0; i < 500; i++) {
      for (const off of [0, 7, MAX_OFFSET_DAYS]) {
        const id = noticeId(`obl-${i}-${i * 7919}`, off);
        expect(id).toBeGreaterThanOrEqual(0);
        expect(id).toBeLessThanOrEqual(2 ** 31 - 1);
      }
    }
  });
  it('rejects offsets out of range', () => {
    expect(() => noticeId('abc', -1)).toThrow();
    expect(() => noticeId('abc', 31)).toThrow();
    expect(() => noticeId('abc', 1.5)).toThrow();
  });
});

describe('planNotices', () => {
  it('plans 7, 3, 1 and 0 days before at 09:00, in order', () => {
    const plan = planNotices([ob('a', '2026-11-20')], NOW);
    expect(plan.map((n) => n.at)).toEqual([
      '2026-11-13T09:00',
      '2026-11-17T09:00',
      '2026-11-19T09:00',
      '2026-11-20T09:00',
    ]);
    expect(plan.map((n) => n.offset)).toEqual([7, 3, 1, 0]);
    expect(plan[0]?.obligacionId).toBe('a');
  });

  it('skips notices whose time already passed', () => {
    const plan = planNotices([ob('a', '2026-10-28')], NOW);
    expect(plan.map((n) => n.offset)).toEqual([1, 0]);
  });

  it('keeps the same-day notice only if 09:00 has not passed', () => {
    expect(planNotices([ob('a', '2026-10-26')], '2026-10-26T18:55')).toHaveLength(0);
    expect(planNotices([ob('a', '2026-10-26')], '2026-10-26T08:00').map((n) => n.offset)).toEqual([0]);
  });

  it('only plans notices inside the 60-day window', () => {
    expect(WINDOW_DAYS).toBe(60);
    // window ends 2026-12-25; due 2026-12-30: the 7-day notice (12-23) fits, the rest do not
    expect(planNotices([ob('a', '2026-12-30')], NOW).map((n) => n.offset)).toEqual([7]);
    expect(planNotices([ob('a', '2027-01-20')], NOW)).toHaveLength(0);
  });

  it('ignores paid, omitted and overdue obligations', () => {
    const list = [
      ob('paid', '2026-11-20', 'pagada'),
      ob('omit', '2026-11-20', 'omitida'),
      ob('late', '2026-10-20'),
    ];
    expect(planNotices(list, NOW)).toHaveLength(0);
  });

  it('crosses month boundaries', () => {
    const plan = planNotices([ob('a', '2026-11-03')], NOW);
    expect(plan[0]?.at).toBe('2026-10-27T09:00');
  });

  it('uses custom hour, minute and offsets', () => {
    const plan = planNotices([ob('a', '2026-11-20')], NOW, { offsets: [2], hour: 8, minute: 30 });
    expect(plan.map((n) => n.at)).toEqual(['2026-11-18T08:30']);
  });

  it('writes the tributo name and a readable body', () => {
    const [first] = planNotices([ob('a', '2026-11-20')], NOW);
    expect(first?.title).toBe(findTributo('0114022')?.shortName ?? '0114022');
    expect(first?.body).toBe('Octubre 2026: vence en 7 días.');
    const unknown = planNotices([ob('a', '2026-11-20', 'pendiente', '9999999')], NOW)[0];
    expect(unknown?.title).toBe('9999999');
  });

  it('orders several obligations by time', () => {
    const plan = planNotices([ob('b', '2026-11-20'), ob('a', '2026-11-14')], NOW, { offsets: [0], hour: 9, minute: 0 });
    expect(plan.map((n) => n.obligacionId)).toEqual(['a', 'b']);
  });

  it('rejects an invalid now', () => {
    expect(() => planNotices([], '2026-10-26')).toThrow();
    expect(() => planNotices([], '2026-02-30T10:00')).toThrow();
  });
});

describe('whenText', () => {
  it('uses natural Spanish', () => {
    expect(whenText(0)).toBe('vence hoy');
    expect(whenText(1)).toBe('vence mañana');
    expect(whenText(3)).toBe('vence en 3 días');
  });
});

describe('parseAvisosSettings', () => {
  it('accepts valid settings, sorted and without duplicates', () => {
    expect(parseAvisosSettings({ offsets: [0, 3, 3, 7], hour: 8, minute: 15 })).toEqual({
      offsets: [7, 3, 0],
      hour: 8,
      minute: 15,
    });
  });
  it('falls back to the defaults for invalid values', () => {
    expect(parseAvisosSettings(undefined)).toEqual(DEFAULT_AVISOS);
    expect(parseAvisosSettings({ offsets: [], hour: 9, minute: 0 })).toEqual(DEFAULT_AVISOS);
    expect(parseAvisosSettings({ offsets: [31], hour: 9, minute: 0 })).toEqual(DEFAULT_AVISOS);
    expect(parseAvisosSettings({ offsets: [-1], hour: 9, minute: 0 })).toEqual(DEFAULT_AVISOS);
    expect(parseAvisosSettings({ offsets: [1], hour: 24, minute: 0 })).toEqual(DEFAULT_AVISOS);
    expect(parseAvisosSettings({ offsets: [1], hour: 9, minute: 60 })).toEqual(DEFAULT_AVISOS);
    expect(parseAvisosSettings({ offsets: '7', hour: 9, minute: 0 })).toEqual(DEFAULT_AVISOS);
  });
});
