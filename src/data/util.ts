import type { ISODate, ISODateTime } from './models';

export function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Non-negative safe integer (money in centavos, sizes). */
export function isNonNegativeInt(v: unknown): v is number {
  return typeof v === 'number' && Number.isSafeInteger(v) && v >= 0;
}

/** 'YYYY-MM-DD' that exists in the calendar (no time zone involved). */
export function isISODate(v: unknown): v is ISODate {
  if (typeof v !== 'string') return false;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!m) return false;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

/** '2026-10-20T08:36:00-04:00' (also accepts 'Z' and fractional seconds). */
export function isISODateTime(v: unknown): v is ISODateTime {
  if (typeof v !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/.test(v)) return false;
  return !Number.isNaN(Date.parse(v));
}

/** Local time with the device offset, e.g. '2026-10-20T08:36:00-04:00'. */
export function nowISO(date: Date = new Date()): ISODateTime {
  const p = (n: number, w = 2): string => String(n).padStart(w, '0');
  const offsetMin = -date.getTimezoneOffset();
  const sign = offsetMin >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMin);
  return (
    `${p(date.getFullYear(), 4)}-${p(date.getMonth() + 1)}-${p(date.getDate())}` +
    `T${p(date.getHours())}:${p(date.getMinutes())}:${p(date.getSeconds())}` +
    `${sign}${p(Math.floor(abs / 60))}:${p(abs % 60)}`
  );
}

/** Local calendar date, 'YYYY-MM-DD'. */
export function todayISO(date: Date = new Date()): ISODate {
  return nowISO(date).slice(0, 10);
}

/** crypto.randomUUID() with a fallback for non-secure contexts. */
export function newId(): string {
  const c = globalThis.crypto;
  if (typeof c.randomUUID === 'function') return c.randomUUID();
  const b = new Uint8Array(16);
  c.getRandomValues(b);
  b[6] = ((b[6] ?? 0) & 0x0f) | 0x40;
  b[8] = ((b[8] ?? 0) & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** '2026-10-22-1657' from an ISO date-time (device-local digits). */
export function backupStamp(iso: ISODateTime): string {
  return `${iso.slice(0, 10)}-${iso.slice(11, 13)}${iso.slice(14, 16)}`;
}

export function backupFileName(iso: ISODateTime): string {
  return `asistente-tcp-respaldo-${backupStamp(iso)}.json`;
}
