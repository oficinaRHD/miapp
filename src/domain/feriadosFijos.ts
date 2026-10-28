// Fixed-date Cuban holidays, as listed by the user on 27/10/2026.
// SOURCE: indicated by the user, NOT yet contrasted with an official publication (01, section 7, item 3).
// It may be incomplete: the user can edit the list in V14 "Feriados". Do not extend it without a source.

export interface FeriadoFijo {
  month: number; // 1-12
  day: number;
  nombre: string;
}

export const FERIADOS_FIJOS: readonly FeriadoFijo[] = [
  { month: 1, day: 1, nombre: 'Aniversario del Triunfo de la Revolución Cubana' },
  { month: 5, day: 1, nombre: 'Día Internacional de los Trabajadores' },
  { month: 7, day: 26, nombre: 'Día de la Rebeldía Nacional' },
  { month: 10, day: 10, nombre: 'Aniversario del inicio de las Guerras de Independencia' },
];

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** The fixed holidays of a year as { fecha: 'YYYY-MM-DD', nombre }, ordered by date. */
export function feriadosFijosDe(year: number): { fecha: string; nombre: string }[] {
  if (!Number.isInteger(year) || year < 1900 || year > 2200) {
    throw new RangeError(`Invalid year: ${year}`);
  }
  return FERIADOS_FIJOS.map((f) => ({ fecha: `${year}-${pad(f.month)}-${pad(f.day)}`, nombre: f.nombre })).sort(
    (a, b) => (a.fecha < b.fecha ? -1 : 1),
  );
}
