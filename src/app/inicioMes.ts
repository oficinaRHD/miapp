// Month summary for V02 (Inicio). Uses the same estimate as V08; no rates are written here.
import type { Movimiento } from '../data/models';
import type { Centavos } from '../domain/types';
import { calcMonth } from './calculadora';
import { monthTotals } from './registro';

export interface MonthSummary {
  ingresos: Centavos;
  gastos: Centavos;
  /** Estimated 0114022 + 0510122 for the month. Orientative: the user's vector decides. */
  impuesto: Centavos;
  count: number;
}

export function buildMonthSummary(movs: readonly Movimiento[]): MonthSummary {
  const t = monthTotals(movs);
  const impuesto = calcMonth({ ventas: t.ventas, ingresos: t.ingresos }).total;
  return { ingresos: t.ingresos, gastos: t.gastos, impuesto, count: t.count };
}
