// UI texts for V15 (Respaldo y datos).
import { BACKUP_DUE_DAYS, WIPE_WORD, type BackupOutcome } from '../app/respaldo';

/** "hoy", "hace 1 día", "hace N días". */
export function daysAgoText(days: number): string {
  if (days <= 0) return 'hoy';
  if (days === 1) return 'hace 1 día';
  return `hace ${days} días`;
}

export const esRespaldo = {
  title: 'Respaldo y datos',
  back: 'Volver al inicio',
  intro:
    'Tus datos viven solo en este teléfono. Si desinstalas la app o borras sus datos, se pierden. Guarda un respaldo de vez en cuando.',

  lastTitle: 'Último respaldo',
  never: 'Aún no hay respaldo.',
  lastOk: (date: string, days: number) => `${date} (${daysAgoText(days)})`,
  lastDue: (date: string, days: number) =>
    `${date} (${daysAgoText(days)}). Hace más de ${BACKUP_DUE_DAYS} días: conviene hacer uno nuevo.`,

  exportTitle: 'Exportar',
  exportBody: 'Crea un archivo .json y lo comparte (WhatsApp, correo, Archivos...).',
  includePersonal: 'Incluir mis datos personales (RC-05 y NIT)',
  includePersonalWarn:
    'Quien tenga el archivo podrá leer tu RC-05 y tu NIT. Guárdalo en un lugar seguro.',
  reminder: 'Recordarme cada mes hacer un respaldo',
  reminderNote: 'Los avisos llegan con el servicio de notificaciones (aún pendiente).',
  exportButton: 'Exportar respaldo',
  exporting: 'Exportando...',
  exportDone: (outcome: BackupOutcome, fileName: string, movs: number, obls: number): string => {
    if (outcome === 'cancelled') return 'Compartir cancelado. No se anotó el respaldo.';
    const verb = outcome === 'shared' ? 'compartido' : 'descargado';
    return `Respaldo ${verb}: ${fileName} (${movs} movimientos, ${obls} obligaciones).`;
  },

  importTitle: 'Importar',
  importBody: 'Restaura los datos desde un archivo de respaldo.',
  importButton: 'Importar respaldo...',
  importWarn:
    'Importar reemplaza TODOS los datos de este teléfono. Antes se guarda una copia interna automática; si esa copia falla, no se importa nada.',
  importPick: 'Elegir archivo y restaurar',
  importing: 'Restaurando...',
  importCancelled: 'No se eligió ningún archivo. No se cambió nada.',
  importDone: (movs: number, obls: number, pre?: string): string =>
    `Datos restaurados (${movs} movimientos, ${obls} obligaciones).` +
    (pre ? ` Copia previa: ${pre}.` : ''),
  importNote:
    'Un respaldo sin datos personales deja el RC-05 y el NIT vacíos: se pueden volver a escribir en Perfil.',

  wipeTitle: 'Borrar todos los datos',
  wipeBody: 'Elimina movimientos, obligaciones y perfil de este teléfono. No se puede deshacer.',
  wipeButton: 'Borrar todos los datos...',
  wipePrompt: `Escribe ${WIPE_WORD} para confirmar.`,
  wipeConfirm: 'Borrar definitivamente',
  wiping: 'Borrando...',
  wipeDone: 'Se borraron todos los datos.',

  cancel: 'Cancelar',
  loadError: 'No se pudieron leer los ajustes de respaldo',
  actionError: 'No se pudo completar la acción',
};
