// Texts of V02 (Inicio). Same style as src/i18n/perfil.ts and src/i18n/onboarding.ts.
import type { Urgency } from '../app/inicio';

/** 'hoy', 'mañana', 'en 5 días', 'hace 1 día', 'hace 5 días'. */
export function daysText(dias: number): string {
  if (dias === 0) return 'hoy';
  if (dias === 1) return 'mañana';
  if (dias > 1) return `en ${dias} días`;
  if (dias === -1) return 'hace 1 día';
  return `hace ${-dias} días`;
}

export function overdueText(count: number): string {
  return count === 1 ? 'Tienes 1 obligación vencida.' : `Tienes ${count} obligaciones vencidas.`;
}

export const inicio = {
  greeting: (name: string) => `Hola, ${name}`,
  settings: 'Ajustes',
  loading: 'Cargando…',
  loadError: 'No se pudieron cargar las obligaciones',
  nextTitle: 'Próximo vencimiento',
  nextNone: 'No tienes vencimientos pendientes.',
  amountUnknown: 'Importe por definir',
  officialAmount: 'según el vector',
  estimatedAmount: 'estimado',
  upcomingTitle: 'Próximos 30 días',
  upcomingNone: 'No hay vencimientos en los próximos 30 días.',
  alertsTitle: 'Alertas',
  notificationsDenied: 'Las notificaciones están desactivadas: no recibirás avisos de vencimientos.',
  notificationsFix: 'Revisar notificaciones',
  overdueTitle: 'Vencidas',
  disclaimer: 'Importes orientativos. Confirma con tu vector fiscal.',
  urgency: {
    vencida: 'Vencida',
    urgente: 'Urgente',
    pronto: 'Pronto',
    tranquila: 'A tiempo',
  } satisfies Record<Urgency, string>,
  month: {
    title: (monthLabel: string) => `Este mes · ${monthLabel}`,
    income: 'Ingresos',
    expenses: 'Gastos',
    tax: 'Impuesto estimado',
    taxHint: 'Ventas y servicios más ISIP mensual, según tus ingresos registrados.',
    addIncome: '+ Ingreso',
    addExpense: '+ Gasto',
    seeRegistro: 'Ver registro',
    seeCalculadora: 'Calculadora',
    loadError: 'No se pudo cargar el resumen del mes',
  },
} as const;
