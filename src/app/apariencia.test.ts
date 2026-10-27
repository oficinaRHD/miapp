import { describe, expect, it } from 'vitest';
import { DEFAULT_TEMA, TEMA_CHOICES, dataThemeFor, parseTema } from './apariencia';

describe('parseTema', () => {
  it('accepts the three themes', () => {
    expect(parseTema('auto')).toBe('auto');
    expect(parseTema('light')).toBe('light');
    expect(parseTema('dark')).toBe('dark');
  });
  it('falls back to automatic for anything else', () => {
    expect(parseTema(undefined)).toBe(DEFAULT_TEMA);
    expect(parseTema('azul')).toBe('auto');
    expect(parseTema(3)).toBe('auto');
    expect(parseTema(null)).toBe('auto');
  });
});

describe('dataThemeFor', () => {
  it('removes the attribute in automatic mode', () => {
    expect(dataThemeFor('auto')).toBe(null);
    expect(dataThemeFor('light')).toBe('light');
    expect(dataThemeFor('dark')).toBe('dark');
  });
  it('offers the choices in order', () => {
    expect(TEMA_CHOICES).toEqual(['auto', 'light', 'dark']);
  });
});
