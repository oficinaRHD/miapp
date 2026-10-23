// Glue between the data layer (backup.ts) and the file service. Views and stores call this.
import { countBackup, exportBackup, importBackup, type BackupCounts, type ImportResult } from '../data/backup';
import { serializeBackup } from '../data/backupSchema';
import type { AppDB } from '../data/db';
import { backupFileName, backupStamp, nowISO } from '../data/util';
import { pickTextFile, saveInternalBackup, shareTextFile, type ShareOutcome } from './files';

export interface ExportBackupResult {
  fileName: string;
  outcome: ShareOutcome;
  counts: BackupCounts;
}

/** Builds the backup and hands it to the user (share sheet in the APK, download in the browser). */
export async function createAndShareBackup(
  db: AppDB,
  opts: { includePersonal: boolean },
): Promise<ExportBackupResult> {
  const file = await exportBackup(db, { includePersonal: opts.includePersonal });
  const fileName = backupFileName(file.exportadoEn);
  const outcome = await shareTextFile(fileName, serializeBackup(file), {
    title: fileName,
    dialogTitle: 'Respaldo Asistente TCP',
  });
  return { fileName, outcome, counts: countBackup(file) };
}

export interface RestoreResult extends ImportResult {
  preBackupName?: string;
}

/**
 * Restores from JSON text. Before replacing anything it saves an internal copy of the current
 * data (`auto-previo-<fecha>.json`); if that copy cannot be written the restore is aborted.
 */
export async function restoreBackupFromText(db: AppDB, text: string): Promise<RestoreResult> {
  let preBackupName: string | undefined;
  const result = await importBackup(db, text, {
    onPreBackup: async (previous) => {
      const name = `auto-previo-${backupStamp(nowISO())}.json`;
      await saveInternalBackup(name, serializeBackup(previous));
      preBackupName = name;
    },
  });
  return { ...result, preBackupName };
}

/** Opens the file picker and restores. Returns null if the user cancels the picker. */
export async function restoreBackupFromPicker(db: AppDB): Promise<RestoreResult | null> {
  const text = await pickTextFile();
  if (text === null) return null;
  return restoreBackupFromText(db, text);
}
