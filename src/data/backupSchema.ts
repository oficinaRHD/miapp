// Backup file format, validation and migration. Pure: no Dexie, no Capacitor.
// Format: 04-modelo-de-datos.md, section 7.
import { ValidationError } from './errors';
import type {
  Adjunto,
  Ajuste,
  Categoria,
  Empleado,
  Feriado,
  ISODateTime,
  Movimiento,
  Nomina,
  Obligacion,
  Perfil,
} from './models';
import {
  parseAdjunto,
  parseAjuste,
  parseCategoria,
  parseEmpleado,
  parseFeriado,
  parseMovimiento,
  parseNomina,
  parseObligacion,
  parsePerfil,
} from './schema';
import { isISODateTime, isPlainObject } from './util';
import { BACKUP_APP, SCHEMA_VERSION } from './version';

export type BackupErrorCode =
  | 'not-json'
  | 'not-object'
  | 'wrong-app'
  | 'bad-schema-version'
  | 'future-version'
  | 'missing-migration'
  | 'invalid-structure'
  | 'invalid-record'
  | 'integrity';

/** `detail` is technical (a path such as `movimientos[3].monto`); the UI maps `code` to a text. */
export class BackupError extends Error {
  readonly code: BackupErrorCode;
  readonly detail: string;

  constructor(code: BackupErrorCode, detail: string) {
    super(`${code}: ${detail}`);
    this.name = 'BackupError';
    this.code = code;
    this.detail = detail;
  }
}

export type BackupAdjunto = Omit<Adjunto, 'blob'>;

export interface BackupData {
  perfil: Perfil | null;
  ajustes: Ajuste[];
  categorias: Categoria[];
  movimientos: Movimiento[];
  obligaciones: Obligacion[];
  adjuntos: BackupAdjunto[];
  feriados: Feriado[];
  empleados: Empleado[];
  nominas: Nomina[];
}

export interface BackupFile {
  app: string;
  schemaVersion: number;
  reglasVersion: string;
  exportadoEn: ISODateTime;
  incluyeDatosPersonales: boolean;
  datos: BackupData;
}

/** Tables that travel in a backup (`recordatorios` are regenerated after a restore). */
export const BACKUP_TABLES = [
  'perfil',
  'ajustes',
  'categorias',
  'movimientos',
  'obligaciones',
  'adjuntos',
  'feriados',
  'empleados',
  'nominas',
] as const;

export type BackupTable = (typeof BACKUP_TABLES)[number];

/** Copy of the profile without the personal identifiers (RC-05 and NIT). */
export function stripPersonal(perfil: Perfil | null): Perfil | null {
  if (!perfil) return null;
  const copy: Perfil = { ...perfil };
  delete copy.rc05;
  delete copy.nit;
  return copy;
}

export function serializeBackup(file: BackupFile): string {
  return JSON.stringify(file, null, 2);
}

export function parseBackupText(text: string): BackupFile {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new BackupError('not-json', 'the file is not valid JSON');
  }
  return validateBackup(raw);
}

/** Migration N moves a file from schemaVersion N to N + 1. Empty while the schema is at version 1. */
type Migration = (file: Record<string, unknown>) => Record<string, unknown>;
const MIGRATIONS: Readonly<Record<number, Migration>> = {};

function migrate(raw: Record<string, unknown>, from: number): Record<string, unknown> {
  let current = raw;
  for (let v = from; v < SCHEMA_VERSION; v++) {
    const step = MIGRATIONS[v];
    if (!step) throw new BackupError('missing-migration', `no migration from version ${v}`);
    current = { ...step(current), schemaVersion: v + 1 };
  }
  return current;
}

export function validateBackup(raw: unknown): BackupFile {
  if (!isPlainObject(raw)) throw new BackupError('not-object', 'root');
  if (raw.app !== BACKUP_APP) throw new BackupError('wrong-app', 'app');

  const version = raw.schemaVersion;
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) {
    throw new BackupError('bad-schema-version', 'schemaVersion');
  }
  if (version > SCHEMA_VERSION) {
    throw new BackupError('future-version', `file ${version}, app ${SCHEMA_VERSION}`);
  }

  const file = migrate(raw, version);
  try {
    return parseCurrent(file);
  } catch (e) {
    if (e instanceof ValidationError) throw new BackupError('invalid-record', e.message);
    throw e;
  }
}

