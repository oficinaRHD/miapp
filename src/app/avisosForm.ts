// Pure logic for the notice preferences form in V16. No Svelte, Dexie or Capacitor; no fiscal rules.
import type { AvisosSettings } from './avisos';

/** Days before the due date the user can pick (0 = the same day), from 03, V16. */
export const OFFSET_CHOICES = [7, 3, 1, 0] as const;

export interface AvisosDraft {
  /** Selected days before, sorted from the largest to the smallest. */
  offsets: number[];
  /** 'HH:mm', the value of an <input type="time">. */
  time: string;
}

export type AvisosFormError = 'offsets' | 'time';

const TIME_RE = /^(\d{2}):(\d{2})$/;

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function timeText(hour: number, minute: number): string {
  return `${pad(hour)}:${pad(minute)}`;
}

export function parseTime(text: string): { hour: number; minute: number } | null {
  const m = TIME_RE.exec(text.trim());
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  return hour <= 23 && minute <= 59 ? { hour, minute } : null;
}

/** Only the offsets the form offers are kept. */
export function draftFromSettings(settings: AvisosSettings): AvisosDraft {
  return {
    offsets: OFFSET_CHOICES.filter((o) => settings.offsets.includes(o)),
    time: timeText(settings.hour, settings.minute),
  };
}

export function toggleOffset(draft: AvisosDraft, offset: number): AvisosDraft {
  const next = draft.offsets.includes(offset)
    ? draft.offsets.filter((o) => o !== offset)
    : [...draft.offsets, offset];
  return { ...draft, offsets: OFFSET_CHOICES.filter((o) => next.includes(o)) };
}

export function setTime(draft: AvisosDraft, time: string): AvisosDraft {
  return { ...draft, time };
}

export function validateDraft(draft: AvisosDraft): AvisosFormError | null {
  if (draft.offsets.length === 0) return 'offsets';
  if (parseTime(draft.time) === null) return 'time';
  return null;
}

/** Valid draft to settings. Throws if the draft is not valid (check `validateDraft` first). */
export function toSettings(draft: AvisosDraft): AvisosSettings {
  const error = validateDraft(draft);
  if (error !== null) throw new RangeError(`invalid notice preferences: ${error}`);
  const time = parseTime(draft.time) as { hour: number; minute: number };
  return { offsets: [...draft.offsets], hour: time.hour, minute: time.minute };
}

export function hasChanges(draft: AvisosDraft, saved: AvisosSettings): boolean {
  const base = draftFromSettings(saved);
  return (
    draft.time !== base.time ||
    draft.offsets.length !== base.offsets.length ||
    draft.offsets.some((o, i) => o !== base.offsets[i])
  );
}
