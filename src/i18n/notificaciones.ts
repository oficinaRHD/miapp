// UI texts for V16 (Notificaciones).
import type { AvisosFormError } from '../app/avisosForm';
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

export function offsetLabel(n: number): string {
  if (n === 0) return 'El mismo día';
  if (n === 1) return '1 día antes';
  return `${n} días antes`;
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

  prefsTitle: 'Cuándo avisar',
  prefsBody: 'Elige cuántos días antes del vencimiento quieres el aviso y a qué hora.',
  timeLabel: 'Hora del aviso',
  save: 'Guardar y reprogramar',
  saved: 'Preferencias guardadas.',
  formError: {
    offsets: 'Elige al menos un aviso.',
    time: 'Escribe una hora válida.',
  } satisfies Record<AvisosFormError, string>,

  pendingTitle: 'Avisos programados',
  pendingCount: (n: number) => (n === 1 ? '1 aviso en espera.' : `${n} avisos en espera.`),
  pendingNote:
    'Se programan los avisos de los próximos 60 días según tus preferencias. Pueden llegar unos minutos tarde.',
  reschedule: 'Reprogramar avisos ahora',
  testTitle: 'Prueba',
  test: 'Enviar notificación de prueba',
  working: 'Trabajando...',

  battery: {
    title: 'Si no llegan los avisos',
    intro:
      'Algunos teléfonos cierran las apps en segundo plano para ahorrar batería y los avisos se pierden. Los nombres de los menús cambian según la marca; busca opciones parecidas.',
    steps: [
      'Abre Ajustes de Android > Apps > Asistente TCP > Batería (o "Uso de batería").',
      'Elige "Sin restricciones" (en algunos teléfonos, "Sin optimizar" o "No optimizar").',
      'Si tu teléfono es Xiaomi, Huawei, Oppo, Vivo o Samsung, busca además opciones como "Inicio automático", "Ejecutar en segundo plano" o quita la app de la lista de "Apps en suspensión".',
      'Toca "Enviar notificación de prueba", cierra la app y espera unos 10 segundos para comprobar que llega.',
    ],
    tip: 'En algunos teléfonos, cerrar la app deslizándola desde "Recientes" cancela los avisos. Si te pasa, déjala abierta en segundo plano y vuelve a abrirla de vez en cuando.',
  },
  actionError: 'No se pudo completar la acción',
};