function list<T>(
  datos: Record<string, unknown>,
  key: BackupTable,
  parse: (v: unknown, path: string) => T,
): T[] {
  const arr = datos[key];
  if (!Array.isArray(arr)) throw new BackupError('invalid-structure', `datos.${key}`);
  return arr.map((item: unknown, i: number) => parse(item, `${key}[${i}]`));
}

function assertUnique<T>(rows: readonly T[], keyOf: (row: T) => string, table: string): void {
  const seen = new Set<string>();
  rows.forEach((row, i) => {
    const k = keyOf(row);
    if (seen.has(k)) throw new BackupError('integrity', `${table}[${i}]: duplicate ${k}`);
    seen.add(k);
  });
}

function parseCurrent(file: Record<string, unknown>): BackupFile {
  if (typeof file.reglasVersion !== 'string') {
    throw new BackupError('invalid-structure', 'reglasVersion');
  }
  if (!isISODateTime(file.exportadoEn)) throw new BackupError('invalid-structure', 'exportadoEn');
  if (typeof file.incluyeDatosPersonales !== 'boolean') {
    throw new BackupError('invalid-structure', 'incluyeDatosPersonales');
  }
  const d = file.datos;
  if (!isPlainObject(d)) throw new BackupError('invalid-structure', 'datos');

  let perfil: Perfil | null = null;
  if (d.perfil === undefined) throw new BackupError('invalid-structure', 'datos.perfil');
  if (d.perfil !== null) perfil = parsePerfil(d.perfil, 'perfil');

  const datos: BackupData = {
    perfil,
    ajustes: list(d, 'ajustes', parseAjuste),
    categorias: list(d, 'categorias', parseCategoria),
    movimientos: list(d, 'movimientos', parseMovimiento),
    obligaciones: list(d, 'obligaciones', parseObligacion),
    adjuntos: list(d, 'adjuntos', parseAdjunto),
    feriados: list(d, 'feriados', parseFeriado),
    empleados: list(d, 'empleados', parseEmpleado),
    nominas: list(d, 'nominas', parseNomina),
  };

  assertUnique(datos.ajustes, (r) => r.clave, 'ajustes');
  assertUnique(datos.categorias, (r) => r.id, 'categorias');
  assertUnique(datos.movimientos, (r) => r.id, 'movimientos');
  assertUnique(datos.obligaciones, (r) => r.id, 'obligaciones');
  assertUnique(datos.obligaciones, (r) => `${r.tributoCodigo}|${r.periodoClave}`, 'obligaciones');
  assertUnique(datos.adjuntos, (r) => r.id, 'adjuntos');
  assertUnique(datos.feriados, (r) => r.fecha, 'feriados');
  assertUnique(datos.empleados, (r) => r.id, 'empleados');
  assertUnique(datos.nominas, (r) => r.id, 'nominas');

  const categoriaTipo = new Map(datos.categorias.map((c) => [c.id, c.tipo]));
  datos.movimientos.forEach((m, i) => {
    const tipo = categoriaTipo.get(m.categoriaId);
    if (tipo === undefined) {
      throw new BackupError('integrity', `movimientos[${i}].categoriaId: unknown ${m.categoriaId}`);
    }
    if (tipo !== m.tipo) {
      throw new BackupError('integrity', `movimientos[${i}].categoriaId: type mismatch`);
    }
  });

  const empleadoIds = new Set(datos.empleados.map((e) => e.id));
  datos.nominas.forEach((n, i) => {
    if (!empleadoIds.has(n.empleadoId)) {
      throw new BackupError('integrity', `nominas[${i}].empleadoId: unknown ${n.empleadoId}`);
    }
  });

  return {
    app: BACKUP_APP,
    schemaVersion: SCHEMA_VERSION,
    reglasVersion: file.reglasVersion,
    exportadoEn: file.exportadoEn,
    incluyeDatosPersonales: file.incluyeDatosPersonales,
    datos,
  };
}
