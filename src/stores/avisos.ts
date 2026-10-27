// Notice preferences and rescheduling for views. Plans in src/app/avisos.ts, scheduling in the service.
import { db } from '../data';
import { ajustesRepo } from '../data/repositories/ajustes';
import { nowISO } from '../data/util';
import {
  SETTING_AVISOS,
  parseAvisosSettings,
  planNotices,
  type AvisosSettings,
} from '../app/avisos';
import { syncDeadlineNotices, type SyncResult } from '../services/notifications';
import { listObligations } from './obligaciones';

const repo = ajustesRepo(db);

export async function loadAvisosSettings(): Promise<AvisosSettings> {
  return parseAvisosSettings(await repo.get<unknown>(SETTING_AVISOS, undefined));
}

export async function saveAvisosSettings(settings: AvisosSettings): Promise<void> {
  await repo.set(SETTING_AVISOS, {
    offsets: [...settings.offsets],
    hour: settings.hour,
    minute: settings.minute,
  });
}

export type RescheduleResult = SyncResult | { status: 'error'; message: string };

async function runReschedule(): Promise<RescheduleResult> {
  try {
    const [obligaciones, settings] = await Promise.all([
      listObligations({ estado: 'pendiente' }),
      loadAvisosSettings(),
    ]);
    // nowISO() is local time with offset: its first 16 characters are 'YYYY-MM-DDTHH:mm'.
    const plan = planNotices(obligaciones, nowISO().slice(0, 16), settings);
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
