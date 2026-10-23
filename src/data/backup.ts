// Export and import of the local database (format in backupSchema.ts).
import {
  parseBackupText,
  stripPersonal,
  validateBackup,
  type BackupAdjunto,
  type BackupFile,
  type BackupTable,
} from './backupSchema';
import type { AppDB } from './db';
import { RULES_VERSION } from '../domain/tributos.catalog';
import { nowISO } from './util';
import { BACKUP_APP, SCHEMA_VERSION } from './version';

export interface ExportOptions {
  /** Include RC-05 and NIT. Default false (02-arquitectura, section 7). */
  includePersonal?: boolean;
  now?: Date;
}

export async function exportBackup(db: AppDB, opts: ExportOptions = {}): Promise<BackupFile> {
  const includePersonal = opts.includePersonal ?? false;

  const raw = await db.transaction('r', db.tables, async () => ({
    perfil: (await db.perfil.get('perfil')) ?? null,
    ajustes: await db.ajustes.toArray(),
    categorias: await db.categorias.toArray(),
    movimientos: await db.movimientos.toArray(),
    obligaciones: await db.obligaciones.toArray(),
    adjuntos: await db.adjuntos.toArray(),
    feriados: await db.feriados.toArray(),
    empleados: await db.empleados.toArray(),
    nominas: await db.nominas.toArray(),
  }));

  // v0.1: attachments travel as metadata only (the blob is dropped).
  const adjuntos: BackupAdjunto[] = raw.adjuntos.map((a) => {
    const meta: BackupAdjunto & { blob?: Blob } = { ...a };
    delete meta.blob;
    return meta;
  });

  return {
    app: BACKUP_APP,
    schemaVersion: SCHEMA_VERSION,
    reglasVersion: RULES_VERSION,
    exportadoEn: nowISO(opts.now),
    incluyeDatosPersonales: includePersonal,
    datos: {
      ...raw,
      perfil: includePersonal ? raw.perfil : stripPersonal(raw.perfil),
      adjuntos,
    },
  };
}

export type BackupCounts = Record<BackupTable, number>;

export function countBackup(file: BackupFile): BackupCounts {
  const d = file.datos;
  return {
    perfil: d.perfil ? 1 : 0,
    ajustes: d.ajustes.length,
    categorias: d.categorias.length,
    movimientos: d.movimientos.length,
    obligaciones: d.obligaciones.length,
    adjuntos: d.adjuntos.length,
    feriados: d.feriados.length,
    empleados: d.empleados.length,
    nominas: d.nominas.length,
  };
}

export interface ImportOptions {
  /**
   * Called with a full copy of the current data (personal data included) BEFORE anything
   * is replaced. If it throws, the import is aborted and nothing changes.
   */
  onPreBackup?: (previous: BackupFile) => Promise<void>;
}

export interface ImportResult {
  counts: BackupCounts;
  exportadoEn: string;
  preBackupMade: boolean;
}

/**
 * Validates `input` (JSON text or an already parsed object) and replaces ALL local data in a
 * single transaction. If validation fails, nothing is touched. `recordatorios` are cleared:
 * the caller must reschedule notifications afterwards (M6).
 */
export async function importBackup(
  db: AppDB,
  input: string | unknown,
  opts: ImportOptions = {},
): Promise<ImportResult> {
  const file = typeof input === 'string' ? parseBackupText(input) : validateBackup(input);

  let preBackupMade = false;
  if (opts.onPreBackup) {
    await opts.onPreBackup(await exportBackup(db, { includePersonal: true }));
    preBackupMade = true;
  }

  const d = file.datos;
  await db.transaction('rw', db.tables, async () => {
    for (const table of db.tables) await table.clear();
    if (d.perfil) await db.perfil.add(d.perfil);
    await db.ajustes.bulkAdd(d.ajustes);
    await db.categorias.bulkAdd(d.categorias);
    await db.movimientos.bulkAdd(d.movimientos);
    await db.obligaciones.bulkAdd(d.obligaciones);
    await db.adjuntos.bulkAdd(d.adjuntos);
    await db.feriados.bulkAdd(d.feriados);
    await db.empleados.bulkAdd(d.empleados);
    await db.nominas.bulkAdd(d.nominas);
  });

  return { counts: countBackup(file), exportadoEn: file.exportadoEn, preBackupMade };
}

/** Deletes every record of every table (including `recordatorios`). */
export async function wipeAllData(db: AppDB): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    for (const table of db.tables) await table.clear();
  });
}
