import { applyRateBp } from '../money';
import type { Centavos } from '../types';

/** 10 % in basis points (01, section 3: 0114022). */
export const SALES_RATE_BP = 1000;

/**
 * Tributo 0114022: 10 % of the month's income from sales and/or services.
 * Exception noted in the vector (not handled here): telecommunications and insurance agents.
 * Estimate only: confirm with the user's vector.
 */
export function salesTax(monthlyIncome: Centavos): Centavos {
  return applyRateBp(monthlyIncome, SALES_RATE_BP);
}
