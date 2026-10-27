<script lang="ts">
  // Dropdown menu [☰]: replaces the temporary row of links. Closes on navigation, Escape or outside tap.
  import { NAV_ITEMS, activeNav } from '../../app/nav';
  import { router } from '../../app/router.svelte';
  import { esNav as t } from '../../i18n/nav';

  let open = $state(false);
  const active = $derived(activeNav(router.route.path));

  // Any route change closes the menu.
  $effect(() => {
    void router.route.path;
    open = false;
  });
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && (open = false)} />

<div class="menu">
  <button
    type="button"
    class="toggle"
    aria-label={open ? t.closeMenu : t.openMenu}
    aria-expanded={open}
    aria-controls="main-menu"
    onclick={() => (open = !open)}
  >
    {open ? '✕' : '☰'}
  </button>

  {#if open}
    <button type="button" class="backdrop" aria-label={t.closeMenu} onclick={() => (open = false)}></button>
    <nav id="main-menu" class="panel" aria-label={t.appName}>
      <ul>
        {#each NAV_ITEMS as item (item.id)}
          <li>
            <a
              href={'#' + item.ruta}
              class:current={active === item.id}
              aria-current={active === item.id ? 'page' : undefined}
            >
              {t.items[item.id]}
            </a>
          </li>
        {/each}
      </ul>
    </nav>
  {/if}
</div>

<style>
  .menu {
    position: relative;
  }
  .toggle {
    width: 44px;
    min-height: 44px;
    padding: 0;
    font-size: 1.4rem;
    line-height: 1;
    background: transparent;
    color: inherit;
    border: 1px solid var(--line);
    border-radius: 12px;
  }
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 10;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: rgba(0, 0, 0, 0.35);
  }
  .panel {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    z-index: 11;
    width: min(260px, calc(100vw - 32px));
    padding: 8px;
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 16px;
    box-shadow: var(--shadow-lg);
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  a {
    display: flex;
    align-items: center;
    min-height: 48px;
    padding: 0 14px;
    border-radius: 10px;
    color: var(--text);
    text-decoration: none;
    font-weight: 500;
  }
  a.current {
    background: var(--primary-soft);
    color: var(--primary);
    font-weight: 700;
  }
</style>
