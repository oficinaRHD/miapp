import { describe, expect, it } from 'vitest';
import {
  DEFAULT_REMINDERS,
  parseReminderSettings,
  planReminders,
  reminderId,
  setReminder,
} from './recordatorios';

const ALL = { registro: true, calculadora: true, respaldo: true };

describe('reminderId', () => {
  it('is negative, deterministic and different per kind and month', () => {
    expect(reminderId('registro', '2026-10')).toBe(-2026101);
    expect(reminderId('calculadora', '2026-10')).toBe(-2026102);
    expect(reminderId('respaldo', '2026-10')).toBe(-2026103);
    expect(reminderId('registro', '2026-11')).toBe(-2026111);
    expect(reminderId('registro', '2026-10')).toBe(reminderId('registro', '2026-10'));
  });
  it('rejects a malformed month', () => {
    expect(() => reminderId('registro', '2026-1')).toThrow();
  });
});

describe('planReminders', () => {
  it('plans the next 60 days in order', () => {
    const plan = planReminders('2026-10-26T18:55', ALL);
    expect(plan.map((r) => `${r.at} ${r.kind}`)).toEqual([
      '2026-10-31T18:00 registro',
      '2026-11-01T09:00 calculadora',
      '2026-11-15T10:00 respaldo',
      '2026-11-30T18:00 registro',
      '2026-12-01T09:00 calculadora',
      '2026-12-15T10:00 respaldo',
    ]);
    expect(new Set(plan.map((r) => r.id)).size).toBe(plan.length);
    expect(plan.every((r) => r.id < 0)).toBe(true);
  });

  it('skips a reminder whose time already passed today', () => {
    expect(planReminders('2026-10-31T19:00', ALL)[0]?.at).toBe('2026-11-01T09:00');
    expect(planReminders('2026-10-31T17:00', ALL)[0]?.at).toBe('2026-10-31T18:00');
  });

  it('leaves out the kinds that are switched off', () => {
    const plan = planReminders('2026-10-26T18:55', { registro: false, calculadora: true, respaldo: false });
    expect(plan.map((r) => r.kind)).toEqual(['calculadora', 'calculadora']);
  });

  it('crosses the year boundary', () => {
    const plan = planReminders('2026-12-20T10:00', ALL);
    expect(plan[0]?.at).toBe('2026-12-31T18:00');
    expect(plan.map((r) => r.at)).toContain('2027-01-01T09:00');
    expect(plan.map((r) => r.at)).toContain('2027-02-15T10:00');
    expect(plan.map((r) => r.at)).not.toContain('2027-02-28T18:00');
  });

  it('uses the real last day of the month', () => {
    const plan = planReminders('2028-02-10T10:00', ALL);
    expect(plan.map((r) => r.at)).toContain('2028-02-29T18:00');
  });

  it('points each reminder to its view', () => {
    const plan = planReminders('2026-10-26T18:55', ALL);
    const route = (k: string) => plan.find((r) => r.kind === k)?.ruta;
    expect(route('registro')).toBe('/registro');
    expect(route('calculadora')).toBe('/calculadora');
    expect(route('respaldo')).toBe('/ajustes/respaldo');
  });

  it('rejects an invalid now', () => {
    expect(() => planReminders('2026-10-26', ALL)).toThrow();
    expect(() => planReminders('2026-02-30T10:00', ALL)).toThrow();
  });
});

describe('parseReminderSettings', () => {
  it('reads booleans and switches on anything missing', () => {
    expect(parseReminderSettings({ registro: false, calculadora: true })).toEqual({ registro: false, calculadora: true });
    expect(parseReminderSettings({ registro: false })).toEqual({ registro: false, calculadora: true });
    expect(parseReminderSettings(undefined)).toEqual(DEFAULT_REMINDERS);
    expect(parseReminderSettings('x')).toEqual(DEFAULT_REMINDERS);
  });
});

describe('setReminder', () => {
  it('changes one flag and leaves the other and the original untouched', () => {
    const base = { registro: true, calculadora: true };
    expect(setReminder(base, 'registro', false)).toEqual({ registro: false, calculadora: true });
    expect(base).toEqual({ registro: true, calculadora: true });
  });
});
