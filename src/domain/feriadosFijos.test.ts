import { describe, expect, it } from 'vitest';
import { FERIADOS_FIJOS, feriadosFijosDe } from './feriadosFijos';

describe('feriadosFijosDe', () => {
  it('returns the four dates given by the user, in order', () => {
    expect(feriadosFijosDe(2026).map((f) => f.fecha)).toEqual([
      '2026-01-01',
      '2026-05-01',
      '2026-07-26',
      '2026-10-10',
    ]);
  });
  it('keeps the names', () => {
    expect(feriadosFijosDe(2027)[2]?.nombre).toBe('Día de la Rebeldía Nacional');
    expect(FERIADOS_FIJOS.length).toBe(4);
  });
  it('rejects a silly year', () => {
    expect(() => feriadosFijosDe(26)).toThrow();
    expect(() => feriadosFijosDe(2026.5)).toThrow();
  });
});
