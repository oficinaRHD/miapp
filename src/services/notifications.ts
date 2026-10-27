// Notification service: the only place that talks to @capacitor/local-notifications.
// It does not decide WHICH notices exist (src/app/avisos.ts) nor read data (src/stores/avisos.ts).
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { mapPermission, type NotificationPermissionState } from '../app/notificationPermission';
import type { PlannedNotice } from '../app/avisos';
import type { PlannedReminder } from '../app/recordatorios';

export const CHANNEL_DEADLINES = 'vencimientos';
export const CHANNEL_REMINDERS = 'recordatorios';
export const KIND_DEADLINE = 'vencimiento';
export const KIND_REMINDER = 'recordatorio';
const KIND_TEST = 'prueba';
/** Reserved id for the test notice: `noticeId` never produces 2^31 - 1 (offsets stop at 30). */
const TEST_ID = 2_147_483_647;
const TEST_DELAY_MS = 10_000;

/** Notifications only work inside the installed app, not in the browser. */
export function isNotificationsSupported(): boolean {
  return Capacitor.isNativePlatform();
}

/** Current permission without asking. 'unknown' if the platform cannot tell. */
export async function checkNotificationPermission(): Promise<NotificationPermissionState> {
  try {
    const result = await LocalNotifications.checkPermissions();
    return mapPermission(result.display);
  } catch {
    return 'unknown';
  }
}

/** Asks the user for permission (system dialog). 'unknown' if it cannot be asked. */
export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  try {
    const result = await LocalNotifications.requestPermissions();
    return mapPermission(result.display);
  } catch {
    return 'unknown';
  }
}

/** Creates the Android channels (idempotent). Importance 4 = high, 3 = default. */
async function ensureChannels(): Promise<void> {
  try {
    await LocalNotifications.createChannel({
      id: CHANNEL_DEADLINES,
      name: 'Vencimientos',
      description: 'Avisos de pagos que vencen',
      importance: 4,
      vibration: true,
    });
    await LocalNotifications.createChannel({
      id: CHANNEL_REMINDERS,
      name: 'Recordatorios',
      description: 'Registrar movimientos, cierre de mes y respaldo',
      importance: 3,
    });
  } catch {
    // Not Android, or the channel already exists: nothing to do.
  }
}

/** 'YYYY-MM-DDTHH:mm' (local) to a Date in the phone's time zone. */
function parseLocalDateTime(at: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(at);
  if (!m) throw new RangeError(`invalid local date-time: ${at}`);
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]));
}

interface Extra {
  kind?: unknown;
  obligacionId?: unknown;
  ruta?: unknown;
}

function extraOf(value: unknown): Extra | null {
  return typeof value === 'object' && value !== null ? (value as Extra) : null;
}

/** Ids of this app's pending deadline notices (a pending item with no extra is also ours). */
async function pendingDeadlineIds(): Promise<number[]> {
  const { notifications } = await LocalNotifications.getPending();
  return notifications
    .filter((n) => {
      const extra = extraOf(n.extra);
      return extra === null || extra.kind === KIND_DEADLINE;
    })
    .map((n) => n.id);
}

/** How many deadline notices are waiting to fire (0 in the browser). */
export async function countPendingNotices(): Promise<number> {
  if (!isNotificationsSupported()) return 0;
  try {
    return (await pendingDeadlineIds()).length;
  } catch {
    return 0;
  }
}

/** Ids of this app's pending monthly reminders. */
async function pendingReminderIds(): Promise<number[]> {
  const { notifications } = await LocalNotifications.getPending();
  return notifications.filter((n) => extraOf(n.extra)?.kind === KIND_REMINDER).map((n) => n.id);
}

/** How many monthly reminders are waiting to fire (0 in the browser). */
export async function countPendingReminders(): Promise<number> {
  if (!isNotificationsSupported()) return 0;
  try {
    return (await pendingReminderIds()).length;
  } catch {
    return 0;
  }
}

export type SyncResult =
  | { status: 'ok'; scheduled: number; cancelled: number }
  | { status: 'skipped'; reason: 'not-native' | 'no-permission' };

/**
 * Makes the phone's pending deadline notices equal to `plan`: cancels this app's pending ones
 * and schedules the plan. Safe to call as often as needed.
 */
