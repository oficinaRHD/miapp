// Pure logic of the theme setting (V14 "Apariencia"). No DOM, no data access.

export type Tema = 'auto' | 'light' | 'dark';

export const SETTING_TEMA = 'tema';
export const TEMA_CHOICES: readonly Tema[] = ['auto', 'light', 'dark'];
export const DEFAULT_TEMA: Tema = 'auto';

/** Stored value to theme; anything unknown falls back to automatic. */
export function parseTema(value: unknown): Tema {
  return value === 'light' || value === 'dark' || value === 'auto' ? value : DEFAULT_TEMA;
}

/** Value of <html data-theme>: null removes the attribute and the phone decides. */
export function dataThemeFor(tema: Tema): 'light' | 'dark' | null {
  return tema === 'auto' ? null : tema;
}
