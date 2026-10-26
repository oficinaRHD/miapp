import { describe, expect, it } from 'vitest';
import { inicioRespaldo } from './inicioRespaldo';

describe('inicioRespaldo.text', () => {
  it('says there is no backup yet', () => {
    expect(inicioRespaldo.text({ status: 'never', days: null })).toBe('Aún no has hecho ningún respaldo.');
  });
  it('says how many days without a backup', () => {
    expect(inicioRespaldo.text({ status: 'due', days: 45 })).toBe('Hace 45 días sin respaldo.');
    expect(inicioRespaldo.text({ status: 'due', days: 1 })).toBe('Hace 1 día sin respaldo.');
  });
});
