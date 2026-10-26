<script lang="ts">
  // V08 Calculadora del mes: estimate of 0114022 and 0510122 from the month's income.
  // No fiscal logic here: see `calculadora.ts` and the rules in `src/domain/rules`.
  import { untrack } from 'svelte';
  import {
    CALC_INFO,
    draftFromTotals,
    evaluateDraft,
    isEdited,
    percentText,
    withElectronicDiscount,
    type CalcDraft,
  } from '../../app/calculadora';
  import { findEstimateTarget, type EstimateTarget } from '../../app/calculadoraLink';
  import { monthTotals, type MonthTotals } from '../../app/registro';
  import { monthKeyFrom } from '../../app/registroMonth';
  import { localISODate, monthName, parseISODate, shiftMonth } from '../../domain/dates';
  import type { Obligacion } from '../../data/models';
  import type { Centavos } from '../../domain/types';
  import { formatCup } from '../../domain/money';
  import { findTributo } from '../../domain/tributos.catalog';
  import { esCalculadora as t } from '../../i18n/calculadora';
  import { listMovementsByMonth } from '../../stores/movimientos';
  import { listObligations, updateObligation } from '../../stores/obligaciones';
  import { errorMessage } from '../../stores/perfil.svelte';

  const today = localISODate(new Date());
  const start = parseISODate(today)!;

  let year = $state(start.year);
  let month = $state(start.month);
  let totals = $state<MonthTotals>(monthTotals([]));
  let draft = $state<CalcDraft>(draftFromTotals(monthTotals([])));
  let obligs = $state<Obligacion[]>([]);
  let notice = $state<{ code: string; id: string; label: string } | null>(null);
  let busyCode = $state<string | null>(null);
  let useError = $state<string | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let request = 0;

  const mes = $derived(monthKeyFrom(year, month));
  const evaluation = $derived(evaluateDraft(draft));
  const edited = $derived(isEdited(draft, totals));
  const discount = $derived(evaluation.result ? withElectronicDiscount(evaluation.result) : null);
  const targets = $derived(
    evaluation.result
      ? {
          ventas: findEstimateTarget(obligs, '0114022', mes, evaluation.result.ventasTax),
          isip: findEstimateTarget(obligs, '0510122', mes, evaluation.result.isipTax),
        }
      : null,
  );

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
      const [rows, obls] = await Promise.all([listMovementsByMonth(key), listObligations()]);
      if (mine !== request) return;
      totals = monthTotals(rows);
      draft = draftFromTotals(totals);
      obligs = obls;
      notice = null;
      useError = null;
      error = null;
    } catch (e) {
      if (mine === request) error = errorMessage(e);
    } finally {
      if (mine === request) loading = false;
    }
  }

  async function useEstimate(target: EstimateTarget, amount: Centavos): Promise<void> {
    if (target.status !== 'ready' || target.obligacionId === undefined) return;
    busyCode = target.codigo;
    useError = null;
    notice = null;
    try {
      const updated = await updateObligation(target.obligacionId, { importeEstimado: amount });
      obligs = await listObligations();
      notice = { code: target.codigo, id: updated.id, label: updated.periodoEtiqueta };
    } catch (e) {
      useError = `${t.use.saveError}: ${errorMessage(e)}`;
    } finally {
      busyCode = null;
    }
  }

  function move(delta: number): void {
    const next = shiftMonth(year, month, delta);
    year = next.year;
    month = next.month;
  }
</script>

{#snippet useBlock(target: EstimateTarget, amount: Centavos)}
  <div class="use">
    {#if target.status === 'missing'}
      <p class="hint">{t.use.missing(`${monthName(month)} ${year}`)}</p>
    {:else if target.status === 'paid'}
      <p class="hint">{t.use.paid}</p>
    {:else if target.status === 'omitted'}
      <p class="hint">{t.use.omitted}</p>
    {:else}
      <p class="hint">{t.use.forPeriod(target.periodoEtiqueta ?? '')}</p>
      {#if target.hasOfficial}
        <p class="hint">{t.use.official}</p>
      {/if}
      {#if edited}
        <p class="hint">{t.use.editedNote}</p>
      {/if}
      {#if target.upToDate}
        <p class="hint">{t.use.upToDate}</p>
      {:else}
        <button type="button" disabled={busyCode !== null} onclick={() => void useEstimate(target, amount)}>
          {t.use.button}
        </button>
      {/if}
    {/if}
    {#if notice && notice.code === target.codigo}
      <p role="status">{t.use.saved(notice.label)} <a href={'#/obligaciones/' + notice.id}>{t.use.open}</a></p>
    {/if}
  </div>
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
        {#if targets}
          {@render useBlock(targets.ventas, r.ventasTax)}
        {/if}
      </div>

      <div class="card">
        <h3>{tributoName('0510122')} · 0510122</h3>
        <dl>
          <div><dt>{t.base}</dt><dd>{formatCup(r.ingresos)}</dd></div>
          <div><dt>{t.exempt}</dt><dd>{formatCup(CALC_INFO.exemptMinimum)}</dd></div>
          <div><dt>{t.rate}</dt><dd>{t.rateOverExcess(percentText(CALC_INFO.isipRateBp))}</dd></div>
          <div class="strong"><dt>{t.tax}</dt><dd>{formatCup(r.isipTax)}</dd></div>
        </dl>
        {#if targets}
          {@render useBlock(targets.isip, r.isipTax)}
        {/if}
      </div>

      <div class="card total">
        <h3>{t.totalTitle}</h3>
        <p class="big">{formatCup(r.total)}</p>
      </div>

      {#if discount}
        <div class="card">
          <h3>{t.discount.title}</h3>
          <p class="hint">{t.discount.lead(percentText(CALC_INFO.discountRateBp))}</p>
          <dl>
            <div><dt>{tributoName('0114022')}</dt><dd>{formatCup(discount.ventas.total)}</dd></div>
            <div><dt>{tributoName('0510122')}</dt><dd>{formatCup(discount.isip.total)}</dd></div>
            <div class="strong"><dt>{t.discount.total}</dt><dd>{formatCup(discount.total)}</dd></div>
            <div><dt>{t.discount.saved}</dt><dd>{formatCup(discount.saved)}</dd></div>
          </dl>
        </div>
      {/if}

      {#if useError}
        <p class="error" role="alert">{useError}</p>
      {/if}
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
  .use {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    margin-top: 8px;
  }
  .total {
    border-width: 2px;
  }
  .big {
    font-size: 1.5em;
    font-weight: 700;
  }
</style>
