// Pure logic of the holiday list (V14 "Feriados"). No DOM, no data access, no fiscal rules.
// The list is typed by the user: the official calendar is pending (01, section 7, item 3).

export interface FeriadoItem {
  fecha: string; // 'YYYY-MM-DD'
  nombre: string;
}

export type FeriadoError = 'fecha' | 'nombre' | 'duplicada';

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

/** True for a real calendar date written as YYYY-MM-DD. */
export function isValidISODate(value: string): boolean {
  const m = ISO.exec(value);
  if (!m) return false;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const c = new Date(Date.UTC(y, mo - 1, d));
  return c.getUTCFullYear() === y && c.getUTCMonth() === mo - 1 && c.getUTCDate() === d;
}

export function validateFeriado(
  input: { fecha: string; nombre: string },
  existing: readonly FeriadoItem[],
): FeriadoError | null {
  if (!isValidISODate(input.fecha)) return 'fecha';
  if (input.nombre.trim() === '') return 'nombre';
  if (existing.some((f) => f.fecha === input.fecha)) return 'duplicada';
  return null;
}

function byDate(a: FeriadoItem, b: FeriadoItem): number {
  return a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0;
}

/** New list with the holiday added (name trimmed), sorted by date. Throws if it is not valid. */
export function addFeriado(
  list: readonly FeriadoItem[],
  input: { fecha: string; nombre: string },
): FeriadoItem[] {
  const error = validateFeriado(input, list);
  if (error) throw new RangeError(`invalid holiday: ${error}`);
  return [...list, { fecha: input.fecha, nombre: input.nombre.trim() }].sort(byDate);
}

/** New list without the holiday of that date (unchanged if there is none). */
export function removeFeriado(list: readonly FeriadoItem[], fecha: string): FeriadoItem[] {
  return list.filter((f) => f.fecha !== fecha);
}

/** Groups by year, years and dates ascending. */
export function groupByYear(list: readonly FeriadoItem[]): { year: number; items: FeriadoItem[] }[] {
  const sorted = [...list].sort(byDate);
  const groups: { year: number; items: FeriadoItem[] }[] = [];
  for (const item of sorted) {
    const year = Number(item.fecha.slice(0, 4));
    const last = groups[groups.length - 1];
    if (last && last.year === year) last.items.push(item);
    else groups.push({ year, items: [item] });
  }
  return groups;
}

/** 'YYYY-MM-DD' to '27 oct 2026' (fixed Spanish months, no Intl and no time zone). */
export function feriadoDateText(fecha: string): string {
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const m = ISO.exec(fecha);
  if (!m) return fecha;
  return `${Number(m[3])} ${meses[Number(m[2]) - 1]} ${m[1]}`;
}

/** Adds the items whose date is not in the list yet. Returns the new list and how many were added. */
export function mergeFeriados(
  list: readonly FeriadoItem[],
  additions: readonly FeriadoItem[],
): { list: FeriadoItem[]; added: number } {
  const known = new Set(list.map((f) => f.fecha));
  const fresh = additions.filter((f) => !known.has(f.fecha));
  return { list: [...list, ...fresh].sort(byDate), added: fresh.length };
}
