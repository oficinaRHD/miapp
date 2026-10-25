<script lang="ts">
  import { onMount } from 'svelte';
  import type { Obligacion } from '../../data/models';
  import { statusOf } from '../../app/calendario';
  import { formatDate } from '../../app/format';
  import {
    FILTERS,
    amountOf,
    filterCounts,
    filterObligations,
    groupByDueMonth,
    type ObligationFilter,
  } from '../../app/obligacionesList';
  import { localISODate, monthName } from '../../domain/dates';
  import { formatCup } from '../../domain/money';
  import { findTributo } from '../../domain/tributos.catalog';
  import { obligaciones as t } from '../../i18n/obligaciones';
  import { listObligations } from '../../stores/obligaciones';
  import { errorMessage } from '../../stores/perfil.svelte';

  const today = localISODate(new Date());

  let all = $state<Obligacion[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let filter = $state<ObligationFilter>('pendientes');

  const counts = $derived(filterCounts(all, today));
  const groups = $derived(groupByDueMonth(filterObligations(all, filter, today)));

  onMount(async () => {
    try {
      all = await listObligations();
    } catch (e) {
      error = errorMessage(e);
    } finally {
      loading = false;
    }
  });

  function tributoName(code: string): string {
    return findTributo(code)?.shortName ?? code;
  }

  function amountText(o: Obligacion): string {
    const a = amountOf(o);
    if (a.kind === 'ninguno') return t.amount.ninguno;
    return t.amount[a.kind](formatCup(a.centavos));
  }
</script>

<section>
  <h2>{t.title}</h2>

  {#if loading}
    <p>{t.loading}</p>
  {:else if error}
    <p role="alert">{t.loadError}: {error}</p>
  {:else}
    <div class="filters" role="group" aria-label={t.filterLabel}>
      {#each FILTERS as f (f)}
        <button type="button" aria-pressed={filter === f} onclick={() => (filter = f)}>
          {t.filters[f]} <span class="n">{counts[f]}</span>
        </button>
      {/each}
    </div>

    {#if groups.length === 0}
      <p>{t.empty[filter]}</p>
    {:else}
      {#each groups as g (g.key)}
        <h3>{monthName(g.month)} {g.year}</h3>
        {#each g.items as o (o.id)}
          {@const status = statusOf(o, today)}
          <a class="card s-{status}" href={'#/obligaciones/' + o.id}>
            <span class="top">
              <strong>{tributoName(o.tributoCodigo)}</strong>
              <span class="chip">{t.status[status]}</span>
            </span>
            <span>{o.periodoEtiqueta}</span>
            <span>{t.due} {formatDate(o.vence)}</span>
            <span class="amount">{amountText(o)}</span>
          </a>
        {/each}
      {/each}
    {/if}

    <p class="note">{t.disclaimer}</p>
  {/if}
</section>

<style>
  h2,
  h3 {
    margin: 12px 0 8px;
  }
  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .filters button {
    min-height: 44px;
    padding: 0 12px;
    border: 1px solid currentColor;
    border-radius: 999px;
    background: transparent;
    color: inherit;
    font: inherit;
  }
  .filters button[aria-pressed='true'] {
    font-weight: 700;
    outline: 2px solid currentColor;
  }
  .n {
    opacity: 0.75;
  }
  .card {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-height: 44px;
    margin-bottom: 8px;
    padding: 10px 12px;
    border: 1px solid color-mix(in srgb, currentColor 25%, transparent);
    border-left-width: 6px;
    border-radius: 8px;
    color: inherit;
    text-decoration: none;
  }
  .top {
    display: flex;
    justify-content: space-between;
    gap: 8px;
  }
  .chip {
    font-size: 0.8em;
    padding: 0 8px;
    border-radius: 999px;
    border: 1px solid currentColor;
  }
  .amount {
    opacity: 0.8;
  }
  .card.s-vencida,
  .card.s-urgente {
    border-left-color: #c62828;
  }
  .card.s-pronto {
    border-left-color: #b26a00;
  }
  .card.s-tranquila {
    border-left-color: #2e7d32;
  }
  .card.s-pagada {
    border-left-color: #546e7a;
  }
  .card.s-omitida {
    border-left-color: #9e9e9e;
  }
  .note {
    font-size: 0.85em;
    opacity: 0.75;
  }
</style>
