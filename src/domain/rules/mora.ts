import { NO_HOLIDAYS, lateBusinessDays, type Holidays } from '../businessDays';
import { applyRateBp } from '../money';
import type { Centavos, ISODate } from '../types';

/** Tributo 1060122 (01, section 4). Rates in basis points. */
export const LATE_RATE_UP_TO_30_BP = 200; // 2 %
export const LATE_RATE_31_TO_60_BP = 500; // 5 %
export const LATE_RATE_PER_DAY_BP = 10; // 0.1 % per day of delay
export const LATE_RATE_CAP_BP = 4000; // cap: 40 %

export type LateTier = 'none' | 'upTo30' | 'from31to60' | 'over60';

export interface LateSurcharge {
  businessDays: number;
  tier: LateTier;
  rateBp: number;
  surcharge: Centavos;
  capApplied: boolean;
}

/**
 * Late surcharge on the principal owed.
 * - up to 30 business days: 2 %
 * - 31 to 60: 5 %
 * - over 60: 0.1 % per day of delay, capped at 40 %
 *
 * ASSUMPTION (pending confirmation with the ONAT, see 01): in the third tier,
 * "days of delay" are the same business days counted for the tiers, and the
 * 0.1 % applies to the whole count (e.g. 61 days -> 6.1 %), not only to the days past 60.
 */
export function lateSurcharge(principal: Centavos, lateDays: number): LateSurcharge {
  if (!Number.isInteger(lateDays) || lateDays < 0) throw new RangeError(`Invalid days: ${lateDays}`);

  if (lateDays === 0) return { businessDays: 0, tier: 'none', rateBp: 0, surcharge: 0, capApplied: false };

  if (lateDays <= 30) {
    return { businessDays: lateDays, tier: 'upTo30', rateBp: LATE_RATE_UP_TO_30_BP, surcharge: applyRateBp(principal, LATE_RATE_UP_TO_30_BP), capApplied: false };
  }
  if (lateDays <= 60) {
    return { businessDays: lateDays, tier: 'from31to60', rateBp: LATE_RATE_31_TO_60_BP, surcharge: applyRateBp(principal, LATE_RATE_31_TO_60_BP), capApplied: false };
  }
  const raw = lateDays * LATE_RATE_PER_DAY_BP;
  const capApplied = raw > LATE_RATE_CAP_BP;
  const rateBp = capApplied ? LATE_RATE_CAP_BP : raw;
  return { businessDays: lateDays, tier: 'over60', rateBp, surcharge: applyRateBp(principal, rateBp), capApplied };
}

/**
 * Same as `lateSurcharge`, counting business days between the due and payment dates.
 * With no holiday list (pending) only weekends are skipped: the UI must warn about it.
 */
export function lateSurchargeByDates(
  principal: Centavos,
  due: ISODate,
  paid: ISODate,
  holidays: Holidays = NO_HOLIDAYS,
): LateSurcharge {
  return lateSurcharge(principal, lateBusinessDays(due, paid, holidays));
}
