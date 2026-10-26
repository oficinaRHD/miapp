// Pure logic for V15 (Respaldo y datos). No Svelte, Dexie or Capacitor here, and no fiscal rules.

/** Keys in the `ajustes` table. */
export const SETTING_LAST_BACKUP = 'ultimoRespaldo';
export const SETTING_BACKUP_INCLUDE_PERSONAL = 'respaldoIncluirPersonales';
export const SETTING_BACKUP_REMINDER = 'respaldoRecordatorio';

/** UI threshold, not a fiscal rule: monthly backup reminder (02, section 8). */
export const BACKUP_DUE_DAYS = 30;

/** Word the user must type to confirm wiping all data (second confirmation). */
export const WIPE_WORD = 'BORRAR';

export type BackupOutcome = 'shared' | 'downloaded' | 'cancelled';
export type BackupStatus = 'never' | 'ok' | 'due';

export interface BackupState {
  status: BackupStatus;
  /** Whole days since the last backup; null when there is none. */
  days: number | null;
}

const DAY_PART = /^(\d{4})-(\d{2})-(\d{2})/;
const DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

/** Days since 1970-01-01 for a 'YYYY-MM-DD...' text, or null if it is not a real date. */
function dayNumber(text: string): number | null {
  const m = DAY_PART.exec(text);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const t = Date.UTC(y, mo - 1, d);
  const check = new Date(t);
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== mo - 1 || check.getUTCDate() !== d) {
    return null;
  }
  return Math.round(t / 86_400_000);
}

/** Stored value to a valid ISO date-time, or undefined if missing or malformed. */
export function parseLastBackup(value: unknown): string | undefined {
  if (typeof value !== 'string' || !DATE_TIME.test(value)) return undefined;
  return dayNumber(value) === null ? undefined : value;
}

/** Status of the last backup relative to `today` ('YYYY-MM-DD'). A date in the future counts as 0 days. */
export function backupState(lastBackup: string | undefined, today: string): BackupState {
  if (!lastBackup) return { status: 'never', days: null };
  const last = dayNumber(lastBackup);
  const now = dayNumber(today);
  if (last === null || now === null) return { status: 'never', days: null };
  const days = Math.max(0, now - last);
  return { status: days >= BACKUP_DUE_DAYS ? 'due' : 'ok', days };
}

/** A cancelled share sheet must not update the "last backup" date. */
export function shouldRecordBackup(outcome: BackupOutcome): boolean {
  return outcome !== 'cancelled';
}

export function isWipeConfirmed(text: string): boolean {
  return text.trim().toUpperCase() === WIPE_WORD;
}

export function parseBool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}
