// Pure logic of V02 (Inicio): which obligations are overdue, which is next, which come in the next 30 days.
// No fiscal rules here: only dates and states of already generated obligations.
import type { Obligacion } from '../data/models';
import { compareDates } from '../domain/dates';
import type { ISODate } from '../domain/types';

/** Window of the "Próximos 30 días" list (03, V02). */
export const UPCOMING_DAYS = 30;
/** Up to this many days left: red. UI threshold, not a fiscal rule. */
export const URGENT_DAYS = 3;
/** Up to this many days left: yellow. Matches the 7-day notification offset (02, section 5). */
export const SOON_DAYS = 7;

export type Urgency = 'vencida' | 'urgente' | 'pronto' | 'tranquila';

export interface InicioItem {
  obligacion: Obligacion;
  /** Days from today to the due date. Negative when overdue. */
  dias: number;
  urgencia: Urgency;
}

export interface InicioSummary {
  /** Pending, due date before today. Oldest first. */
  overdue: InicioItem[];
  /** First pending obligation due today or later (may be beyond 30 days), or null. */
  next: InicioItem | null;
  /** Pending, due from today up to today + 30 days (inclusive). */
  upcoming: InicioItem[];
}

// Local helper: whole days since 1970-01-01 for a YYYY-MM-DD date (no time zones).
function dayNumber(date: ISODate): number {
  const [y, m, d] = date.split('-').map(Number);
  return Date.UTC(y!, m! - 1, d!) / 86_400_000;
}

/** Days from `today` to `vence` (negative if `vence` is in the past). */
export function daysUntil(today: ISODate, vence: ISODate): number {
  return dayNumber(vence) - dayNumber(today);
}

export function urgencyOf(dias: number): Urgency {
  if (dias < 0) return 'vencida';
  if (dias <= URGENT_DAYS) return 'urgente';
  if (dias <= SOON_DAYS) return 'pronto';
  return 'tranquila';
}

function byDueThenCode(a: InicioItem, b: InicioItem): number {
  return (
    compareDates(a.obligacion.vence, b.obligacion.vence) ||
    a.obligacion.tributoCodigo.localeCompare(b.obligacion.tributoCodigo)
  );
}

/** Builds the Inicio lists. Only `pendiente` obligations count; `today` is injected for testing. */
export function buildInicioSummary(obligaciones: readonly Obligacion[], today: ISODate): InicioSummary {
  const items: InicioItem[] = obligaciones
    .filter((o) => o.estado === 'pendiente')
    .map((o) => {
      const dias = daysUntil(today, o.vence);
      return { obligacion: o, dias, urgencia: urgencyOf(dias) };
    })
    .sort(byDueThenCode);

  const overdue = items.filter((i) => i.dias < 0);
  const future = items.filter((i) => i.dias >= 0);
  return {
    overdue,
    next: future[0] ?? null,
    upcoming: future.filter((i) => i.dias <= UPCOMING_DAYS),
  };
}
