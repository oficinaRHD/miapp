// UI texts for V16 (Notificaciones).
import type { NotificationPermissionState } from '../app/notificationPermission';
import type { RescheduleResult } from '../stores/avisos';
import type { TestResult } from '../services/notifications';

export function resultText(r: RescheduleResult): string {
  if (r.status === 'error') return `No se pudieron programar los avisos: ${r.message}`;
  if (r.status === 'skipped') {
    return r.reason === 'not-native'
      ? 'Las notificaciones solo funcionan en la app instalada (APK), no en el navegador.'
      : 'Falta el permiso de notificaciones.';
  }
  if (r.scheduled === 0) return 'No hay avisos que programar en los próximos 60 días.';
  return `Avisos programados: ${r.scheduled}.`;
}

export function testText(r: TestResult): string {
  if (r === 'sent') return 'Notificación de prueba enviada: llegará en unos 10 segundos. Puedes cerrar la app.';
  if (r === 'not-native') return 'Las notificaciones solo funcionan en la app instalada (APK), no en el navegador.';
  return 'Falta el permiso de notificaciones.';
}

export const esNotificaciones = {
  title: 'Notificaciones',
  back: 'Volver al inicio',
  permissionTitle: 'Permiso',
  permission: {
    granted: 'Permitidas.',
    denied: 'Bloqueadas. Actívalas en Ajustes de Android > Apps > Asistente TCP > Notificaciones.',
    unknown: 'Sin permiso todavía.',
  } satisfies Record<NotificationPermissionState, string>,
  ask: 'Permitir notificaciones',
  pendingTitle: 'Avisos programados',
  pendingCount: (n: number) => (n === 1 ? '1 aviso en espera.' : `${n} avisos en espera.`),
  pendingNote:
    'Se avisa 7, 3 y 1 día antes del vencimiento y el mismo día, a las 09:00, de los próximos 60 días. Pueden llegar unos minutos tarde.',
  reschedule: 'Reprogramar avisos ahora',
  testTitle: 'Prueba',
  test: 'Enviar notificación de prueba',
  working: 'Trabajando...',
  batteryTitle: 'Si no llegan los avisos',
  batteryBody:
    'Algunos teléfonos cierran las apps en segundo plano. En Ajustes de Android > Apps > Asistente TCP > Batería, elige "Sin restricciones". La guía completa llega en el próximo paso.',
  actionError: 'No se pudo completar la acción',
};
