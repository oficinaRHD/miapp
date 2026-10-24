import { NAME_MAX } from '../app/onboarding';
import { NIT_LENGTH, RC05_LENGTH, type FormError } from '../app/perfilForm';

// Texts of the profile view (V17). Tributo and periodicity texts are reused from `onboarding.ts`.
export const esPerfil = {
  title: 'Perfil y tributos',
  save: 'Guardar cambios',
  saved: 'Cambios guardados.',
  saveError: 'No se pudieron guardar los cambios',
  noChanges: 'Sin cambios por guardar.',

  basicTitle: 'Datos básicos',
  nameLabel: 'Nombre para mostrar',
  activityCodeLabel: 'Código de actividad (opcional)',
  activityNameLabel: 'Actividad (opcional)',
  municipioLabel: 'Municipio (opcional)',
  municipioCodigoLabel: 'Código del municipio (opcional)',
  fechaLabel: 'Fecha de inscripción fiscal (opcional)',

  idTitle: 'Identificación fiscal',
  idHint:
    'El RC-05 y el NIT se guardan solo en este teléfono y no van en el respaldo salvo que lo elijas. Puedes escribirlos con o sin guiones.',
  rc05Label: 'RC-05 (16 dígitos, opcional)',
  nitLabel: 'NIT (11 dígitos, opcional)',

  employeesLabel: 'Tengo empleados',
  employeesHint: 'Sugiere los tributos de nómina mientras no cambies la lista a mano.',

  tributosTitle: 'Tributos activos',
  tributosHint:
    'Cambiar esta lista no modifica las obligaciones ya creadas ni crea las que falten.',

  onatReminderTitle: 'Informa a la ONAT',
  onatReminder:
    'Según el vector fiscal, los cambios de datos del negocio se informan a la ONAT en 30 días naturales.',

  error(e: FormError): string {
    switch (e) {
      case 'name-required':
        return 'Escribe un nombre.';
      case 'name-too-long':
        return `Máximo ${NAME_MAX} caracteres.`;
      case 'tributos-required':
        return 'Marca al menos un tributo.';
      case 'rc05-invalid':
        return `El RC-05 debe tener ${RC05_LENGTH} dígitos.`;
      case 'nit-invalid':
        return `El NIT debe tener ${NIT_LENGTH} dígitos.`;
      case 'fecha-invalid':
        return 'Fecha no válida.';
    }
  },
} as const;
