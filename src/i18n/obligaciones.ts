// Texts of V04 (Obligaciones). Same style as src/i18n/calendario.ts.
import type { DayStatus } from '../app/calendario';
import type { ObligationFilter } from '../app/obligacionesList';

export const obligaciones = {
  title: 'Obligaciones',
  loading: 'Cargando…',
  loadError: 'No se pudieron cargar las obligaciones',
  filterLabel: 'Filtrar por estado',
  filters: {
    pendientes: 'Pendientes',
    vencidas: 'Vencidas',
    pagadas: 'Pagadas',
    omitidas: 'Omitidas',
  } satisfies Record<ObligationFilter, string>,
  empty: {
    pendientes: 'No tienes obligaciones pendientes.',
    vencidas: 'No tienes obligaciones vencidas.',
    pagadas: 'Aún no has marcado ninguna obligación como pagada.',
    omitidas: 'No has omitido ninguna obligación.',
  } satisfies Record<ObligationFilter, string>,
  status: {
    vencida: 'Vencida',
    urgente: 'Urgente',
    pronto: 'Pronto',
    tranquila: 'A tiempo',
    pagada: 'Pagada',
    omitida: 'Omitida',
  } satisfies Record<DayStatus, string>,
  due: 'Vence',
  amount: {
    pagado: (cup: string) => `Pagado: ${cup}`,
    oficial: (cup: string) => `${cup} · según el vector`,
    estimado: (cup: string) => `~ ${cup} · estimado`,
    ninguno: 'Importe por definir',
  },
  disclaimer: 'Importes orientativos. Confirma con tu vector fiscal.',
} as const;
