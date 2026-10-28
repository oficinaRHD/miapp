<script lang="ts">
  // Temporary shell: wires startup, profile store, onboarding guard, notices and the V01 to V05, V07, V14, V15, V16 and V17 views.
  // A view that throws shows its error on screen (boundary) instead of freezing the app.
  // The remaining views arrive in later steps.
  import { onMount } from 'svelte';
  import { es } from './i18n/es';
  import { router, initRouter, navigate } from './app/router.svelte';
  import { resolveRedirect } from './app/guard';
  import { startApp } from './app/bootstrap';
  import { registroRoute, tipoFromHash } from './app/registroRoutes';
  import { onAppResume } from './services/appLifecycle';
  import { onNoticeTapped } from './services/notifications';
  import { rescheduleNotices } from './stores/avisos';
  import { perfilStore, isOnboardingDone } from './stores/perfil.svelte';
  import Calendario from './views/calendario/Calendario.svelte';
  import ObligacionDetalle from './views/obligaciones/ObligacionDetalle.svelte';
  import Obligaciones from './views/obligaciones/Obligaciones.svelte';
  import Onboarding from './views/onboarding/Onboarding.svelte';
  import Inicio from './views/inicio/Inicio.svelte';
  import Perfil from './views/perfil/Perfil.svelte';
  import Movimiento from './views/registro/Movimiento.svelte';
  import Registro from './views/registro/Registro.svelte';
  import Calculadora from './views/calculadora/Calculadora.svelte';
  import Respaldo from './views/respaldo/Respaldo.svelte';
  import Notificaciones from './views/notificaciones/Notificaciones.svelte';
  import Ajustes from './views/ajustes/Ajustes.svelte';
  import Acerca from './views/ajustes/Acerca.svelte';
  import Apariencia from './views/ajustes/Apariencia.svelte';
  import Feriados from './views/ajustes/Feriados.svelte';
  import { initTema } from './stores/tema';
  import { refreshHolidays } from './stores/holidays.svelte';
  import Menu from './views/shell/Menu.svelte';
  import { esNav } from './i18n/nav';
  import { showMenu } from './app/nav';

  // Registro paths are read from the path itself, so this does not depend on route names.
  const registro = $derived(registroRoute(router.route.path));

  onMount(() => {
    const stop = initRouter();
    void startApp();
    void initTema();
    void refreshHolidays();
    // Back in the foreground: recalculate the notices. A tap on a notice opens its view (obligation or reminder route).
    const stopResume = onAppResume(() => {
      if (isOnboardingDone()) void rescheduleNotices();
    });
    const stopTap = onNoticeTapped((ruta) => navigate(ruta));
    return () => {
      stop();
      stopResume();
      stopTap();
    };
  });

  // Redirect once the profile is loaded, and again whenever route or profile change.
  $effect(() => {
    if (!perfilStore.loaded || perfilStore.error) return;
    const to = resolveRedirect(router.route, isOnboardingDone());
    if (to) navigate(to, true);
  });

  // Schedule the notices once, as soon as the onboarding is done (at startup or right after it).
  let noticesStarted = false;
  $effect(() => {
    if (noticesStarted || !perfilStore.loaded || perfilStore.error || !isOnboardingDone()) return;
    noticesStarted = true;
    void rescheduleNotices();
  });
</script>

<div class="shell">
  <header class="appbar">
    <span class="brand">{esNav.appName}</span>
    {#if perfilStore.loaded && !perfilStore.error && showMenu(isOnboardingDone())}
      <Menu />
    {/if}
  </header>
  <!-- Opaque strip under the phone's navigation bar: content never shows through its icons. -->
  <div class="bottom-cover" aria-hidden="true"></div>
<main>
  {#if perfilStore.error}
    <h1>{es.appName}</h1>
    <p role="alert">{es.loadError}: {perfilStore.error}</p>
  {:else if !perfilStore.loaded}
    <h1>{es.appName}</h1>
    <p>{es.loading}</p>
  {:else}
    {#key router.route.path}
    <svelte:boundary>
      {#if router.route.name === 'onboarding'}
        <h1>{es.appName}</h1>
        <Onboarding />
      {:else if router.route.path === '/ajustes'}
        <Ajustes />
      {:else if router.route.path === '/ajustes/feriados'}
        <Feriados />
      {:else if router.route.path === '/ajustes/apariencia'}
        <Apariencia />
      {:else if router.route.path === '/ajustes/acerca'}
        <Acerca />
      {:else if router.route.path === '/ajustes/respaldo'}
        <Respaldo />
      {:else if router.route.path === '/ajustes/notificaciones'}
        <Notificaciones />
      {:else if router.route.name === 'inicio' && perfilStore.perfil}
        <Inicio perfil={perfilStore.perfil} />
      {:else if router.route.name === 'calendario'}
        <Calendario />
      {:else if router.route.name === 'obligaciones'}
        <Obligaciones />
      {:else if router.route.name === 'obligacion'}
        <ObligacionDetalle />
      {:else if router.route.path === '/calculadora'}
        <Calculadora />
      {:else if registro?.kind === 'list'}
        <Registro />
      {:else if registro?.kind === 'new'}
        {#key router.route.path}
          <Movimiento tipo={tipoFromHash(window.location.hash)} />
        {/key}
      {:else if registro?.kind === 'edit'}
        {#key registro.id}
          <Movimiento id={registro.id} />
        {/key}
      {:else if router.route.name === 'perfil' && perfilStore.perfil}
        <h1>{es.appName}</h1>
        <Perfil perfil={perfilStore.perfil} />
      {:else}
        <h1>{es.appName}</h1>
        <p>{es.routeLabel}: <strong>{router.route.name}</strong> <code>{router.route.path}</code></p>
        <p>{es.paramsLabel}: <code>{JSON.stringify(router.route.params)}</code></p>
        <p>{es.profileLabel}: <strong>{perfilStore.perfil?.nombreVisible ?? es.profileNone}</strong></p>
      {/if}
      {#snippet failed(error)}
        <h1>{es.appName}</h1>
        <p role="alert">Error en la pantalla: {error instanceof Error ? error.message : String(error)}</p>
      {/snippet}
    </svelte:boundary>
    {/key}

  {/if}
</main>
</div>

<style>
  .shell {
    min-height: 100dvh;
    padding: 0 var(--sar) 0 var(--sal);
    box-sizing: border-box;
  }
  .appbar {
    position: sticky;
    top: 0;
    z-index: 5;
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: calc(56px + var(--sat));
    padding: var(--sat) 16px 4px;
    box-sizing: border-box;
    background: var(--bg);
    border-bottom: 1px solid var(--line);
  }
  .brand {
    font-weight: 700;
    font-size: 1.1rem;
    color: var(--primary);
  }
  .bottom-cover {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    height: var(--sab);
    background: var(--bg);
    pointer-events: none;
  }
  main {
    padding: 16px 16px calc(24px + var(--sab));
    max-width: 720px;
    margin: 0 auto;
  }
</style>
