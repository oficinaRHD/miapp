import { describe, expect, it } from 'vitest';
import { NAV_ITEMS, activeNav, showMenu } from './nav';

describe('activeNav', () => {
  it('matches exact roots and their children', () => {
    expect(activeNav('/')).toBe('inicio');
    expect(activeNav('/calendario')).toBe('calendario');
    expect(activeNav('/obligaciones')).toBe('obligaciones');
    expect(activeNav('/obligaciones/abc')).toBe('obligaciones');
    expect(activeNav('/registro/nuevo')).toBe('registro');
    expect(activeNav('/calculadora')).toBe('calculadora');
  });
  it('puts every settings path under Ajustes', () => {
    expect(activeNav('/ajustes')).toBe('ajustes');
    expect(activeNav('/ajustes/respaldo')).toBe('ajustes');
    expect(activeNav('/ajustes/notificaciones')).toBe('ajustes');
  });
  it('does not confuse prefixes or unknown paths', () => {
    expect(activeNav('/registros')).toBe(null);
    expect(activeNav('/onboarding')).toBe(null);
    expect(activeNav('/no-existe')).toBe(null);
  });
});

describe('NAV_ITEMS and showMenu', () => {
  it('has unique ids and routes', () => {
    expect(new Set(NAV_ITEMS.map((i) => i.id)).size).toBe(NAV_ITEMS.length);
    expect(new Set(NAV_ITEMS.map((i) => i.ruta)).size).toBe(NAV_ITEMS.length);
  });
  it('shows the menu only after the onboarding', () => {
    expect(showMenu(true)).toBe(true);
    expect(showMenu(false)).toBe(false);
  });
});
