import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TEMA,
  TEMA_CHOICES,
  barsStyleFor,
  dataThemeFor,
  isDarkTheme,
  parseTema,
} from './apariencia';

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

describe('isDarkTheme and barsStyleFor', () => {
  it('follows the phone only in automatic mode', () => {
    expect(isDarkTheme('auto', true)).toBe(true);
    expect(isDarkTheme('auto', false)).toBe(false);
    expect(isDarkTheme('light', true)).toBe(false);
    expect(isDarkTheme('dark', false)).toBe(true);
  });
  it('asks light icons for a dark app and dark icons for a light app', () => {
    expect(barsStyleFor(true)).toBe('DARK');
    expect(barsStyleFor(false)).toBe('LIGHT');
  });
});
