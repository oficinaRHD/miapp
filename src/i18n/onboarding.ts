import type { PeriodoTipo } from '../domain/types';

// Texts of the onboarding view (V01). Common texts stay in `es.ts`.
export const esOnboarding = {
  stepLabel: (n: number, total: number) => `Paso ${n} de ${total}`,
  back: 'Atrás',
  next: 'Continuar',
  start: 'Empezar',
  saveError: 'No se pudo guardar el perfil',

  welcomeTitle: 'Bienvenido a Asistente TCP',
  welcomeLead: 'Te ayuda a no olvidar ni equivocar tus pagos a la ONAT.',
  welcomePoints: [
    'Todo se guarda solo en tu teléfono. No hay cuentas ni servidores.',
    'Funciona sin internet.',
    'Los cálculos son orientativos: confirma siempre con tu vector fiscal.',
  ],

  profileTitle: 'Tu perfil',
  nameLabel: 'Nombre para mostrar',
  nameHint: 'Solo se usa dentro de la app.',
  nameRequired: 'Escribe un nombre.',
  nameTooLong: (max: number) => `Máximo ${max} caracteres.`,
  activityCodeLabel: 'Código de actividad (opcional)',
  activityNameLabel: 'Actividad (opcional)',
  employeesLabel: 'Tengo empleados',
  employeesHint: 'Activa los tributos de nómina en el paso siguiente.',

  tributosTitle: 'Tus tributos',
  tributosLead: 'Marca los que aparecen en tu vector fiscal. La app propone y tú confirmas.',
  tributosEventualHint: 'Los eventuales no se proponen: márcalos si figuran en tu vector.',
  tributosRequired: 'Marca al menos un tributo.',
  resetSuggestion: 'Restablecer sugerencia',
  withEmployeesTag: 'con empleados',
  periodicity: {
    mensual: 'mensual',
    trimestral: 'trimestral',
    anual: 'anual',
    eventual: 'eventual',
  } satisfies Record<PeriodoTipo, string>,

  notifTitle: 'Avisos de vencimiento',
  notifLead:
    'La app te avisa antes de cada fecha límite, aun sin internet. Para eso Android pide tu permiso.',
  notifAllow: 'Permitir avisos',
  notifStatusGranted: 'Avisos permitidos.',
  notifStatusDenied:
    'Avisos bloqueados. Puedes continuar y activarlos luego en los ajustes del sistema; Inicio te lo recordará.',
  notifStatusUnknown: 'Aún sin permiso. Puedes continuar y decidir después.',

  pendingTitle: 'Perfil guardado',
  pendingBody: 'Falta el paso de fechas del año (próximo paso de desarrollo).',
  finishProvisional: 'Terminar (provisional)',
} as const;
