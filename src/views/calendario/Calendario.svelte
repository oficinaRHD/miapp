<script lang="ts">
  import { onMount } from 'svelte';
  import type { Obligacion } from '../../data/models';
  import {
    buildMonthGrid,
    defaultSelected,
    filterByTributo,
    groupByMonth,
    obligationsOn,
    statusOf,
    tributoCodes,
  } from '../../app/calendario';
  import { formatDate } from '../../app/format';
  import { localISODate, monthName, parseISODate, shiftMonth } from '../../domain/dates';
  import type { ISODate } from '../../domain/types';
  import { findTributo } from '../../domain/tributos.catalog';
  import { calendario as t, dayCountText } from '../../i18n/calendario';
  import { listObligations } from '../../stores/obligaciones';
  import { errorMessage } from '../../stores/perfil.svelte';

  const today = localISODate(new Date());
  const start = parseISODate(today)!;

  let all = $state<Obligacion[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let mode = $state<'mes' | 'anio'>('mes');
  let year = $state(start.year);
  let month = $state(start.month);
  let selected = $state<ISODate>(today);
  let filter = $state(''); // '' = all tributos

  const filtered = $derived(filterByTributo(all, filter === '' ? null : filter));
  const codes = $derived(tributoCodes(all));
  const grid = $derived(buildMonthGrid(year, month, filtered, today));
  const dayItems = $derived(obligationsOn(filtered, selected));
  const groups = $derived(groupByMonth(filtered, year));
  const heading = $derived(mode === 'mes' ? `${monthName(month)} ${year}` : String(year));
  const statuses = ['vencida', 'urgente', 'pronto', 'tranquila', 'pagada', 'omitida'] as const;

  onMount(async () => {
    try {
      all = await listObligations();
    } catch (e) {
      error = errorMessage(e);
    } finally {
      loading = false;
    }
  });

  function move(delta: number): void {
    if (mode === 'mes') {
      const next = shiftMonth(year, month, delta);
      year = next.year;
      month = next.month;
      selected = defaultSelected(year, month, today);
    } else {
      year += delta;
    }
  }

  function tributoName(code: string): string {
    return findTributo(code)?.shortName ?? code;
  }
</script>

{#snippet row(o: Obligacion)}
  {@const status = statusOf(o, today)}
  <a class="card s-{status}" href={'#/obligaciones/' + o.id}>
    <span class="top">
      <strong>{tributoName(o.tributoCodigo)}</strong>
      <span class="chip">{t.status[status]}</span>
    </span>
    <span>{o.periodoEtiqueta}</span>
    <span>{formatDate(o.vence)}</span>
  </a>
{/snippet}

<section>
  <h2>{t.title}</h2>

  {#if loading}
    <p>{t.loading}</p>
  {:else if error}
    <p role="alert">{t.loadError}: {error}</p>
  {:else}
    <div class="bar">
      <div class="modes" role="group" aria-label={t.title}>
        <button type="button" aria-pressed={mode === 'mes'} onclick={() => (mode = 'mes')}>{t.modeMonth}</button>
        <button type="button" aria-pressed={mode === 'anio'} onclick={() => (mode = 'anio')}>{t.modeYear}</button>
      </div>
      <label>
        <span class="sr">{t.filterLabel}</span>
        <select bind:value={filter}>
          <option value="">{t.filterAll}</option>
          {#each codes as code (code)}
            <option value={code}>{tributoName(code)}</option>
          {/each}
        </select>
      </label>
    </div>

    <div class="nav">
      <button
        type="button"
        aria-label={mode === 'mes' ? t.prevMonth : t.prevYear}
        onclick={() => move(-1)}>‹</button>
      <h3>{heading}</h3>
      <button
        type="button"
        aria-label={mode === 'mes' ? t.nextMonth : t.nextYear}
        onclick={() => move(1)}>›</button>
    </div>

    {#if mode === 'mes'}
      <div class="grid head" aria-hidden="true">
        {#each t.weekdays as w (w)}<span>{w}</span>{/each}
      </div>
      {#each grid as week (week[0]?.date)}
        <div class="grid">
          {#each week as cell (cell.date)}
            <button
              type="button"
              class="cell"
              class:out={!cell.inMonth}
              class:today={cell.isToday}
              aria-pressed={cell.inMonth && cell.date === selected}
              aria-current={cell.isToday ? 'date' : undefined}
              aria-label={`${cell.day} de ${monthName(month)}: ${dayCountText(cell.count)}`}
              disabled={!cell.inMonth}
              onclick={() => (selected = cell.date)}>
              <span class="num">{cell.day}</span>
              {#if cell.status}
                <span class="dot s-{cell.status}"></span>
              {/if}
              {#if cell.count > 1}<span class="count">{cell.count}</span>{/if}
            </button>
          {/each}
        </div>
      {/each}

      <ul class="legend" aria-label={t.legend}>
        {#each statuses as s (s)}
          <li><span class="dot s-{s}"></span>{t.status[s]}</li>
        {/each}
      </ul>

      <h3>{formatDate(selected)}</h3>
      {#if dayItems.length === 0}
        <p>{t.dayNone}</p>
      {:else}
        {#each dayItems as o (o.id)}
          {@render row(o)}
        {/each}
      {/if}
    {:else if groups.length === 0}
      <p>{t.yearNone}</p>
    {:else}
      {#each groups as g (g.month)}
        <h3>{monthName(g.month)}</h3>
        {#each g.items as o (o.id)}
          {@render row(o)}
        {/each}
      {/each}
    {/if}
  {/if}
</section>

<style>
  h2,
  h3 {
    margin: 12px 0 8px;
  }
  .bar,
  .nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .nav h3 {
    margin: 0;
  }
  button,
  select {
    min-height: 44px;
    padding: 0 12px;
    border: 1px solid currentColor;
    border-radius: 8px;
    background: transparent;
    color: inherit;
    font: inherit;
  }
  .modes button[aria-pressed='true'] {
    font-weight: 700;
    outline: 2px solid currentColor;
  }
  .sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
    margin-top: 4px;
  }
  .head {
    text-align: center;
    font-size: 0.8em;
    opacity: 0.75;
  }
  .cell {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    min-height: 48px;
    padding: 2px;
  }
  .cell.out {
    opacity: 0.3;
  }
  .cell.today .num {
    font-weight: 700;
    text-decoration: underline;
  }
  .cell[aria-pressed='true'] {
    outline: 2px solid currentColor;
    outline-offset: 1px;
  }
  .count {
    position: absolute;
    top: 2px;
    right: 4px;
    font-size: 0.7em;
  }
  .dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 12px;
    margin: 8px 0 0;
    padding: 0;
    list-style: none;
    font-size: 0.8em;
  }
  .legend li {
    display: inline-flex;
    align-items: center;
    gap: 4px;
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
  .dot.s-vencida,
  .dot.s-urgente {
    background: #c62828;
  }
  .dot.s-pronto {
    background: #b26a00;
  }
  .dot.s-tranquila {
    background: #2e7d32;
  }
  .dot.s-pagada {
    background: #546e7a;
  }
  .dot.s-omitida {
    background: #9e9e9e;
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
</style>
