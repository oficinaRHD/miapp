import { describe, expect, it } from 'vitest';
import { esFeriados } from './feriados';

describe('esFeriados', () => {
  it('warns that without holidays only Monday to Friday is counted', () => {
    expect(esFeriados.emptyWarning).toContain('lunes a viernes');
  });
  it('uses the singular for one holiday', () => {
    expect(esFeriados.count(1)).toBe('1 feriado.');
    expect(esFeriados.count(4)).toBe('4 feriados.');
  });
  it('has an error text for each validation error', () => {
    expect(esFeriados.errors.fecha.length > 0).toBe(true);
    expect(esFeriados.errors.nombre.length > 0).toBe(true);
    expect(esFeriados.errors.duplicada.length > 0).toBe(true);
  });
  it('reports how many fixed holidays were added', () => {
    expect(esFeriados.fixedDone(0)).toContain('Ya estaban');
    expect(esFeriados.fixedDone(1)).toBe('Se añadió 1 feriado.');
    expect(esFeriados.fixedDone(4)).toBe('Se añadieron 4 feriados.');
  });
});
