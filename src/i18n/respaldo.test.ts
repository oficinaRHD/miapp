import { describe, expect, it } from 'vitest';
import { daysAgoText, esRespaldo } from './respaldo';

describe('daysAgoText', () => {
  it('uses natural Spanish for 0, 1 and many days', () => {
    expect(daysAgoText(0)).toBe('hoy');
    expect(daysAgoText(1)).toBe('hace 1 día');
    expect(daysAgoText(12)).toBe('hace 12 días');
  });
});

describe('esRespaldo.exportDone', () => {
  it('does not claim a backup when the share sheet was cancelled', () => {
    expect(esRespaldo.exportDone('cancelled', 'x.json', 3, 4)).toContain('No se anotó');
    expect(esRespaldo.exportDone('shared', 'x.json', 3, 4)).toContain('compartido');
    expect(esRespaldo.exportDone('downloaded', 'x.json', 3, 4)).toContain('descargado');
  });
});
