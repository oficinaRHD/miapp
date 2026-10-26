// Month estimate for V08. Combines the domain rules; no rate or threshold is written here.
import { ISIP_MONTHLY_RATE_BP, MONTHLY_EXEMPT_MINIMUM, monthlyIsip } from '../domain/rules/isipMensual';
import { SALES_RATE_BP, salesTax } from '../domain/rules/ventas';
import type { Centavos } from '../domain/types';
import { amountFromText, amountToText } from './registro';

/** Rates and threshold shown on screen, taken from the domain rules. */
export const CALC_INFO = {
  salesRateBp: SALES_RATE_BP,
  isipRateBp: ISIP_MONTHLY_RATE_BP,
  exemptMinimum: MONTHLY_EXEMPT_MINIMUM,
} as const;

export interface CalcInput {
  /** Income from sales and/or services (basis of 0114022). */
  ventas: Centavos;
  /** Total income of the month (basis of 0510122). */
  ingresos: Centavos;
}

export interface CalcResult extends CalcInput {
  ventasTax: Centavos;
  isipTax: Centavos;
  total: Centavos;
}

/** Estimate for one month. Orientative: the user's vector decides. */
export function calcMonth(input: CalcInput): CalcResult {
  const ventasTax = salesTax(input.ventas);
  const isipTax = monthlyIsip(input.ingresos);
  return { ...input, ventasTax, isipTax, total: ventasTax + isipTax };
}

/** Basis points to text without trailing zeros: 1000 -> '10 %', 500 -> '5 %', 10 -> '0.1 %'. */
export function percentText(bp: number): string {
  return `${bp / 100} %`;
}

/* ------------------------------------------------------------------ */
/* Editable draft                                                      */
/* ------------------------------------------------------------------ */

export interface CalcDraft {
  ventasText: string;
  ingresosText: string;
}

export type CalcError = 'ventas-invalid' | 'ingresos-invalid' | 'ventas-exceeds';

export interface CalcEvaluation {
  result: CalcResult | null;
  errors: CalcError[];
}

/** Starting values: what the month's movements say (sales-flagged income and total income). */
export function draftFromTotals(t: { ventas: Centavos; ingresos: Centavos }): CalcDraft {
  return { ventasText: amountToText(t.ventas), ingresosText: amountToText(t.ingresos) };
}

/** True when the user typed something different from the month's movements. */
export function isEdited(d: CalcDraft, t: { ventas: Centavos; ingresos: Centavos }): boolean {
  const base = draftFromTotals(t);
  return amountFromText(d.ventasText) !== amountFromText(base.ventasText) ||
    amountFromText(d.ingresosText) !== amountFromText(base.ingresosText);
}

/** Zero is allowed here (a month without income); empty or malformed text is not. */
export function evaluateDraft(d: CalcDraft): CalcEvaluation {
  const ventas = amountFromText(d.ventasText);
  const ingresos = amountFromText(d.ingresosText);
  const errors: CalcError[] = [];
  if (ventas === null) errors.push('ventas-invalid');
  if (ingresos === null) errors.push('ingresos-invalid');
  if (ventas !== null && ingresos !== null && ventas > ingresos) errors.push('ventas-exceeds');
  if (errors.length > 0 || ventas === null || ingresos === null) return { result: null, errors };
  return { result: calcMonth({ ventas, ingresos }), errors };
}
