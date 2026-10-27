// Theme setting: reads and writes `ajustes` and applies it to <html>.
import { db } from '../data';
import { ajustesRepo } from '../data/repositories/ajustes';
import { SETTING_TEMA, dataThemeFor, parseTema, type Tema } from '../app/apariencia';

const repo = ajustesRepo(db);

export async function loadTema(): Promise<Tema> {
  return parseTema(await repo.get<unknown>(SETTING_TEMA, undefined));
}

export async function saveTema(tema: Tema): Promise<void> {
  await repo.set(SETTING_TEMA, tema);
}

/** Sets or removes <html data-theme>. Safe to call repeatedly. */
export function applyTema(tema: Tema): void {
  const value = dataThemeFor(tema);
  const root = document.documentElement;
  if (value === null) root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', value);
}

/** Loads the stored theme and applies it. Never throws: on failure the phone's theme stays. */
export async function initTema(): Promise<void> {
  try {
    applyTema(await loadTema());
  } catch {
    // Keep the automatic theme.
  }
}
