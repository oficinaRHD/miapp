import { applyRateBp, subtractFloor } from '../money';
import type { Centavos } from '../types';

/** Monthly exempt minimum: 3,260.00 CUP (01, section 3: 0510122). */
export const MONTHLY_EXEMPT_MINIMUM: Centavos = 326_000;

/** 5 % in basis points. */
export const ISIP_MONTHLY_RATE_BP = 500;

/**
 * Tributo 0510122: 5 % x max(0, total income of the month - 3,260.00).
 * Estimate only: confirm with the user's vector.
 */
export function monthlyIsip(totalMonthlyIncome: Centavos): Centavos {
  return applyRateBp(subtractFloor(totalMonthlyIncome, MONTHLY_EXEMPT_MINIMUM), ISIP_MONTHLY_RATE_BP);
}
