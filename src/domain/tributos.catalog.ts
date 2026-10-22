import type { OrigenFecha, PeriodoTipo } from './types';

/** Version of the bundled rules. Bump when the catalog or a rule changes. */
export const RULES_VERSION = '2026.1';

/**
 * How the default due date is computed (the vector date always wins).
 * - fixedDay: day `day` of the month after the period closes; if it is not a
 *   business day, moves to the next business day.
 * - nthBusinessDay: n-th business day of the month after the period closes
 *   (the vector says "dentro de los primeros diez días hábiles").
 * - annualDate: fixed date (month/day) of the year after the period.
 * - manual: date comes from the vector or the user (eventual tributos).
 */
export type DateRule =
  | { kind: 'fixedDay'; day: number }
  | { kind: 'nthBusinessDay'; n: number }
  | { kind: 'annualDate'; month: number; day: number }
  | { kind: 'manual' };

export interface Tributo {
  code: string;
  /** Official name as written in the vector (source: 01, section 1). */
  name: string;
  /** Short label for lists and cards. */
  shortName: string;
  periodicity: PeriodoTipo;
  dateRule: DateRule;
  /** Only applies when the TCP has employees. */
  requiresEmployees: boolean;
  /** Version where the app calculates the amount (01, section 8). null = none. */
  calculationFrom: 'v0.1' | 'v0.2' | 'v0.3' | null;
  /** False for the late surcharge, which is not listed in the vector. */
  inVector: boolean;
}

export const TRIBUTOS: readonly Tributo[] = [
  {
    code: '0114022',
    name: 'Impuesto sobre ventas y servicios, personas naturales',
    shortName: 'Ventas y servicios',
    periodicity: 'mensual',
    dateRule: { kind: 'fixedDay', day: 20 },
    requiresEmployees: false,
    calculationFrom: 'v0.1',
    inVector: true,
  },
  {
    code: '0510122',
    name: 'ISIP, aporte mensual',
    shortName: 'ISIP mensual',
    periodicity: 'mensual',
    dateRule: { kind: 'fixedDay', day: 20 },
    requiresEmployees: false,
    calculationFrom: 'v0.1',
    inVector: true,
  },
  {
    code: '0520522',
    name: 'ISIP, retención trabajador por cuenta propia',
    shortName: 'Retención ISIP',
    periodicity: 'mensual',
    dateRule: { kind: 'fixedDay', day: 20 },
    requiresEmployees: true,
    calculationFrom: 'v0.3',
    inVector: true,
  },
  {
    code: '0530222',
    name: 'ISIP, liquidación adicional (declaración jurada)',
    shortName: 'ISIP anual',
    periodicity: 'anual',
    dateRule: { kind: 'annualDate', month: 4, day: 30 },
    requiresEmployees: false,
    calculationFrom: 'v0.2',
    inVector: true,
  },
  {
    code: '0610322',
    name: 'Impuesto por la utilización de fuerza de trabajo, persona natural',
    shortName: 'Fuerza de trabajo',
    periodicity: 'trimestral',
    dateRule: { kind: 'fixedDay', day: 20 },
    requiresEmployees: true,
    calculationFrom: 'v0.3',
    inVector: true,
  },
  {
    code: '0730122',
    name: 'Impuesto sobre documentos',
    shortName: 'Documentos',
    periodicity: 'eventual',
    dateRule: { kind: 'manual' },
    requiresEmployees: false,
    calculationFrom: null,
    inVector: true,
  },
  {
    code: '0810132',
    name: 'Contribución a la seguridad social',
    shortName: 'Seguridad social',
    periodicity: 'mensual',
    dateRule: { kind: 'nthBusinessDay', n: 10 },
    requiresEmployees: true,
    calculationFrom: 'v0.3',
    inVector: true,
  },
  {
    code: '0820232',
    name: 'Contribución especial a la seguridad social, retenciones',
    shortName: 'Contribución especial SS',
    periodicity: 'mensual',
    dateRule: { kind: 'nthBusinessDay', n: 10 },
    requiresEmployees: true,
    calculationFrom: 'v0.3',
    inVector: true,
  },
  {
    code: '1060122',
    name: 'Recargo por mora',
    shortName: 'Recargo por mora',
    periodicity: 'eventual',
    dateRule: { kind: 'manual' },
    requiresEmployees: false,
    calculationFrom: 'v0.1',
    inVector: false,
  },
];

export function findTributo(code: string): Tributo | undefined {
  return TRIBUTOS.find((t) => t.code === code);
}

/**
 * Tributos proposed in the onboarding. The user confirms against their own vector.
 * Eventual tributos (0730122, 1060122) are never pre-selected.
 */
export function suggestedTributoCodes(hasEmployees: boolean): string[] {
  return TRIBUTOS.filter(
    (t) => t.inVector && t.periodicity !== 'eventual' && (!t.requiresEmployees || hasEmployees),
  ).map((t) => t.code);
}

export type { OrigenFecha };
