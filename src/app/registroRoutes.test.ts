import { describe, expect, it } from 'vitest';
import { editMovementPath, newMovementPath, registroRoute, tipoFromHash } from './registroRoutes';

describe('registroRoute', () => {
  it('reads list, new and edit paths', () => {
    expect(registroRoute('/registro')).toEqual({ kind: 'list' });
    expect(registroRoute('/registro/')).toEqual({ kind: 'list' });
    expect(registroRoute('/registro/nuevo')).toEqual({ kind: 'new' });
    expect(registroRoute('/registro/abc-123')).toEqual({ kind: 'edit', id: 'abc-123' });
  });
  it('ignores the query part', () => {
    expect(registroRoute('/registro/nuevo?tipo=gasto')).toEqual({ kind: 'new' });
  });
  it('returns null for other paths', () => {
    expect(registroRoute('/')).toBeNull();
    expect(registroRoute('/calendario')).toBeNull();
    expect(registroRoute('/registro/a/b')).toBeNull();
    expect(registroRoute('/registros')).toBeNull();
  });
  it('decodes ids and tolerates bad escapes', () => {
    expect(registroRoute('/registro/a%20b')).toEqual({ kind: 'edit', id: 'a b' });
    expect(registroRoute('/registro/%E0%A4%A')).toEqual({ kind: 'edit', id: '%E0%A4%A' });
  });
});

describe('tipoFromHash and path builders', () => {
  it('defaults to ingreso', () => {
    expect(tipoFromHash('#/registro/nuevo')).toBe('ingreso');
    expect(tipoFromHash('#/registro/nuevo?tipo=otro')).toBe('ingreso');
    expect(tipoFromHash('#/registro/nuevo?tipo=gasto')).toBe('gasto');
  });
  it('builds paths that round-trip', () => {
    expect(newMovementPath('gasto')).toBe('/registro/nuevo?tipo=gasto');
    expect(registroRoute(newMovementPath('gasto'))).toEqual({ kind: 'new' });
    expect(registroRoute(editMovementPath('a b/c'))).toEqual({ kind: 'edit', id: 'a b/c' });
  });
});
