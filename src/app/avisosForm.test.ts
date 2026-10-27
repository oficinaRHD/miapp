import { describe, expect, it } from 'vitest';
import { DEFAULT_AVISOS } from './avisos';
import {
  OFFSET_CHOICES,
  draftFromSettings,
  hasChanges,
  parseTime,
  setTime,
  timeText,
  toSettings,
  toggleOffset,
  validateDraft,
} from './avisosForm';

describe('parseTime and timeText', () => {
  it('reads valid times', () => {
    expect(parseTime('09:00')).toEqual({ hour: 9, minute: 0 });
    expect(parseTime('23:59')).toEqual({ hour: 23, minute: 59 });
    expect(timeText(8, 5)).toBe('08:05');
  });
  it('rejects invalid times', () => {
    expect(parseTime('')).toBe(null);
    expect(parseTime('24:00')).toBe(null);
    expect(parseTime('09:60')).toBe(null);
    expect(parseTime('9:00')).toBe(null);
  });
});

describe('draftFromSettings', () => {
  it('turns the defaults into the four choices at 09:00', () => {
    expect(OFFSET_CHOICES).toEqual([7, 3, 1, 0]);
    expect(draftFromSettings(DEFAULT_AVISOS)).toEqual({ offsets: [7, 3, 1, 0], time: '09:00' });
  });
  it('keeps only the offsets the form offers', () => {
    expect(draftFromSettings({ offsets: [2], hour: 8, minute: 30 })).toEqual({ offsets: [], time: '08:30' });
  });
});

describe('toggleOffset', () => {
  it('removes and adds keeping the order', () => {
    const draft = draftFromSettings(DEFAULT_AVISOS);
    const without3 = toggleOffset(draft, 3);
    expect(without3.offsets).toEqual([7, 1, 0]);
    expect(toggleOffset(without3, 3).offsets).toEqual([7, 3, 1, 0]);
  });
});

describe('validateDraft and toSettings', () => {
  it('needs at least one notice and a valid time', () => {
    const ok = draftFromSettings(DEFAULT_AVISOS);
    expect(validateDraft(ok)).toBe(null);
    expect(validateDraft({ ...ok, offsets: [] })).toBe('offsets');
    expect(validateDraft(setTime(ok, ''))).toBe('time');
  });
  it('builds the settings from a valid draft', () => {
    const draft = setTime(toggleOffset(draftFromSettings(DEFAULT_AVISOS), 7), '08:30');
    expect(toSettings(draft)).toEqual({ offsets: [3, 1, 0], hour: 8, minute: 30 });
  });
  it('throws on an invalid draft', () => {
    expect(() => toSettings({ offsets: [], time: '09:00' })).toThrow();
    expect(() => toSettings({ offsets: [1], time: 'xx' })).toThrow();
  });
});

describe('hasChanges', () => {
  it('detects a change of days or hour only', () => {
    const draft = draftFromSettings(DEFAULT_AVISOS);
    expect(hasChanges(draft, DEFAULT_AVISOS)).toBe(false);
    expect(hasChanges(toggleOffset(draft, 1), DEFAULT_AVISOS)).toBe(true);
    expect(hasChanges(setTime(draft, '10:00'), DEFAULT_AVISOS)).toBe(true);
  });
});
