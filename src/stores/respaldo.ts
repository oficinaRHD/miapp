// Backup settings for V15. Data access goes through the settings repository only.
import { db } from '../data';
import { ajustesRepo } from '../data/repositories/ajustes';
import {
  SETTING_BACKUP_INCLUDE_PERSONAL,
  SETTING_BACKUP_REMINDER,
  SETTING_LAST_BACKUP,
  parseBool,
  parseLastBackup,
} from '../app/respaldo';

const repo = ajustesRepo(db);

/** ISO date-time of the last backup, or undefined if none was recorded. */
export async function loadLastBackup(): Promise<string | undefined> {
  return parseLastBackup(await repo.get<unknown>(SETTING_LAST_BACKUP, undefined));
}

export async function saveLastBackup(iso: string): Promise<void> {
  await repo.set(SETTING_LAST_BACKUP, iso);
}

/** Default: personal data (RC-05, NIT) is NOT included in backups (04, section 7). */
export async function loadIncludePersonal(): Promise<boolean> {
  return parseBool(await repo.get<unknown>(SETTING_BACKUP_INCLUDE_PERSONAL, false), false);
}

export async function saveIncludePersonal(value: boolean): Promise<void> {
  await repo.set(SETTING_BACKUP_INCLUDE_PERSONAL, value);
}

/** Default: monthly backup reminder on. The scheduling itself arrives with notifications. */
export async function loadBackupReminder(): Promise<boolean> {
  return parseBool(await repo.get<unknown>(SETTING_BACKUP_REMINDER, true), true);
}

export async function saveBackupReminder(value: boolean): Promise<void> {
  await repo.set(SETTING_BACKUP_REMINDER, value);
}
