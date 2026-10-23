import { describe, expect, it } from 'vitest';
import {
  BackupError,
  parseBackupText,
  serializeBackup,
  stripPersonal,
  validateBackup,
  type BackupFile,
} from './backupSchema';
import type { Perfil } from './models';

const T = '2026-10-20T08:36:00-04:00';

function perfil(): Perfil {
  return {
    id: 'perfil',
    nombreVisible: 'Prueba',
    tieneEmpleados: false,
    tributosActivos: ['0114022'],
    onboardingCompleto: true,
    reglasVersion: '2026.1',
    rc05: '0000000000000000',
    nit: '123',
    creadoEn: T,
    actualizadoEn: T,
  };
}

function sample(): BackupFile {
  return {
    app: 'asistente-tcp',
    schemaVersion: 1,
    reglasVersion: '2026.1',
    exportadoEn: T,
    incluyeDatosPersonales: true,
    datos: {
      perfil: perfil(),
      ajustes: [{ clave: 'k', valor: { a: [1, 2] } }],
      categorias: [
        { id: 'c1', nombre: 'Ventas', tipo: 'ingreso', esSistema: true },
        { id: 'c2', nombre: 'Materiales', tipo: 'gasto', esSistema: true },
      ],
      movimientos: [
        {
          id: 'm1', fecha: '2026-10-02', tipo: 'ingreso', monto: 125050, categoriaId: 'c1',
          metodo: 'efectivo', cuentaParaVentas: true, justificado: true, creadoEn: T, actualizadoEn: T,
        },
      ],
      obligaciones: [
        {
          id: 'o1', tributoCodigo: '0114022', periodoTipo: 'mensual', periodoClave: '2026-09',
          periodoEtiqueta: 'Septiembre 2026', vence: '2026-10-20', venceOrigen: 'calculada',
          estado: 'pagada', pagadaEn: '2026-10-19', importePagado: 5000, creadoEn: T, actualizadoEn: T,
        },
      ],
      adjuntos: [],
      feriados: [{ fecha: '2027-01-01', nombre: 'Prueba' }],
      empleados: [{ id: 'e1', nombre: 'Ana', remuneracionMensual: 100000, alta: '2026-01-01' }],
      nominas: [
        { id: 'n1', empleadoId: 'e1', periodoClave: '2026-09', remuneracion: 100000, retencionIsip: 0, contribucionEspecial: 0 },
      ],
    },
  };
}

/** Error code thrown by `fn`, or 'none'. */
function codeOf(fn: () => unknown): string {
  try {
    fn();
    return 'none';
  } catch (e) {
    return e instanceof BackupError ? e.code : `other:${String(e)}`;
  }
}

