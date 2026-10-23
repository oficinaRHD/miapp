// App startup: seed categories, then load the profile.
import { db, ensureSeed } from '../data';
import { errorMessage, loadPerfil, perfilStore } from '../stores/perfil.svelte';

export async function startApp(): Promise<void> {
  try {
    await ensureSeed(db);
  } catch (e) {
    perfilStore.error = errorMessage(e);
    perfilStore.loaded = true;
    return;
  }
  await loadPerfil();
}
