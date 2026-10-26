<script lang="ts">
  import { onMount } from 'svelte';
  import type { Obligacion, Perfil } from '../../data/models';
  import { buildInicioSummary, type InicioItem } from '../../app/inicio';
  import { buildMonthSummary, type MonthSummary } from '../../app/inicioMes';
  import { formatDate } from '../../app/format';
  import type { NotificationPermissionState } from '../../app/notificationPermission';
  import { monthKeyOf } from '../../app/registro';
  import { newMovementPath } from '../../app/registroRoutes';
  import { localISODate, monthName, parseISODate } from '../../domain/dates';
  import { formatCup } from '../../domain/money';
  import { findTributo } from '../../domain/tributos.catalog';
  import { inicio as t, daysText, overdueText } from '../../i18n/inicio';
  import { loadNotificationPermission } from '../../stores/ajustes';
  import { listMovementsByMonth } from '../../stores/movimientos';
  import { listObligations } from '../../stores/obligaciones';
  import { errorMessage } from '../../stores/perfil.svelte';

  let { perfil }: { perfil: Perfil } = $props();

  let obligaciones = $state<Obligacion[]>([]);
  let permiso = $state<NotificationPermissionState>('unknown');
  let month = $state<MonthSummary | null>(null);
  let monthError = $state<string | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);
  const today = localISODate(new Date());
  const start = parseISODate(today)!;
  const monthLabel = `${monthName(start.month)} ${start.year}`;

  const summary = $derived(buildInicioSummary(obligaciones, today));

  // The month summary loads on its own: if it fails, the obligations still show.
  async function loadMonth(): Promise<void> {
    try {
      month = buildMonthSummary(await listMovementsByMonth(monthKeyOf(today)));
    } catch (e) {
      monthError = errorMessage(e);
    }
  }

  onMount(async () => {
    void loadMonth();
    try {
      obligaciones = await listObligations({ estado: 'pendiente' });
    } catch (e) {
      error = errorMessage(e);
    } finally {
      loading = false;
    }
    try {
      permiso = await loadNotificationPermission();
    } catch {
      // The permission alert is optional: ignore read errors.
    }
  });

  function tributoName(code: string): string {
    return findTributo(code)?.shortName ?? code;
  }

  function amountText(o: Obligacion): string {
    if (o.importeOficial !== undefined) return `${formatCup(o.importeOficial)} · ${t.officialAmount}`;
    if (o.importeEstimado !== undefined) return `~ ${formatCup(o.importeEstimado)} · ${t.estimatedAmount}`;
    return t.amountUnknown;
  }

  const href = (item: InicioItem): string => `#/obligaciones/${item.obligacion.id}`;
</script>

{#snippet row(item: InicioItem)}
  <a class="card {item.urgencia}" href={href(item)}>
    <span class="top">
      <strong>{tributoName(item.obligacion.tributoCodigo)}</strong>
      <span class="chip">{t.urgency[item.urgencia]}</span>
    </span>
    <span>{item.obligacion.periodoEtiqueta}</span>
    <span>{formatDate(item.obligacion.vence)} · {daysText(item.dias)}</span>
    <span class="amount">{amountText(item.obligacion)}</span>
  </a>
{/snippet}

<section>
  <header>
    <h2>{t.greeting(perfil.nombreVisible)}</h2>
    <a class="btn" href="#/ajustes">{t.settings}</a>
  </header>

  {#if loading}
    <p>{t.loading}</p>
  {:else if error}
    <p role="alert">{t.loadError}: {error}</p>
  {:else}
    {#if summary.overdue.length > 0 || permiso === 'denied'}
      <div class="alerts" role="status">
        <h3>{t.alertsTitle}</h3>
        {#if summary.overdue.length > 0}
          <p>{overdueText(summary.overdue.length)}</p>
        {/if}
        {#if permiso === 'denied'}
          <p>{t.notificationsDenied} <a href="#/ajustes/notificaciones">{t.notificationsFix}</a></p>
        {/if}
      </div>
    {/if}

    {#if summary.overdue.length > 0}
      <h3>{t.overdueTitle}</h3>
      {#each summary.overdue as item (item.obligacion.id)}
        {@render row(item)}
      {/each}
    {/if}

    <h3>{t.nextTitle}</h3>
    {#if summary.next}
      {@render row(summary.next)}
    {:else}
      <p>{t.nextNone}</p>
    {/if}

    <h3>{t.month.title(monthLabel)}</h3>
    {#if monthError}
      <p role="alert">{t.month.loadError}: {monthError}</p>
    {:else if month === null}
      <p>{t.loading}</p>
    {:else}
      <dl class="totals">
        <div>
          <dt>{t.month.income}</dt>
          <dd>{formatCup(month.ingresos)}</dd>
        </div>
        <div>
          <dt>{t.month.expenses}</dt>
          <dd>{formatCup(month.gastos)}</dd>
        </div>
        <div>
          <dt>{t.month.tax}</dt>
          <dd>{formatCup(month.impuesto)}</dd>
        </div>
      </dl>
      <p class="note">{t.month.taxHint}</p>
    {/if}
    <div class="actions">
      <a class="btn" href={'#' + newMovementPath('ingreso')}>{t.month.addIncome}</a>
      <a class="btn" href={'#' + newMovementPath('gasto')}>{t.month.addExpense}</a>
    </div>
    <div class="actions">
      <a class="btn" href="#/registro">{t.month.seeRegistro}</a>
      <a class="btn" href="#/calculadora">{t.month.seeCalculadora}</a>
    </div>

    <h3>{t.upcomingTitle}</h3>
    {#if summary.upcoming.length === 0}
      <p>{t.upcomingNone}</p>
    {:else}
      {#each summary.upcoming as item (item.obligacion.id)}
        {@render row(item)}
      {/each}
    {/if}

    <p class="note">{t.disclaimer}</p>
  {/if}
</section>

<style>
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  h2,
  h3 {
    margin: 12px 0 8px;
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
  .vencida,
  .urgente {
    border-left-color: #c62828;
  }
  .pronto {
    border-left-color: #b26a00;
  }
  .tranquila {
    border-left-color: #2e7d32;
  }
  .alerts {
    padding: 8px 12px;
    border: 1px solid #b26a00;
    border-radius: 8px;
  }
  .alerts h3 {
    margin-top: 0;
  }
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 44px;
    padding: 0 12px;
    border: 1px solid currentColor;
    border-radius: 8px;
    color: inherit;
    text-decoration: none;
  }
  .totals {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin: 0 0 4px;
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
  .actions {
    display: flex;
    gap: 8px;
    margin-top: 8px;
  }
  .actions .btn {
    flex: 1;
  }
  .note {
    font-size: 0.85em;
    opacity: 0.75;
  }
</style>
