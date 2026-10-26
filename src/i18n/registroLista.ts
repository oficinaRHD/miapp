// Texts of V06 (Registro). Same style as src/i18n/calendario.ts.
import type { TipoFilter } from '../app/registro';

export const esRegistroLista = {
  title: 'Registro',
  loading: 'Cargando…',
  loadError: 'No se pudo cargar el registro',
  prevMonth: 'Mes anterior',
  nextMonth: 'Mes siguiente',
  filterLabel: 'Mostrar',
  filters: { todos: 'Todos', ingreso: 'Ingresos', gasto: 'Gastos' } satisfies Record<TipoFilter, string>,
  totals: { ingresos: 'Ingresos', gastos: 'Gastos', neto: 'Neto' },
  count: (n: number): string => (n === 1 ? '1 movimiento' : `${n} movimientos`),
  receipt: 'Con comprobante',
  emptyMonth: 'Aún no hay movimientos este mes.',
  emptyFilter: { ingreso: 'No hay ingresos este mes.', gasto: 'No hay gastos este mes.' },
  firstIncome: 'Registrar el primer ingreso',
  add: 'Registrar movimiento',
} as const;
