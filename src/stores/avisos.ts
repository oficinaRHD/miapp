// Notice preferences and rescheduling for views. Plans in src/app/avisos.ts, scheduling in the service.
// It reads obligations through the repository (not through ./obligaciones) so that
// ./obligaciones can call rescheduleNotices without an import cycle.
import { db } from '../data';
import { ajustesRepo } from '../data/repositories/ajustes';
import { obligacionesRepo } from '../data/repositories/obligaciones';
import { nowISO } from '../data/util';
import {
  SETTING_AVISOS,
  parseAvisosSettings,
  planNotices,
  type AvisosSettings,
} from '../app/avisos';
import {
  SETTING_RECORDATORIOS,
  parseReminderSettings,
  planReminders,
  type ReminderSettings,
} from '../app/recordatorios';
import { syncDeadlineNotices, syncReminders, type SyncResult } from '../services/notifications';
import { loadBackupReminder } from './respaldo';

const ajustes = ajustesRepo(db);
const obligaciones = obligacionesRepo(db);

export async function loadAvisosSettings(): Promise<AvisosSettings> {
  return parseAvisosSettings(await ajustes.get<unknown>(SETTING_AVISOS, undefined));
}

export async function saveAvisosSettings(settings: AvisosSettings): Promise<void> {
  await ajustes.set(SETTING_AVISOS, {
    offsets: [...settings.offsets],
    hour: settings.hour,
    minute: settings.minute,
  });
}

export async function loadReminderSettings(): Promise<ReminderSettings> {
  return parseReminderSettings(await ajustes.get<unknown>(SETTING_RECORDATORIOS, undefined));
}

export async function saveReminderSettings(settings: ReminderSettings): Promise<void> {
  await ajustes.set(SETTING_RECORDATORIOS, {
    registro: settings.registro,
    calculadora: settings.calculadora,
  });
}

export type RescheduleResult = SyncResult | { status: 'error'; message: string };

async function runReschedule(): Promise<RescheduleResult> {
  try {
    const [pendientes, settings] = await Promise.all([
      obligaciones.list({ estado: 'pendiente' }),
      loadAvisosSettings(),
    ]);
    // nowISO() is local time with offset: its first 16 characters are 'YYYY-MM-DDTHH:mm'.
    const nowLocal = nowISO().slice(0, 16);
    const result = await syncDeadlineNotices(planNotices(pendientes, nowLocal, settings));
    // Monthly reminders: the backup one follows the V15 switch. The result reported is the deadline one.
    const [reminders, backup] = await Promise.all([loadReminderSettings(), loadBackupReminder()]);
    await syncReminders(planReminders(nowLocal, { ...reminders, respaldo: backup }));
    return result;
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : String(e) };
  }
}

// Calls run one after another, so two triggers at once cannot interleave cancel and schedule.
let queue: Promise<unknown> = Promise.resolve();

/**
 * Recalculates the deadline notices from the stored obligations and the monthly reminders,
 * and schedules them. Never throws. The result counts the deadline notices.
 */
export function rescheduleNotices(): Promise<RescheduleResult> {
  const run = queue.then(runReschedule);
  queue = run;
  return run;
}
