<script lang="ts">
  // Temporary shell for M3 step 1: shows the current route.
  // Real views and i18n texts arrive in the next steps.
  import { onMount } from 'svelte';
  import { router, initRouter } from './app/router.svelte';

  const links = [
    ['/', 'inicio'],
    ['/onboarding', 'onboarding'],
    ['/calendario', 'calendario'],
    ['/obligaciones/abc', 'obligacion'],
    ['/registro/nuevo', 'registro nuevo'],
    ['/ajustes/perfil', 'perfil'],
    ['/no-existe', '404'],
  ] as const;

  onMount(() => initRouter());
</script>

<main>
  <h1>Asistente TCP</h1>
  <p>Ruta: <strong>{router.route.name}</strong> <code>{router.route.path}</code></p>
  <p>Parámetros: <code>{JSON.stringify(router.route.params)}</code></p>
  <nav>
    {#each links as [path, label]}
      <a href={'#' + path}>{label}</a>
    {/each}
  </nav>
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
