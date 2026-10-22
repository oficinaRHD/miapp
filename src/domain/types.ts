// Shared primitive types for the domain layer. No imports from UI, Dexie or Capacitor.

/** Date as text 'YYYY-MM-DD' (local Cuba date, no time, no time zone). */
export type ISODate = string;

/** Money as an integer amount of centavos of CUP (125050 = 1,250.50). */
export type Centavos = number;

export type PeriodoTipo = 'mensual' | 'trimestral' | 'anual' | 'eventual';

export type OrigenFecha = 'vector' | 'calculada' | 'manual';
