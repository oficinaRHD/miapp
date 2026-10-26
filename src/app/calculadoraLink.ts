// Finds the obligation that "Usar como importe estimado" would write to. Pure; no fiscal rules.
import type { Obligacion } from '../data/models';
import type { Centavos, ISODate } from '../domain/types';

export type TargetStatus = 'ready' | 'missing' | 'paid' | 'omitted';

export interface EstimateTarget {
  codigo: string;
  status: TargetStatus;
  obligacionId?: string;
  periodoEtiqueta?: string;
  vence?: ISODate;
  currentEstimate?: Centavos;
  /** The obligation has an official amount from the vector (V05 shows that one first). */
  hasOfficial: boolean;
  /** The stored estimate already equals `amount`. */
  upToDate: boolean;
}

/**
 * The monthly obligation of tributo `codigo` for income month `mes` ('YYYY-MM'): the period key
 * of a monthly obligation is the month of the income (its due date falls in the next month).
 * Only a pending one can be written to.
 */
export function findEstimateTarget(
  obligaciones: readonly Obligacion[],
  codigo: string,
  mes: string,
  amount: Centavos,
): EstimateTarget {
  const o = obligaciones.find(
    (x) => x.tributoCodigo === codigo && x.periodoTipo === 'mensual' && x.periodoClave === mes,
  );
  if (!o) return { codigo, status: 'missing', hasOfficial: false, upToDate: false };
  const status: TargetStatus =
    o.estado === 'pagada' ? 'paid' : o.estado === 'omitida' ? 'omitted' : 'ready';
  return {
    codigo,
    status,
    obligacionId: o.id,
    periodoEtiqueta: o.periodoEtiqueta,
    vence: o.vence,
    ...(o.importeEstimado !== undefined ? { currentEstimate: o.importeEstimado } : {}),
    hasOfficial: o.importeOficial !== undefined,
    upToDate: o.importeEstimado === amount,
  };
}
