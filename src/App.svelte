<script lang="ts">
  // Temporary shell: wires startup, profile store, onboarding guard and the V01 and V17 views.
  // The remaining views arrive in later steps.
  import { onMount } from 'svelte';
  import { es } from './i18n/es';
  import { router, initRouter, navigate } from './app/router.svelte';
  import { resolveRedirect } from './app/guard';
  import { startApp } from './app/bootstrap';
  import { perfilStore, isOnboardingDone } from './stores/perfil.svelte';
  import Onboarding from './views/onboarding/Onboarding.svelte';
  import Perfil from './views/perfil/Perfil.svelte';

  const links = [
    ['/', 'inicio'],
    ['/onboarding', 'onboarding'],
    ['/calendario', 'calendario'],
    ['/obligaciones/abc', 'obligacion'],
    ['/ajustes/perfil', 'perfil'],
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
</script>

<main>
  <h1>{es.appName}</h1>

  {#if perfilStore.error}
    <p role="alert">{es.loadError}: {perfilStore.error}</p>
  {:else if !perfilStore.loaded}
    <p>{es.loading}</p>
  {:else}
    {#if router.route.name === 'onboarding'}
      <Onboarding />
    {:else if router.route.name === 'perfil' && perfilStore.perfil}
      <Perfil perfil={perfilStore.perfil} />
    {:else}
      <p>{es.routeLabel}: <strong>{router.route.name}</strong> <code>{router.route.path}</code></p>
      <p>{es.paramsLabel}: <code>{JSON.stringify(router.route.params)}</code></p>
      <p>{es.profileLabel}: <strong>{perfilStore.perfil?.nombreVisible ?? es.profileNone}</strong></p>
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
    margin-top: 16px;
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
