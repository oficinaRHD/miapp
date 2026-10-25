import { describe, expect, it } from 'vitest';
import { obligaciones as t } from './obligaciones';

describe('editDates texts', () => {
  it('counts changes', () => {
    expect(t.editDates.changes(0)).toBe('Sin cambios');
    expect(t.editDates.changes(1)).toBe('1 cambio');
    expect(t.editDates.changes(4)).toBe('4 cambios');
  });
  it('handles singular and plural in the result messages', () => {
    expect(t.editDates.saved(1)).toBe('Se cambió 1 fecha.');
    expect(t.editDates.saved(3)).toBe('Se cambiaron 3 fechas.');
    expect(t.editDates.failed(1)).toBe('No se pudo cambiar 1 fecha');
    expect(t.editDates.failed(2)).toBe('No se pudieron cambiar 2 fechas');
  });
});
