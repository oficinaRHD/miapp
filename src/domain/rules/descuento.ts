import { applyRateBp } from '../money';
import type { Centavos } from '../types';

/** 3 % discount for paying through electronic channels (01, section 5). */
export const ELECTRONIC_DISCOUNT_RATE_BP = 300;

export interface ElectronicDiscount {
  discount: Centavos;
  total: Centavos;
}

/** 3 % of the amount to pay. Whether it applies to late surcharges is not stated in 01. */
export function electronicDiscount(amount: Centavos): ElectronicDiscount {
  const discount = applyRateBp(amount, ELECTRONIC_DISCOUNT_RATE_BP);
  return { discount, total: amount - discount };
}
