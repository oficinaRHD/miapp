<script lang="ts">
  // V06 Registro: movements of one month, with totals and an income/expense filter.
  // No fiscal logic here: see `registro.ts` and `registroMonth.ts`.
  import { onMount, untrack } from 'svelte';
  import { formatDate } from '../../app/format';
  import { categoryName, filterByTipo, groupByDay, monthTotals, type TipoFilter } from '../../app/registro';
  import { emptyKind, formatNet, monthKeyFrom, tipoForNew } from '../../app/registroMonth';
  import { editMovementPath, newMovementPath } from '../../app/registroRoutes';
  import { localISODate, monthName, parseISODate, shiftMonth } from '../../domain/dates';
  import { formatCup } from '../../domain/money';
  import type { Categoria, Movimiento } from '../../data/models';
  import { esRegistroLista as t } from '../../i18n/registroLista';
  import { listCategories, listMovementsByMonth } from '../../stores/movimientos';
  import { errorMessage } from '../../stores/perfil.svelte';

  const today = localISODate(new Date());
  const start = parseISODate(today)!;
  const FILTERS: TipoFilter[] = ['todos', 'ingreso', 'gasto'];

  let year = $state(start.year);
  let month = $state(start.month);
  let filter = $state<TipoFilter>('todos');
  let all = $state<Movimiento[]>([]);
  let categorias = $state<Categoria[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let request = 0;

  const mes = $derived(monthKeyFrom(year, month));
  const totals = $derived(monthTotals(all));
  const shown = $derived(filterByTipo(all, filter));
  const groups = $derived(groupByDay(shown));
  const empty = $derived(emptyKind(all.length, shown.length));

  onMount(() => {
    void (async () => {
      try {
        categorias = await listCategories();
      } catch (e) {
        error = errorMessage(e);
      }
    })();
  });

  // Reload whenever the month changes. Late answers from an older month are ignored.
  $effect(() => {
    const key = mes;
    untrack(() => void load(key));
  });

  async function load(key: string): Promise<void> {
    const mine = ++request;
    loading = true;
    try {
      const rows = await listMovementsByMonth(key);
      if (mine !== request) return;
      all = rows;
      error = null;
    } catch (e) {
      if (mine === request) error = errorMessage(e);
    } finally {
      if (mine === request) loading = false;
    }
  }

  function move(delta: number): void {
    const next = shiftMonth(year, month, delta);
    year = next.year;
    month = next.month;
  }
</script>

{#snippet row(m: Movimiento)}
  <a class="card t-{m.tipo}" href={'#' + editMovementPath(m.id)}>
    <span class="top">
      <strong>{m.descripcion ?? categoryName(m.categoriaId, categorias)}</strong>
      <span class="amount">{m.tipo === 'ingreso' ? '+' : '-'}{formatCup(m.monto)}</span>
    </span>
    <span class="sub">
      {categoryName(m.categoriaId, categorias)}{m.contraparte ? ` · ${m.contraparte}` : ''}
    </span>
    {#if m.tipo === 'gasto' && m.justificado}
      <span class="chip">{t.receipt}</span>
    {/if}
  </a>
{/snippet}

<section>
  <h2>{t.title}</h2>

  <div class="nav">
    <button type="button" aria-label={t.prevMonth} onclick={() => move(-1)}>‹</button>
    <h3>{monthName(month)} {year}</h3>
    <button type="button" aria-label={t.nextMonth} onclick={() => move(1)}>›</button>
  </div>

  {#if error}
    <p role="alert">{t.loadError}: {error}</p>
  {:else if loading}
    <p>{t.loading}</p>
  {:else}
    <dl class="totals">
      <div>
        <dt>{t.totals.ingresos}</dt>
        <dd>{formatCup(totals.ingresos)}</dd>
      </div>
      <div>
        <dt>{t.totals.gastos}</dt>
        <dd>{formatCup(totals.gastos)}</dd>
      </div>
      <div>
        <dt>{t.totals.neto}</dt>
        <dd>{formatNet(totals.neto, formatCup)}</dd>
      </div>
    </dl>
    <p class="count">{t.count(totals.count)}</p>

    <div class="filters" role="group" aria-label={t.filterLabel}>
      {#each FILTERS as f (f)}
        <button type="button" aria-pressed={filter === f} onclick={() => (filter = f)}>
          {t.filters[f]}
        </button>
      {/each}
    </div>

    {#if empty === 'month'}
      <p>{t.emptyMonth}</p>
      <a class="btn" href={'#' + newMovementPath('ingreso')}>{t.firstIncome}</a>
    {:else if empty === 'filter'}
      <p>{t.emptyFilter[filter === 'gasto' ? 'gasto' : 'ingreso']}</p>
    {:else}
      {#each groups as g (g.fecha)}
        <h3>{formatDate(g.fecha)}</h3>
        {#each g.items as m (m.id)}
          {@render row(m)}
        {/each}
      {/each}
    {/if}
  {/if}

  <a class="fab" href={'#' + newMovementPath(tipoForNew(filter))} aria-label={t.add}>+</a>
</section>

<style>
  h2,
  h3 {
    margin: 12px 0 8px;
  }
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
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 44px;
    padding: 0 12px;
    border: 1px solid currentColor;
    border-radius: 8px;
    background: transparent;
    color: inherit;
    font: inherit;
    text-decoration: none;
  }
  .totals {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin: 12px 0 4px;
  }
  .totals div {
    padding: 8px;
    border: 1px solid color-mix(in srgb, currentColor 25%, transparent);
    border-radius: 8px;
  }
  .totals dt {
    font-size: 0.8em;
    opacity: 0.75;
  }
  .totals dd {
    margin: 0;
    font-weight: 700;
    font-size: 0.95em;
  }
  .count {
    margin: 0 0 8px;
    font-size: 0.85em;
    opacity: 0.75;
  }
  .filters {
    display: flex;
    gap: 8px;
    margin-bottom: 8px;
  }
  .filters button {
    flex: 1;
  }
  .filters button[aria-pressed='true'] {
    font-weight: 700;
    outline: 2px solid currentColor;
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
  .card.t-ingreso {
    border-left-color: #2e7d32;
  }
  .card.t-gasto {
    border-left-color: #c62828;
  }
  .top {
    display: flex;
    justify-content: space-between;
    gap: 8px;
  }
  .sub {
    font-size: 0.85em;
    opacity: 0.75;
  }
  .chip {
    align-self: flex-start;
    font-size: 0.8em;
    padding: 0 8px;
    border-radius: 999px;
    border: 1px solid currentColor;
  }
  .fab {
    position: fixed;
    right: 16px;
    bottom: 16px;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: #1565c0;
    color: #fff;
    font-size: 2em;
    line-height: 1;
    text-decoration: none;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
  }
</style>
