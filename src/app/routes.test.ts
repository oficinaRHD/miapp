import { describe, expect, it } from 'vitest';
import { buildPath, normalizePath, parseRoute } from './routes';

describe('parseRoute', () => {
  it('empty hash is inicio', () => {
    expect(parseRoute('').name).toBe('inicio');
  });

  it('#/ is inicio', () => {
    expect(parseRoute('#/')).toEqual({ name: 'inicio', params: {}, path: '/' });
  });

  it('matches a static route', () => {
    expect(parseRoute('#/calendario').name).toBe('calendario');
  });

  it('extracts the :id param', () => {
    const r = parseRoute('#/obligaciones/abc');
    expect(r.name).toBe('obligacion');
    expect(r.params).toEqual({ id: 'abc' });
  });

  it('registro/nuevo wins over registro/:id', () => {
    expect(parseRoute('#/registro/nuevo').name).toBe('movimiento-nuevo');
  });

  it('registro/:id edits a movement', () => {
    const r = parseRoute('#/registro/xyz');
    expect(r.name).toBe('movimiento');
    expect(r.params.id).toBe('xyz');
  });

  it('ignores a trailing slash', () => {
    expect(parseRoute('#/guia/').name).toBe('guia');
  });

  it('ignores the query string', () => {
    const r = parseRoute('#/registro?mes=2026-09');
    expect(r.name).toBe('registro');
    expect(r.path).toBe('/registro');
  });

  it('unknown path is no-encontrada', () => {
    expect(parseRoute('#/nada').name).toBe('no-encontrada');
  });

  it('decodes URI components in params', () => {
    expect(parseRoute('#/obligaciones/a%20b').params.id).toBe('a b');
  });

  it('does not throw on malformed encoding', () => {
    expect(parseRoute('#/obligaciones/%E0%A4%A').params.id).toBe('%E0%A4%A');
  });

  it('matches nested ajustes routes', () => {
    expect(parseRoute('#/ajustes/respaldo').name).toBe('respaldo');
    expect(parseRoute('#/ajustes/perfil').name).toBe('perfil');
  });

  it('extra segments do not match a static route', () => {
    expect(parseRoute('#/calendario/x').name).toBe('no-encontrada');
  });
});

describe('normalizePath / buildPath', () => {
  it('normalizes hashes', () => {
    expect(normalizePath('')).toBe('/');
    expect(normalizePath('#guia')).toBe('/guia');
  });

  it('builds paths and encodes params', () => {
    expect(buildPath('obligacion', { id: 'x y' })).toBe('/obligaciones/x%20y');
    expect(buildPath('inicio')).toBe('/');
  });

  it('throws when a param is missing', () => {
    expect(() => buildPath('obligacion')).toThrow();
  });
});
