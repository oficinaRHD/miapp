<script lang="ts">
  // V08 Calculadora del mes: estimate of 0114022 and 0510122 from the month's income.
  // No fiscal logic here: see `calculadora.ts` and the rules in `src/domain/rules`.
  import { onMount, untrack } from 'svelte';
  import {
    CALC_INFO,
    draftFromTotals,
    evaluateDraft,
    isEdited,
    percentText,
    type CalcDraft,
  } from '../../app/calculadora';
  import { monthTotals, type MonthTotals } from '../../app/registro';
  import { monthKeyFrom } from '../../app/registroMonth';
  import { localISODate, monthName, parseISODate, shiftMonth } from '../../domain/dates';
  import { formatCup } from '../../domain/money';
  import { findTributo } from '../../domain/tributos.catalog';
  import { esCalculadora as t } from '../../i18n/calculadora';
  import { listMovementsByMonth } from '../../stores/movimientos';
  import { errorMessage } from '../../stores/perfil.svelte';

  const today = localISODate(new Date());
  const start = parseISODate(today)!;

  let year = $state(start.year);
  let month = $state(start.month);
  let totals = $state<MonthTotals>(monthTotals([]));
  let draft = $state<CalcDraft>(draftFromTotals(monthTotals([])));
  let loading = $state(true);
  let error = $state<string | null>(null);
  let request = 0;

  const mes = $derived(monthKeyFrom(year, month));
  const evaluation = $derived(evaluateDraft(draft));
  const edited = $derived(isEdited(draft, totals));

  function tributoName(code: string): string {
    return findTributo(code)?.shortName ?? code;
  }

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
      totals = monthTotals(rows);
      draft = draftFromTotals(totals);
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
    <p class="hint">{t.lead}</p>
    {#if totals.ingresos === 0}
      <p>{t.noIncome} <a href="#/registro">{t.goRegistro}</a></p>
    {/if}

    <label for="cv-ventas">{t.ventasLabel}</label>
    <input
      id="cv-ventas"
      type="text"
      inputmode="decimal"
      autocomplete="off"
      aria-invalid={evaluation.errors.includes('ventas-invalid') || evaluation.errors.includes('ventas-exceeds')}
      bind:value={draft.ventasText}
    />
    <p class="hint">{t.ventasHint}</p>

    <label for="cv-ingresos">{t.ingresosLabel}</label>
    <input
      id="cv-ingresos"
      type="text"
      inputmode="decimal"
      autocomplete="off"
      aria-invalid={evaluation.errors.includes('ingresos-invalid')}
      bind:value={draft.ingresosText}
    />
    <p class="hint">{t.ingresosHint}</p>

    {#if edited}
      <button type="button" onclick={() => (draft = draftFromTotals(totals))}>{t.reset}</button>
    {/if}

    {#each evaluation.errors as e (e)}
      <p class="error" role="alert">{t.error(e)}</p>
    {/each}

    {#if evaluation.result}
      {@const r = evaluation.result}
      <div class="card">
        <h3>{tributoName('0114022')} · 0114022</h3>
        <dl>
          <div><dt>{t.base}</dt><dd>{formatCup(r.ventas)}</dd></div>
          <div><dt>{t.rate}</dt><dd>{percentText(CALC_INFO.salesRateBp)}</dd></div>
          <div class="strong"><dt>{t.tax}</dt><dd>{formatCup(r.ventasTax)}</dd></div>
        </dl>
      </div>

      <div class="card">
        <h3>{tributoName('0510122')} · 0510122</h3>
        <dl>
          <div><dt>{t.base}</dt><dd>{formatCup(r.ingresos)}</dd></div>
          <div><dt>{t.exempt}</dt><dd>{formatCup(CALC_INFO.exemptMinimum)}</dd></div>
          <div><dt>{t.rate}</dt><dd>{t.rateOverExcess(percentText(CALC_INFO.isipRateBp))}</dd></div>
          <div class="strong"><dt>{t.tax}</dt><dd>{formatCup(r.isipTax)}</dd></div>
        </dl>
      </div>

      <div class="card total">
        <h3>{t.totalTitle}</h3>
        <p class="big">{formatCup(r.total)}</p>
      </div>
    {/if}

    <p class="note">{t.disclaimer}</p>
    <p class="note">{t.exceptionNote}</p>
  {/if}
</section>

<style>
  section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  h2,
  h3,
  p {
    margin: 0;
  }
  .nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  button {
    min-height: 44px;
    padding: 0 12px;
    border: 1px solid currentColor;
    border-radius: 8px;
    background: transparent;
    color: inherit;
    font: inherit;
  }
  input[type='text'] {
    width: 100%;
    min-height: 44px;
    padding: 0 12px;
    box-sizing: border-box;
    font-size: 16px;
  }
  .hint,
  .note {
    font-size: 0.85em;
    opacity: 0.75;
  }
  .error {
    color: #d32f2f;
  }
  .card {
    padding: 10px 12px;
    border: 1px solid color-mix(in srgb, currentColor 25%, transparent);
    border-radius: 8px;
  }
  .card h3 {
    margin-bottom: 8px;
    font-size: 1em;
  }
  dl {
    margin: 0;
  }
  dl div {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 4px 0;
  }
  dt {
    opacity: 0.8;
  }
  dd {
    margin: 0;
    text-align: right;
  }
  .strong {
    font-weight: 700;
  }
  .total {
    border-width: 2px;
  }
  .big {
    font-size: 1.5em;
    font-weight: 700;
  }
</style>
