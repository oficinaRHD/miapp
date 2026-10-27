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
import { syncDeadlineNotices, type SyncResult } from '../services/notifications';

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

export type RescheduleResult = SyncResult | { status: 'error'; message: string };

async function runReschedule(): Promise<RescheduleResult> {
  try {
    const [pendientes, settings] = await Promise.all([
      obligaciones.list({ estado: 'pendiente' }),
      loadAvisosSettings(),
    ]);
    // nowISO() is local time with offset: its first 16 characters are 'YYYY-MM-DDTHH:mm'.
    const plan = planNotices(pendientes, nowISO().slice(0, 16), settings);
    return await syncDeadlineNotices(plan);
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : String(e) };
  }
}

// Calls run one after another, so two triggers at once cannot interleave cancel and schedule.
let queue: Promise<unknown> = Promise.resolve();

/** Recalculates the notices from the stored obligations and schedules them. Never throws. */
export function rescheduleNotices(): Promise<RescheduleResult> {
  const run = queue.then(runReschedule);
  queue = run;
  return run;
}