describe('validateBackup', () => {
  it('accepts a complete valid file and keeps every record', () => {
    const file = validateBackup(sample());
    expect(file).toEqual(sample());
  });

  it('round-trips through JSON text', () => {
    const text = serializeBackup(sample());
    expect(parseBackupText(text)).toEqual(sample());
  });

  it('accepts a null profile', () => {
    const s = sample();
    s.datos.perfil = null;
    expect(validateBackup(s).datos.perfil).toBeNull();
  });

  it('rejects text that is not JSON', () => {
    expect(codeOf(() => parseBackupText('{nope'))).toBe('not-json');
  });

  it('rejects a root that is not an object', () => {
    expect(codeOf(() => validateBackup([1, 2]))).toBe('not-object');
    expect(codeOf(() => validateBackup(null))).toBe('not-object');
  });

  it('rejects another app', () => {
    expect(codeOf(() => validateBackup({ ...sample(), app: 'otra-app' }))).toBe('wrong-app');
  });

  it('rejects bad and future schema versions', () => {
    expect(codeOf(() => validateBackup({ ...sample(), schemaVersion: 0 }))).toBe('bad-schema-version');
    expect(codeOf(() => validateBackup({ ...sample(), schemaVersion: 1.5 }))).toBe('bad-schema-version');
    expect(codeOf(() => validateBackup({ ...sample(), schemaVersion: '1' }))).toBe('bad-schema-version');
    expect(codeOf(() => validateBackup({ ...sample(), schemaVersion: 2 }))).toBe('future-version');
  });

  it('rejects missing or wrong header fields', () => {
    expect(codeOf(() => validateBackup({ ...sample(), exportadoEn: 'ayer' }))).toBe('invalid-structure');
    expect(codeOf(() => validateBackup({ ...sample(), incluyeDatosPersonales: 'no' }))).toBe('invalid-structure');
    expect(codeOf(() => validateBackup({ ...sample(), datos: undefined }))).toBe('invalid-structure');
  });

  it('rejects a table that is not an array', () => {
    const s = sample();
    const bad = { ...s, datos: { ...s.datos, movimientos: {} } };
    expect(codeOf(() => validateBackup(bad))).toBe('invalid-structure');
  });

  it('rejects money that is not a non-negative integer', () => {
    for (const monto of [1250.5, -5, '100']) {
      const s = sample();
      const mov = { ...s.datos.movimientos[0], monto } as unknown;
      const bad = { ...s, datos: { ...s.datos, movimientos: [mov] } };
      expect(codeOf(() => validateBackup(bad))).toBe('invalid-record');
    }
  });

  it('rejects an impossible date', () => {
    const s = sample();
    const mov = { ...s.datos.movimientos[0], fecha: '2026-02-30' } as unknown;
    expect(codeOf(() => validateBackup({ ...s, datos: { ...s.datos, movimientos: [mov] } }))).toBe('invalid-record');
  });

  it('rejects a paid obligation without payment data', () => {
    const s = sample();
    const ob = { ...s.datos.obligaciones[0], importePagado: undefined } as unknown;
    expect(codeOf(() => validateBackup({ ...s, datos: { ...s.datos, obligaciones: [ob] } }))).toBe('invalid-record');
  });

  it('rejects duplicate ids', () => {
    const s = sample();
    const dup = { ...s, datos: { ...s.datos, categorias: [...s.datos.categorias, ...s.datos.categorias] } };
    expect(codeOf(() => validateBackup(dup))).toBe('integrity');
  });

  it('rejects two obligations with the same tributo and period', () => {
    const s = sample();
    const second = { ...s.datos.obligaciones[0], id: 'o2' } as unknown;
    const bad = { ...s, datos: { ...s.datos, obligaciones: [s.datos.obligaciones[0], second] } };
    expect(codeOf(() => validateBackup(bad))).toBe('integrity');
  });

  it('rejects a movement with an unknown category or a category of the other type', () => {
    const s = sample();
    const unknown = { ...s.datos.movimientos[0], categoriaId: 'zzz' } as unknown;
    expect(codeOf(() => validateBackup({ ...s, datos: { ...s.datos, movimientos: [unknown] } }))).toBe('integrity');
    const mismatch = { ...s.datos.movimientos[0], categoriaId: 'c2' } as unknown;
    expect(codeOf(() => validateBackup({ ...s, datos: { ...s.datos, movimientos: [mismatch] } }))).toBe('integrity');
  });

  it('rejects a payroll row of an unknown employee', () => {
    const s = sample();
    const n = { ...s.datos.nominas[0], empleadoId: 'nadie' } as unknown;
    expect(codeOf(() => validateBackup({ ...s, datos: { ...s.datos, nominas: [n] } }))).toBe('integrity');
  });

  it('drops unknown fields', () => {
    const s = sample();
    const cat = { ...s.datos.categorias[0], extra: 'x' } as unknown;
    const file = validateBackup({ ...s, datos: { ...s.datos, categorias: [cat, s.datos.categorias[1]] } });
    expect(Object.keys(file.datos.categorias[0] ?? {}).includes('extra')).toBe(false);
  });
});

describe('stripPersonal', () => {
  it('removes rc05 and nit without touching the original', () => {
    const original = perfil();
    const stripped = stripPersonal(original);
    expect(stripped?.rc05).toBeUndefined();
    expect(stripped?.nit).toBeUndefined();
    expect(stripped?.nombreVisible).toBe('Prueba');
    expect(original.rc05).toBe('0000000000000000');
  });

  it('keeps null as null', () => {
    expect(stripPersonal(null)).toBeNull();
  });
});
