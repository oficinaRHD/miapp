<script lang="ts">
  // Temporary shell for M3 step 2b: wires startup, profile store and onboarding guard.
  // Real views arrive from step 3 on.
  import { onMount } from 'svelte';
  import { es } from './i18n/es';
  import { router, initRouter, navigate } from './app/router.svelte';
  import { resolveRedirect } from './app/guard';
  import { startApp } from './app/bootstrap';
  import { perfilStore, isOnboardingDone, savePerfil, errorMessage } from './stores/perfil.svelte';
  import { suggestedTributoCodes } from './domain/tributos.catalog';

  const links = [
    ['/', 'inicio'],
    ['/onboarding', 'onboarding'],
    ['/calendario', 'calendario'],
    ['/obligaciones/abc', 'obligacion'],
    ['/ajustes/respaldo', 'respaldo'],
    ['/no-existe', '404'],
  ] as const;

  onMount(() => {
    const stop = initRouter();
    void startApp();
    return stop;
  });

  // Redirect once the profile is loaded, and again whenever route or profile change.
  $effect(() => {
    if (!perfilStore.loaded || perfilStore.error) return;
    const to = resolveRedirect(router.route, isOnboardingDone());
    if (to) navigate(to, true);
  });

  async function createTestProfile(): Promise<void> {
    try {
      await savePerfil({
        nombreVisible: es.devProfileName,
        tieneEmpleados: false,
        tributosActivos: [...suggestedTributoCodes(false)],
        onboardingCompleto: true,
      });
    } catch (e) {
      perfilStore.error = errorMessage(e);
    }
  }
</script>

<main>
  <h1>{es.appName}</h1>

  {#if perfilStore.error}
    <p role="alert">{es.loadError}: {perfilStore.error}</p>
  {:else if !perfilStore.loaded}
    <p>{es.loading}</p>
  {:else}
    <p>{es.routeLabel}: <strong>{router.route.name}</strong> <code>{router.route.path}</code></p>
    <p>{es.paramsLabel}: <code>{JSON.stringify(router.route.params)}</code></p>
    <p>{es.profileLabel}: <strong>{perfilStore.perfil?.nombreVisible ?? es.profileNone}</strong></p>

    {#if router.route.name === 'onboarding'}
      <section>
        <h2>{es.devOnboardingTitle}</h2>
        <p>{es.devOnboardingBody}</p>
        <button onclick={createTestProfile}>{es.devCreateProfile}</button>
      </section>
    {/if}

    <nav>
      {#each links as [path, label]}
        <a href={'#' + path}>{label}</a>
      {/each}
    </nav>
  {/if}
</main>

<style>
  main {
    padding: 16px;
  }
  nav {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 0 12px;
    border: 1px solid currentColor;
    border-radius: 8px;
    color: inherit;
    text-decoration: none;
  }
</style>
