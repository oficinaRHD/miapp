import { describe, expect, it } from 'vitest';
import { toHolidaySet } from '../businessDays';
import { lateSurcharge, lateSurchargeByDates } from './mora';

const PRINCIPAL = 100_000; // 1,000.00 CUP

describe('lateSurcharge (1060122)', () => {
  it('no delay, no surcharge', () => {
    expect(lateSurcharge(PRINCIPAL, 0)).toEqual({
      businessDays: 0, tier: 'none', rateBp: 0, surcharge: 0, capApplied: false,
    });
  });

  it('up to 30 business days: 2 %', () => {
    expect(lateSurcharge(PRINCIPAL, 1).surcharge).toBe(2_000);
    const r = lateSurcharge(PRINCIPAL, 30);
    expect(r.surcharge).toBe(2_000);
    expect(r.tier).toBe('upTo30');
  });

  it('31 to 60 business days: 5 %', () => {
    const first = lateSurcharge(PRINCIPAL, 31);
    expect(first.surcharge).toBe(5_000);
    expect(first.tier).toBe('from31to60');
    expect(lateSurcharge(PRINCIPAL, 60).surcharge).toBe(5_000);
  });

  it('over 60: 0.1 % per day (assumption), capped at 40 %', () => {
    const r61 = lateSurcharge(PRINCIPAL, 61);
    expect(r61.tier).toBe('over60');
    expect(r61.rateBp).toBe(610);
    expect(r61.surcharge).toBe(6_100);
    expect(lateSurcharge(PRINCIPAL, 400)).toMatchObject({ surcharge: 40_000, capApplied: false });
    expect(lateSurcharge(PRINCIPAL, 1_000)).toMatchObject({ surcharge: 40_000, capApplied: true });
  });

  it('rejects invalid days', () => {
    expect(() => lateSurcharge(PRINCIPAL, -1)).toThrow(RangeError);
    expect(() => lateSurcharge(PRINCIPAL, 1.5)).toThrow(RangeError);
  });
});

describe('lateSurchargeByDates', () => {
  it('paid on time: nothing', () => {
    expect(lateSurchargeByDates(PRINCIPAL, '2026-10-20', '2026-10-20').surcharge).toBe(0);
  });

  it('counts business days between due and payment', () => {
    const r = lateSurchargeByDates(PRINCIPAL, '2026-10-20', '2026-10-26');
    expect(r.businessDays).toBe(4);
    expect(r.surcharge).toBe(2_000);
  });

  it('uses the holiday list when provided', () => {
    const r = lateSurchargeByDates(PRINCIPAL, '2026-10-20', '2026-10-23', toHolidaySet(['2026-10-22']));
    expect(r.businessDays).toBe(2);
  });

  it('reaches the second tier after about 6 weeks (no holidays)', () => {
    // 2026-10-20 + 31 business days (Mon-Fri) = 2026-12-02
    const r = lateSurchargeByDates(PRINCIPAL, '2026-10-20', '2026-12-02');
    expect(r.businessDays).toBe(31);
    expect(r.tier).toBe('from31to60');
    expect(r.surcharge).toBe(5_000);
  });
});
