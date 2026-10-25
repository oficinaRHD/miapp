// Texts of V03 (Calendario). Same style as src/i18n/inicio.ts.
import type { DayStatus } from '../app/calendario';

export function dayCountText(count: number): string {
  if (count === 0) return 'Sin vencimientos';
  return count === 1 ? '1 vencimiento' : `${count} vencimientos`;
}

export const calendario = {
  title: 'Calendario',
  loading: 'Cargando…',
  loadError: 'No se pudieron cargar las obligaciones',
  prevMonth: 'Mes anterior',
  nextMonth: 'Mes siguiente',
  prevYear: 'Año anterior',
  nextYear: 'Año siguiente',
  modeMonth: 'Mes',
  modeYear: 'Año',
  filterLabel: 'Tributo',
  filterAll: 'Todos los tributos',
  weekdays: ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'],
  dayNone: 'No hay vencimientos este día.',
  yearNone: 'No hay vencimientos este año.',
  legend: 'Colores',
  status: {
    vencida: 'Vencida',
    urgente: 'Urgente',
    pronto: 'Pronto',
    tranquila: 'A tiempo',
    pagada: 'Pagada',
    omitida: 'Omitida',
  } satisfies Record<DayStatus, string>,
} as const;
