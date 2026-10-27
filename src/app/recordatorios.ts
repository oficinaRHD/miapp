// Pure planning of the monthly reminders (02, section 5 and 8). No Capacitor, no Dexie, no fiscal rules.
// Deadline notices live in avisos.ts; these are the "habit" reminders.
import { WINDOW_DAYS } from './avisos';

/** Key in the `ajustes` table for the registro and calculadora reminders (V16). */
export const SETTING_RECORDATORIOS = 'recordatoriosMensuales';

export type ReminderKind = 'registro' | 'calculadora' | 'respaldo';

/** What the user can switch in V16. The backup reminder is switched in V15 (`respaldoRecordatorio`). */
export interface ReminderSettings {
  registro: boolean;
  calculadora: boolean;
}

export interface ReminderFlags extends ReminderSettings {
  respaldo: boolean;
}

export const DEFAULT_REMINDERS: ReminderSettings = { registro: true, calculadora: true };

/** Local time of each reminder. 02 fixes 18:00 for registro; the other two are this app's choice. */
export const REMINDER_TIME: Record<ReminderKind, string> = {
  registro: '18:00',
  calculadora: '09:00',
  respaldo: '10:00',
};

/** Day of the month for the backup reminder (02 only says "monthly"). */
export const BACKUP_REMINDER_DAY = 15;

export interface PlannedReminder {
  /** Negative integer: never collides with a deadline notice id (those are not negative). */
  id: number;
  kind: ReminderKind;
  /** Local date-time 'YYYY-MM-DDTHH:mm' (Cuba), no time zone. */
  at: string;
  title: string;
  body: string;
  /** Hash route opened when the user taps the reminder. */
  ruta: string;
}

const KIND_INDEX: Record<ReminderKind, number> = { registro: 1, calculadora: 2, respaldo: 3 };
const MONTH_RE = /^(\d{4})-(\d{2})$/;
const NOW_RE = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/;

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function validDate(date: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return false;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const c = new Date(Date.UTC(y, mo - 1, d));
  return c.getUTCFullYear() === y && c.getUTCMonth() === mo - 1 && c.getUTCDate() === d;
}

function shiftDays(date: string, days: number): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date) as RegExpExecArray;
  const t = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return new Date(t + days * 86_400_000).toISOString().slice(0, 10);
}

/** Deterministic id for a reminder of a month ('YYYY-MM'): -(year*1000 + month*10 + kind). */
export function reminderId(kind: ReminderKind, monthKey: string): number {
  const m = MONTH_RE.exec(monthKey);
  if (!m) throw new RangeError(`invalid month key: ${monthKey}`);
  return -(Number(m[1]) * 1000 + Number(m[2]) * 10 + KIND_INDEX[kind]);
}

/** Stored value to settings; anything missing or invalid is switched on. */
export function parseReminderSettings(value: unknown): ReminderSettings {
  if (typeof value !== 'object' || value === null) return DEFAULT_REMINDERS;
  const v = value as Record<string, unknown>;
  return {
    registro: typeof v.registro === 'boolean' ? v.registro : true,
    calculadora: typeof v.calculadora === 'boolean' ? v.calculadora : true,
  };
}

/** The settings with one reminder switched on or off. */
export function setReminder(
  settings: ReminderSettings,
  kind: keyof ReminderSettings,
  on: boolean,
): ReminderSettings {
  return { ...settings, [kind]: on };
}

const TEXTS: Record<ReminderKind, { title: string; body: string; ruta: string }> = {
  registro: {
    title: 'Registro del mes',
    body: 'Es el último día del mes: anota tus ingresos y gastos.',
    ruta: '/registro',
  },
  calculadora: {
    title: 'Calculadora del mes',
    body: 'Revisa el impuesto estimado del mes anterior. Es orientativo.',
    ruta: '/calculadora',
  },
  respaldo: {
    title: 'Respaldo',
    body: 'Haz un respaldo: tus datos viven solo en este teléfono.',
    ruta: '/ajustes/respaldo',
  },
};

/**
 * Reminders to schedule: registro on the last day of each month, calculadora on day 1 and
 * respaldo on day 15. Only inside the next WINDOW_DAYS days and not already past.
 * Sorted by time, then id.
 * @param nowLocal local date-time 'YYYY-MM-DDTHH:mm' (Cuba)
 */
export function planReminders(nowLocal: string, flags: ReminderFlags): PlannedReminder[] {
  const m = NOW_RE.exec(nowLocal);
  const today = m?.[1];
  if (!m || !today || !validDate(today)) throw new RangeError(`invalid nowLocal: ${nowLocal}`);
  const windowEnd = shiftDays(today, WINDOW_DAYS);
  const nowKey = `${today}T${m[2]}:${m[3]}`;
  const year = Number(today.slice(0, 4));
  const month0 = Number(today.slice(5, 7)) - 1;

  const out: PlannedReminder[] = [];
  for (let i = 0; i <= 3; i++) {
    const total = month0 + i;
    const y = year + Math.floor(total / 12);
    const mm = (total % 12) + 1;
    const monthKey = `${y}-${pad(mm)}`;
    const lastDay = new Date(Date.UTC(y, mm, 0)).getUTCDate();
    const items: [ReminderKind, number, boolean][] = [
      ['registro', lastDay, flags.registro],
      ['calculadora', 1, flags.calculadora],
      ['respaldo', BACKUP_REMINDER_DAY, flags.respaldo],
    ];
    for (const [kind, day, on] of items) {
      if (!on) continue;
      const date = `${monthKey}-${pad(day)}`;
      if (date < today || date > windowEnd) continue;
      const at = `${date}T${REMINDER_TIME[kind]}`;
      if (at <= nowKey) continue;
      out.push({ id: reminderId(kind, monthKey), kind, at, ...TEXTS[kind] });
    }
  }
  return out.sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : a.id - b.id));
}
