<script lang="ts">
  // V14: hub of settings. Only links; no data and no fiscal logic.
  import { AJUSTES_MENU } from '../../app/ajustesMenu';
  import { esAjustes as t } from '../../i18n/ajustes';
</script>

<section>
  <p><a href="#/">{t.back}</a></p>
  <h1>{t.title}</h1>

  <ul>
    {#each AJUSTES_MENU as entry (entry.id)}
      {@const text = t.entries[entry.id]}
      <li>
        {#if entry.ruta}
          <a class="item" href={'#' + entry.ruta}>
            <strong>{text.label}</strong>
            <span>{text.hint}</span>
          </a>
        {:else}
          <div class="item disabled" aria-disabled="true">
            <strong>{text.label}</strong>
            <span>{text.hint} {t.soon}.</span>
          </div>
        {/if}
      </li>
    {/each}
  </ul>
</section>

<style>
  ul {
    list-style: none;
    margin: 16px 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .item {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-height: 44px;
    padding: 10px 12px;
    border: 1px solid currentColor;
    border-radius: 8px;
    color: inherit;
    text-decoration: none;
  }
  .item span {
    font-size: 0.9rem;
    opacity: 0.8;
  }
  .disabled {
    opacity: 0.55;
  }
</style>
