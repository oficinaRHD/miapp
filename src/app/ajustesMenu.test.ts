import { describe, expect, it } from 'vitest';
import { AJUSTES_MENU, availableEntries, isAvailable } from './ajustesMenu';

describe('AJUSTES_MENU', () => {
  it('keeps the order of 03 (V14)', () => {
    expect(AJUSTES_MENU.map((e) => e.id)).toEqual([
      'perfil',
      'notificaciones',
      'respaldo',
      'feriados',
      'apariencia',
      'acerca',
    ]);
  });
  it('has unique ids and routes', () => {
    const rutas = AJUSTES_MENU.flatMap((e) => (e.ruta ? [e.ruta] : []));
    expect(new Set(rutas).size).toBe(rutas.length);
    expect(new Set(AJUSTES_MENU.map((e) => e.id)).size).toBe(AJUSTES_MENU.length);
  });
  it('opens only existing views', () => {
    expect(availableEntries().map((e) => e.ruta)).toEqual([
      '/ajustes/perfil',
      '/ajustes/notificaciones',
      '/ajustes/respaldo',
    ]);
    expect(isAvailable({ id: 'feriados', ruta: null })).toBe(false);
  });
});
