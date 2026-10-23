// Reactive profile state. Data access goes through the profile repository only.
import { db } from '../data';
import type { Perfil } from '../data/models';
import { perfilRepo, type PerfilInput } from '../data/repositories/perfil';

interface PerfilState {
  perfil: Perfil | undefined;
  loaded: boolean;
  error: string | null;
}

export const perfilStore = $state<PerfilState>({
  perfil: undefined,
  loaded: false,
  error: null,
});

const repo = perfilRepo(db);

export function isOnboardingDone(): boolean {
  return perfilStore.perfil?.onboardingCompleto === true;
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

/** Reads the profile from the database into the store. */
export async function loadPerfil(): Promise<void> {
  try {
    perfilStore.perfil = await repo.get();
    perfilStore.error = null;
  } catch (e) {
    perfilStore.error = errorMessage(e);
  } finally {
    perfilStore.loaded = true;
  }
}

/** Creates or replaces the profile and updates the store. */
export async function savePerfil(input: PerfilInput): Promise<void> {
  perfilStore.perfil = await repo.save(input);
}

/** Merges fields into the existing profile and updates the store. */
export async function patchPerfil(changes: Partial<PerfilInput>): Promise<void> {
  perfilStore.perfil = await repo.patch(changes);
}
