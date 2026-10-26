import type { Categoria, MetodoPago, Movimiento, TipoMovimiento } from '../data/models';
import type { MovimientoInput } from '../data/repositories/movimientos';
import { isValidISODate } from '../domain/dates';
import type { Centavos, ISODate } from '../domain/types';

/* ------------------------------------------------------------------ */
/* Amount text -> centavos                                             */
/* ------------------------------------------------------------------ */

const GROUPED = /^\d{1,3}([.,]\d{3})+$/;

/**
 * Parses what a person types into an amount field, as integer centavos.
 * Accepts '1250.50', '1,250.50', '1.250,50', '12,5', '1 250', '1,250' (thousands).
 * A single separator followed by exactly 3 digits is read as thousands ('1.234' = 1,234.00).
 * Returns null when empty, malformed, or with more than 2 decimals.
 */
export function amountFromText(text: string): Centavos | null {
  const t = text.trim().replace(/\s+/g, '');
  if (t === '' || !/^[0-9.,]+$/.test(t)) return null;

  const lastDot = t.lastIndexOf('.');
  const lastComma = t.lastIndexOf(',');
  let decSep = '';
  if (lastDot >= 0 && lastComma >= 0) {
    decSep = lastDot > lastComma ? '.' : ',';
  } else {
    const sep = lastDot >= 0 ? '.' : lastComma >= 0 ? ',' : '';
    if (sep) {
      const count = t.split(sep).length - 1;
      const tail = t.length - t.lastIndexOf(sep) - 1;
      if (count === 1 && tail !== 3) decSep = sep;
    }
  }

  let left = t;
  let right = '';
  if (decSep) {
    const at = t.lastIndexOf(decSep);
    left = t.slice(0, at);
    right = t.slice(at + 1);
  }
  if (right.length > 2 || !/^\d*$/.test(right)) return null;
  if (left !== '' && !/^\d+$/.test(left) && !GROUPED.test(left)) return null;
  if (left === '' && right === '') return null;

  const whole = Number(left.replace(/[.,]/g, '') || '0');
  const cents = Number(right.padEnd(2, '0'));
  const total = whole * 100 + cents;
  return Number.isSafeInteger(total) ? total : null;
}

/** Centavos to the plain text of an input field: 125050 -> '1250.50'; 125000 -> '1250'. */
export function amountToText(c: Centavos): string {
  const whole = Math.trunc(c / 100);
  const cents = c % 100;
  return cents === 0 ? String(whole) : `${whole}.${String(cents).padStart(2, '0')}`;
}

/* ------------------------------------------------------------------ */
/* Form draft (V07)                                                    */
/* ------------------------------------------------------------------ */

export interface MovimientoDraft {
  tipo: TipoMovimiento;
  montoText: string;
  fecha: string;
  categoriaId: string;
  descripcion: string;
  contraparte: string;
  metodo: MetodoPago;
  cuentaParaVentas: boolean;
  justificado: boolean;
}

export function newDraft(tipo: TipoMovimiento, hoy: ISODate): MovimientoDraft {
  return {
    tipo,
    montoText: '',
    fecha: hoy,
    categoriaId: '',
    descripcion: '',
    contraparte: '',
    metodo: 'efectivo',
    cuentaParaVentas: tipo === 'ingreso',
    justificado: false,
  };
}

export function draftFromMovimiento(m: Movimiento): MovimientoDraft {
  return {
    tipo: m.tipo,
    montoText: amountToText(m.monto),
    fecha: m.fecha,
    categoriaId: m.categoriaId,
    descripcion: m.descripcion ?? '',
    contraparte: m.contraparte ?? '',
    metodo: m.metodo,
    cuentaParaVentas: m.cuentaParaVentas,
    justificado: m.justificado,
  };
}

/**
 * Switches income/expense. The category is cleared if it belongs to the other type,
 * and "counts for sales tax" returns to its default for the new type.
 */
export function setTipo(
  d: MovimientoDraft,
  tipo: TipoMovimiento,
  categorias: readonly Categoria[],
): MovimientoDraft {
  if (d.tipo === tipo) return d;
  const cat = categorias.find((c) => c.id === d.categoriaId);
  return {
    ...d,
    tipo,
    categoriaId: cat && cat.tipo === tipo ? d.categoriaId : '',
    cuentaParaVentas: tipo === 'ingreso',
  };
}

export type DraftError = 'amount' | 'date' | 'category' | 'category-type';

