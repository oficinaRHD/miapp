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
  editDates: {
    button: 'Editar fechas del año',
    title: 'Editar fechas del año',
    lead: 'Escribe la fecha que figura en tu vector fiscal. Lo que no cambies se queda igual.',
    scope: 'Solo se cambian las obligaciones pendientes. Las pagadas y omitidas no se tocan.',
    yearLabel: 'Año',
    prevYear: 'Año anterior',
    nextYear: 'Año siguiente',
    now: 'Ahora',
    pattern: 'Patrón',
    changes: (n: number) => (n === 0 ? 'Sin cambios' : n === 1 ? '1 cambio' : `${n} cambios`),
    save: 'Guardar cambios',
    cancel: 'Cancelar',
    saveError: 'No se pudieron guardar los cambios',
    saved: (n: number) => (n === 1 ? 'Se cambió 1 fecha.' : `Se cambiaron ${n} fechas.`),
    failed: (n: number) => (n === 1 ? 'No se pudo cambiar 1 fecha' : `No se pudieron cambiar ${n} fechas`),
    empty: 'No hay obligaciones pendientes en este año.',
    holidaysNote: 'Las fechas calculadas no tienen en cuenta feriados porque no has cargado ninguno (Ajustes, Feriados).',
    estimateNotice: 'Estimación orientativa. Confirma con tu vector fiscal.',
  },
  nextYear: {
    button: (year: number) => `Generar obligaciones de ${year}`,
    title: (year: number) => `Generar obligaciones de ${year}`,
    lead: 'Se crean con fechas calculadas por patrón. Después ajústalas con tu vector en "Editar fechas del año".',
    summary: (count: number, first: string, last: string) =>
      `Se crearán ${count} obligaciones, del ${first} al ${last}.`,
    none: 'Con los tributos activos no hay obligaciones periódicas que crear.',
    holidaysNote: 'Las fechas calculadas no tienen en cuenta feriados porque no has cargado ninguno (Ajustes, Feriados).',
    confirm: 'Crear obligaciones',
    cancel: 'Cancelar',
    created: (count: number, year: number) =>
      count === 1 ? `Se creó 1 obligación de ${year}.` : `Se crearon ${count} obligaciones de ${year}.`,
    error: 'No se pudieron crear las obligaciones',
  },
} as const;
