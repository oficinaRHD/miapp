// Settings access for views. Data access goes through the settings repository only.
import { db } from '../data';
import { ajustesRepo } from '../data/repositories/ajustes';
import {
  SETTING_NOTIFICATION_PERMISSION,
  isPermissionState,
  type NotificationPermissionState,
} from '../app/notificationPermission';

const repo = ajustesRepo(db);

/** Last stored permission state; 'unknown' if never stored or invalid. */
export async function loadNotificationPermission(): Promise<NotificationPermissionState> {
  const value = await repo.get<unknown>(SETTING_NOTIFICATION_PERMISSION, 'unknown');
  return isPermissionState(value) ? value : 'unknown';
}

export async function saveNotificationPermission(state: NotificationPermissionState): Promise<void> {
  await repo.set(SETTING_NOTIFICATION_PERMISSION, state);
}
