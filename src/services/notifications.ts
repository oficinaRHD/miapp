// Notification service. For now only the permission part (onboarding step 4).
// Scheduling, channels and rescheduling arrive in M6, in this same file.
import { LocalNotifications } from '@capacitor/local-notifications';
import { mapPermission, type NotificationPermissionState } from '../app/notificationPermission';

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
