// Theme setting: reads and writes `ajustes`, applies it to <html> and to the phone's bars.
import { db } from '../data';
import { ajustesRepo } from '../data/repositories/ajustes';
import {
  SETTING_TEMA,
  dataThemeFor,
  isDarkTheme,
  parseTema,
  type Tema,
} from '../app/apariencia';
import { setSystemBarsDark } from '../services/systemBars';

const repo = ajustesRepo(db);

export async function loadTema(): Promise<Tema> {
  return parseTema(await repo.get<unknown>(SETTING_TEMA, undefined));
}

export async function saveTema(tema: Tema): Promise<void> {
  await repo.set(SETTING_TEMA, tema);
}

function systemPrefersDark(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches;
}

let current: Tema = 'auto';

/** Sets or removes <html data-theme> and matches the status bar icons to the app. */
export function applyTema(tema: Tema): void {
  current = tema;
  const value = dataThemeFor(tema);
  const root = document.documentElement;
  if (value === null) root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', value);
  void setSystemBarsDark(isDarkTheme(tema, systemPrefersDark()));
}

let listening = false;

/** Loads the stored theme, applies it and follows the phone's mode changes. Never throws. */
export async function initTema(): Promise<void> {
  try {
    applyTema(await loadTema());
  } catch {
    // Keep the automatic theme.
  }
  if (!listening && typeof matchMedia === 'function') {
    listening = true;
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => applyTema(current));
  }
}
