// Pure planning of deadline notices (02, section 5). No Capacitor, no Dexie, no fiscal rules:
// it only decides WHICH notices should exist. A service (next step) schedules them.
import type { Obligacion } from '../data/models';
import { findTributo } from '../domain/tributos.catalog';

/** Key in the `ajustes` table for the notice preferences (V16). */
export const SETTING_AVISOS = 'avisosConfig';

/** Only notices that fall in the next 60 days are scheduled; the plan is recalculated often. */
export const WINDOW_DAYS = 60;
/** Largest "days before" a user can choose (keeps ids inside a 31-bit integer). */
export const MAX_OFFSET_DAYS = 30;

export interface AvisosSettings {
  /** Days before the due date: 0 = same day. */
  offsets: readonly number[];
  hour: number;
  minute: number;
}

/** Defaults from 02: 7, 3 and 1 day before and the same day, at 09:00. */
export const DEFAULT_AVISOS: AvisosSettings = { offsets: [7, 3, 1, 0], hour: 9, minute: 0 };

export interface PlannedNotice {
  /** Integer id for the plugin; deterministic from the obligation and the offset. */
  id: number;
  obligacionId: string;
  offset: number;
  /** Local date-time 'YYYY-MM-DDTHH:mm' (Cuba), no time zone. */
  at: string;
  title: string;
  body: string;
}

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const NOW_RE = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/;

function toUtc(date: string): number | null {
  const m = DATE_RE.exec(date);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const t = Date.UTC(y, mo - 1, d);
  const c = new Date(t);
  if (c.getUTCFullYear() !== y || c.getUTCMonth() !== mo - 1 || c.getUTCDate() !== d) return null;
  return t;
}

function shiftDays(date: string, days: number): string | null {
  const t = toUtc(date);
  if (t === null) return null;
  return new Date(t + days * 86_400_000).toISOString().slice(0, 10);
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** FNV-1a 32-bit hash of a text. */
function fnv1a(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Deterministic notification id: 26 bits of hash of the obligation id times 32 plus the offset
 * (0 to 30). Always between 0 and 2^31 - 1. Two obligations colliding is very unlikely
 * (about 1 in 100,000 for 40 obligations); the service also cancels by `extra.obligacionId`.
 */
export function noticeId(obligacionId: string, offset: number): number {
  if (!Number.isInteger(offset) || offset < 0 || offset > MAX_OFFSET_DAYS) {
    throw new RangeError(`offset out of range: ${offset}`);
  }
  return (fnv1a(obligacionId) & 0x3ffffff) * 32 + offset;
}

export function whenText(offset: number): string {
  if (offset === 0) return 'vence hoy';
  if (offset === 1) return 'vence mañana';
  return `vence en ${offset} días`;
}

/** Stored value to valid settings; anything invalid falls back to the defaults. */
export function parseAvisosSettings(value: unknown): AvisosSettings {
  if (typeof value !== 'object' || value === null) return DEFAULT_AVISOS;
  const v = value as Record<string, unknown>;
  const { offsets, hour, minute } = v;
  if (!Array.isArray(offsets) || offsets.length === 0) return DEFAULT_AVISOS;
  if (!offsets.every((n) => Number.isInteger(n) && n >= 0 && n <= MAX_OFFSET_DAYS)) {
    return DEFAULT_AVISOS;
  }
  if (!Number.isInteger(hour) || (hour as number) < 0 || (hour as number) > 23) return DEFAULT_AVISOS;
  if (!Number.isInteger(minute) || (minute as number) < 0 || (minute as number) > 59) {
    return DEFAULT_AVISOS;
  }
  const unique = [...new Set(offsets as number[])].sort((a, b) => b - a);
  return { offsets: unique, hour: hour as number, minute: minute as number };
}

/**
 * Notices to schedule for the pending obligations.
 * Skipped: obligations that are not pending, already overdue, notices whose time has passed
 * and notices more than WINDOW_DAYS ahead. Sorted by time, then id.
 * @param nowLocal local date-time 'YYYY-MM-DDTHH:mm' (Cuba)
 */
export function planNotices(
  obligaciones: readonly Obligacion[],
  nowLocal: string,
  settings: AvisosSettings = DEFAULT_AVISOS,
): PlannedNotice[] {
  const m = NOW_RE.exec(nowLocal);
  const today = m?.[1];
  if (!m || !today || toUtc(today) === null) throw new RangeError(`invalid nowLocal: ${nowLocal}`);
  const windowEnd = shiftDays(today, WINDOW_DAYS) as string;
  const time = `${pad(settings.hour)}:${pad(settings.minute)}`;
  const nowKey = `${today}T${m[2]}:${m[3]}`;

  const out: PlannedNotice[] = [];
  for (const o of obligaciones) {
    if (o.estado !== 'pendiente' || o.vence < today) continue;
    const title = findTributo(o.tributoCodigo)?.shortName ?? o.tributoCodigo;
    for (const offset of new Set(settings.offsets)) {
      const day = shiftDays(o.vence, -offset);
      if (day === null || day < today || day > windowEnd) continue;
      const at = `${day}T${time}`;
      if (at <= nowKey) continue;
      out.push({
        id: noticeId(o.id, offset),
        obligacionId: o.id,
        offset,
        at,
        title,
        body: `${o.periodoEtiqueta}: ${whenText(offset)}.`,
      });
    }
  }
  return out.sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : a.id - b.id));
}
