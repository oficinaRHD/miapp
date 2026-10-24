// Pure helpers for the notification permission (no Capacitor import here).

/** Key in the `ajustes` table where the last known permission state is stored. */
export const SETTING_NOTIFICATION_PERMISSION = 'notificacionesPermiso';

export type NotificationPermissionState = 'granted' | 'denied' | 'unknown';

const STATES: readonly NotificationPermissionState[] = ['granted', 'denied', 'unknown'];

/** Narrows a stored or external value to a known state. */
export function isPermissionState(value: unknown): value is NotificationPermissionState {
  return typeof value === 'string' && (STATES as readonly string[]).includes(value);
}

/**
 * Maps the plugin's `display` value ('granted' | 'denied' | 'prompt' | 'prompt-with-rationale')
 * to the app state. Anything that is not clearly granted or denied is 'unknown'.
 */
export function mapPermission(display: unknown): NotificationPermissionState {
  if (display === 'granted') return 'granted';
  if (display === 'denied') return 'denied';
  return 'unknown';
}