export async function syncDeadlineNotices(plan: readonly PlannedNotice[]): Promise<SyncResult> {
  if (!isNotificationsSupported()) return { status: 'skipped', reason: 'not-native' };
  if ((await checkNotificationPermission()) !== 'granted') {
    return { status: 'skipped', reason: 'no-permission' };
  }
  await ensureChannels();

  const old = await pendingDeadlineIds();
  if (old.length > 0) {
    await LocalNotifications.cancel({ notifications: old.map((id) => ({ id })) });
  }

  const now = Date.now();
  const items = plan
    .map((n) => ({ n, at: parseLocalDateTime(n.at) }))
    .filter(({ at }) => at.getTime() > now)
    .map(({ n, at }) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      channelId: CHANNEL_DEADLINES,
      // Inexact on purpose (02, section 5): no exact-alarm permission. It may arrive a few minutes late.
      schedule: { at, allowWhileIdle: true },
      extra: { kind: KIND_DEADLINE, obligacionId: n.obligacionId, offset: n.offset },
      // Newer plugin versions (8.3+) would otherwise ask for the exact-alarm setting; older ones ignore it.
      isExactNotification: false,
    }));
  if (items.length > 0) await LocalNotifications.schedule({ notifications: items });

  return { status: 'ok', scheduled: items.length, cancelled: old.length };
}

/**
 * Makes the phone's pending monthly reminders equal to `plan` (channel `recordatorios`).
 * It never touches deadline notices: they are told apart by `extra.kind`.
 */
export async function syncReminders(plan: readonly PlannedReminder[]): Promise<SyncResult> {
  if (!isNotificationsSupported()) return { status: 'skipped', reason: 'not-native' };
  if ((await checkNotificationPermission()) !== 'granted') {
    return { status: 'skipped', reason: 'no-permission' };
  }
  await ensureChannels();

  const old = await pendingReminderIds();
  if (old.length > 0) {
    await LocalNotifications.cancel({ notifications: old.map((id) => ({ id })) });
  }

  const now = Date.now();
  const items = plan
    .map((r) => ({ r, at: parseLocalDateTime(r.at) }))
    .filter(({ at }) => at.getTime() > now)
    .map(({ r, at }) => ({
      id: r.id,
      title: r.title,
      body: r.body,
      channelId: CHANNEL_REMINDERS,
      schedule: { at, allowWhileIdle: true },
      extra: { kind: KIND_REMINDER, ruta: r.ruta },
      isExactNotification: false,
    }));
  if (items.length > 0) await LocalNotifications.schedule({ notifications: items });

  return { status: 'ok', scheduled: items.length, cancelled: old.length };
}

export type TestResult = 'sent' | 'not-native' | 'no-permission';

/** Schedules a test notice in about 10 seconds (you can close the app). */
export async function sendTestNotice(): Promise<TestResult> {
  if (!isNotificationsSupported()) return 'not-native';
  if ((await checkNotificationPermission()) !== 'granted') return 'no-permission';
  await ensureChannels();
  const item = {
    id: TEST_ID,
    title: 'Asistente TCP',
    body: 'Notificación de prueba: los avisos funcionan.',
    channelId: CHANNEL_DEADLINES,
    schedule: { at: new Date(Date.now() + TEST_DELAY_MS), allowWhileIdle: true },
    extra: { kind: KIND_TEST },
    isExactNotification: false,
  };
  await LocalNotifications.schedule({ notifications: [item] });
  return 'sent';
}

/**
 * Calls back with the route to open when the user taps one of our notices: the obligation for a
 * deadline notice, the stored route for a monthly reminder. Returns a remover.
 */
export function onNoticeTapped(callback: (ruta: string) => void): () => void {
  if (!isNotificationsSupported()) return () => {};
  const handle = LocalNotifications.addListener('localNotificationActionPerformed', (event) => {
    const extra = extraOf(event.notification.extra);
    if (extra?.kind === KIND_DEADLINE && typeof extra.obligacionId === 'string') {
      callback(`/obligaciones/${extra.obligacionId}`);
    } else if (extra?.kind === KIND_REMINDER && typeof extra.ruta === 'string') {
      callback(extra.ruta);
    }
  });
  return () => {
    void handle.then((h) => h.remove());
  };
}