/** Empty list = valid. Amount must be greater than 0 (03, V07). */
export function validateDraft(d: MovimientoDraft, categorias: readonly Categoria[]): DraftError[] {
  const errors: DraftError[] = [];
  const amount = amountFromText(d.montoText);
  if (amount === null || amount <= 0) errors.push('amount');
  if (!isValidISODate(d.fecha)) errors.push('date');
  if (d.categoriaId === '') {
    errors.push('category');
  } else {
    const cat = categorias.find((c) => c.id === d.categoriaId);
    if (!cat) errors.push('category');
    else if (cat.tipo !== d.tipo) errors.push('category-type');
  }
  return errors;
}

export function canSave(d: MovimientoDraft, categorias: readonly Categoria[]): boolean {
  return validateDraft(d, categorias).length === 0;
}

/**
 * Draft to the repository input. Call only when `canSave` is true (throws otherwise).
 * Empty optional texts are omitted. Expenses never count for sales tax;
 * income is never "justified" (that flag is for the 80 % expense rule).
 */
export function toMovimientoInput(d: MovimientoDraft): MovimientoInput {
  const monto = amountFromText(d.montoText);
  if (monto === null || monto <= 0) throw new Error('invalid-amount');
  const descripcion = d.descripcion.trim();
  const contraparte = d.contraparte.trim();
  return {
    fecha: d.fecha,
    tipo: d.tipo,
    monto,
    categoriaId: d.categoriaId,
    metodo: d.metodo,
    cuentaParaVentas: d.tipo === 'ingreso' ? d.cuentaParaVentas : false,
    justificado: d.tipo === 'gasto' ? d.justificado : false,
    ...(descripcion ? { descripcion } : {}),
    ...(contraparte ? { contraparte } : {}),
  };
}

/** True if any field differs from the draft built from the saved record. */
export function hasChanges(d: MovimientoDraft, saved: Movimiento): boolean {
  const base = draftFromMovimiento(saved);
  return (Object.keys(base) as (keyof MovimientoDraft)[]).some((k) => base[k] !== d[k]);
}

/* ------------------------------------------------------------------ */
/* List and totals (V06, V02, V08)                                     */
/* ------------------------------------------------------------------ */

export type TipoFilter = 'todos' | TipoMovimiento;

export interface MonthTotals {
  ingresos: Centavos;
  gastos: Centavos;
  /** Income minus expenses; can be negative. */
  neto: number;
  /** Income marked "counts for sales tax" (basis for 0114022 and 0510122 in V08). */
  ventas: Centavos;
  /** Expenses with a receipt. */
  gastosJustificados: Centavos;
  count: number;
}

export function monthTotals(movs: readonly Movimiento[]): MonthTotals {
  let ingresos = 0;
  let gastos = 0;
  let ventas = 0;
  let gastosJustificados = 0;
  for (const m of movs) {
    if (m.tipo === 'ingreso') {
      ingresos += m.monto;
      if (m.cuentaParaVentas) ventas += m.monto;
    } else {
      gastos += m.monto;
      if (m.justificado) gastosJustificados += m.monto;
    }
  }
  return { ingresos, gastos, neto: ingresos - gastos, ventas, gastosJustificados, count: movs.length };
}

export function filterByTipo(movs: readonly Movimiento[], f: TipoFilter): Movimiento[] {
  return f === 'todos' ? [...movs] : movs.filter((m) => m.tipo === f);
}

/** Newest first: by date, then by creation time. */
export function sortForList(movs: readonly Movimiento[]): Movimiento[] {
  return [...movs].sort(
    (a, b) => b.fecha.localeCompare(a.fecha) || b.creadoEn.localeCompare(a.creadoEn),
  );
}

export interface DayGroup {
  fecha: ISODate;
  items: Movimiento[];
  ingresos: Centavos;
  gastos: Centavos;
}

/** Groups by day, newest day first, items newest first. */
export function groupByDay(movs: readonly Movimiento[]): DayGroup[] {
  const groups = new Map<ISODate, DayGroup>();
  for (const m of sortForList(movs)) {
    let g = groups.get(m.fecha);
    if (!g) {
      g = { fecha: m.fecha, items: [], ingresos: 0, gastos: 0 };
      groups.set(m.fecha, g);
    }
    g.items.push(m);
    if (m.tipo === 'ingreso') g.ingresos += m.monto;
    else g.gastos += m.monto;
  }
  return [...groups.values()];
}

/** 'YYYY-MM' of a 'YYYY-MM-DD' date. */
export function monthKeyOf(fecha: ISODate): string {
  return fecha.slice(0, 7);
}

export function isMonthKey(s: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(s);
}

/** Category name for a row; falls back to the id if the category was removed. */
export function categoryName(id: string, categorias: readonly Categoria[]): string {
  return categorias.find((c) => c.id === id)?.nombre ?? id;
}
