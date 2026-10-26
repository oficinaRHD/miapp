<script lang="ts">
  // V05: obligation detail, payment sheet (copy buttons), estimate (late surcharge and 3 % discount),
  // and the actions: mark as paid, omit, back to pending.
  import type { Obligacion } from '../../data/models';
  import { statusOf } from '../../app/calendario';
  import { formatDate } from '../../app/format';
  import {
    plainAmount,
    quotePayment,
    ratePercent,
    setCanal,
    setDescuento,
    setPagadaEn,
    suggestedForm,
    toPagoInput,
    validatePayment,
    type PaymentForm,
  } from '../../app/pago';
  import { formatRc05 } from '../../app/perfilForm';
  import { router } from '../../app/router.svelte';
  import { localISODate } from '../../domain/dates';
  import { formatCup } from '../../domain/money';
  import { findTributo } from '../../domain/tributos.catalog';
  import { detalle as t } from '../../i18n/detalle';
  import { copyText } from '../../services/clipboard';
  import {
    getObligation,
    markObligationPaid,
    omitObligation,
    reopenObligation,
  } from '../../stores/obligaciones';
  import { errorMessage, perfilStore } from '../../stores/perfil.svelte';
  import type { CanalPago } from '../../data/models';

  const today = localISODate(new Date());
  const CHANNELS: readonly CanalPago[] = ['electronico', 'ventanilla', 'otro'];

  let o = $state<Obligacion | undefined>(undefined);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let electronic = $state(false);
  let mode = $state<'ver' | 'pagar' | 'omitir'>('ver');
  let form = $state<PaymentForm>({
    pagadaEn: today,
    importe: '',
    canal: 'ventanilla',
    descuento3: false,
    recargo: '',
    notas: '',
  });
  let reason = $state('');
  let showErrors = $state(false);
  let busy = $state(false);
  let failure = $state<string | null>(null);
  let copied = $state<string | null>(null);
  let copyFailed = $state(false);

  const id = $derived(router.route.params['id']);
  const tributo = $derived(o ? findTributo(o.tributoCodigo) : undefined);
  const quote = $derived(o ? quotePayment(o, today, electronic) : null);
  const errors = $derived(validatePayment(form, today));
  const rc05 = $derived(perfilStore.perfil?.rc05);

  async function load(current: string): Promise<void> {
    loading = true;
    try {
      o = await getObligation(current);
      error = null;
      mode = 'ver';
    } catch (e) {
      error = errorMessage(e);
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    const current = id;
    if (current) void load(current);
  });

  async function copy(key: string, value: string): Promise<void> {
    const ok = await copyText(value);
    copyFailed = !ok;
    copied = ok ? key : null;
    if (ok) setTimeout(() => (copied === key ? (copied = null) : undefined), 2000);
  }

  function startPay(): void {
    if (!o) return;
    const base = suggestedForm(o, today);
    form = electronic ? setCanal(base, o, 'electronico') : base;
    showErrors = false;
    failure = null;
    mode = 'pagar';
  }

  async function run(action: () => Promise<Obligacion>): Promise<void> {
    busy = true;
    failure = null;
    try {
      o = await action();
      mode = 'ver';
    } catch (e) {
      failure = errorMessage(e);
    } finally {
      busy = false;
    }
  }

  async function confirmPay(): Promise<void> {
    const cur = o;
    showErrors = true;
    if (!cur || errors.length > 0) return;
    await run(() => markObligationPaid(cur.id, toPagoInput(form)));
  }

  async function confirmOmit(): Promise<void> {
    const cur = o;
    if (!cur) return;
    const motivo = reason.trim();
    await run(() => omitObligation(cur.id, motivo === '' ? undefined : motivo));
  }

  async function reopen(): Promise<void> {
    const cur = o;
    if (cur) await run(() => reopenObligation(cur.id));
  }

  function cup(centavos: number | undefined): string {
    return centavos === undefined ? t.undefinedValue : formatCup(centavos);
  }
</script>

{#snippet copyRow(key: string, label: string, value: string)}
  <div class="copy-row">
    <span class="grow">
      <small>{label}</small>
      <strong>{value}</strong>
    </span>
    <button type="button" onclick={() => copy(key, value)}>
      {copied === key ? t.copied : t.copy}
    </button>
  </div>
{/snippet}

{#snippet kv(label: string, value: string)}
  <div class="kv"><span>{label}</span><strong>{value}</strong></div>
{/snippet}

<section>
  <a class="back" href="#/obligaciones">‹ {t.back}</a>

  {#if loading}
    <p>{t.loading}</p>
  {:else if error}
    <p role="alert">{t.loadError}: {error}</p>
  {:else if !o}
    <p>{t.notFound}</p>
  {:else}
    {@const status = statusOf(o, today)}
    <header>
      <h2>{tributo?.shortName ?? o.tributoCodigo}</h2>
      <span class="chip s-{status}">{t.status[status]}</span>
    </header>

    <h3>{t.dataTitle}</h3>
    {@render kv(t.tributo, tributo?.name ?? o.tributoCodigo)}
    {@render kv(t.code, o.tributoCodigo)}
    {@render kv(t.period, o.periodoEtiqueta)}
    {@render kv(t.due, `${formatDate(o.vence)} (${t.origin[o.venceOrigen]})`)}
    {@render kv(t.barcode, o.codigoBarras ?? t.undefinedValue)}
    {@render kv(t.estimated, cup(o.importeEstimado))}
    {@render kv(t.official, cup(o.importeOficial))}

    {#if o.estado === 'pendiente'}
      <h3>{t.sheetTitle}</h3>
      <p class="hint">{t.sheetHint}</p>
      {#if rc05}
        {@render copyRow('rc05', t.fields.rc05, formatRc05(rc05, false))}
        {@render copyRow('rc05h', t.fields.rc05Hyphens, formatRc05(rc05, true))}
      {:else}
        <p class="hint">{t.rc05Missing}</p>
      {/if}
      {@render copyRow('tributo', t.fields.tributo, o.tributoCodigo)}
      {#if o.codigoBarras}
        {@render copyRow('barras', t.fields.barras, o.codigoBarras)}
      {:else}
        <p class="hint">{t.barcodeMissing}</p>
      {/if}
      {#if quote?.toPay != null}
        {@render copyRow('importe', t.fields.importe, plainAmount(quote.toPay))}
      {:else}
        <p class="hint">{t.amountMissing}</p>
      {/if}
      {#if copyFailed}
        <p class="error" role="alert">{t.copyFailed}</p>
      {/if}

      <h3>{t.estimateTitle}</h3>
      {#if quote}
        {#if quote.principal === null}
          <p>{t.noAmount}</p>
        {:else}
          {@render kv(t.principal, formatCup(quote.principal))}
        {/if}
        <p>
          {#if quote.lateDays === 0}
            {t.onTime}
          {:else}
            {t.lateDays(quote.lateDays)}
          {/if}
        </p>
        {#if quote.late && quote.late.surcharge > 0}
          <p>{t.surcharge(formatCup(quote.late.surcharge), ratePercent(quote.late.rateBp))}</p>
        {/if}
        <label class="check">
          <input type="checkbox" bind:checked={electronic} />
          <span>{t.electronic}</span>
        </label>
        {#if electronic && quote.principal !== null}
          <p>{t.discount(formatCup(quote.discount))}</p>
          <p><strong>{t.total(formatCup(quote.principal - quote.discount))}</strong></p>
        {/if}
        <p class="hint">{t.notes.holidays}</p>
        {#if quote.late?.tier === 'over60'}
          <p class="hint">{t.notes.over60}</p>
        {/if}
        {#if electronic && quote.late && quote.late.surcharge > 0}
          <p class="hint">{t.notes.discountOnSurcharge}</p>
        {/if}
        <p class="hint">{t.notes.estimate}</p>
      {/if}

      {#if mode === 'ver'}
        <div class="actions">
          <button type="button" onclick={startPay}>{t.pay}</button>
          <button
            type="button"
            onclick={() => {
              reason = '';
              failure = null;
              mode = 'omitir';
            }}>{t.omit}</button>
        </div>
      {:else if mode === 'pagar'}
        <form
          novalidate
          onsubmit={(e) => {
            e.preventDefault();
            void confirmPay();
          }}>
          <h3>{t.payTitle}</h3>

          <label for="pay-date">{t.paidOn}</label>
          <input
            id="pay-date"
            type="date"
            max={today}
            value={form.pagadaEn}
            onchange={(e) => o && (form = setPagadaEn(form, o, e.currentTarget.value))}
          />

          <fieldset>
            <legend>{t.channel}</legend>
            {#each CHANNELS as c (c)}
              <label class="check">
                <input
                  type="radio"
                  name="pay-channel"
                  checked={form.canal === c}
                  onchange={() => o && (form = setCanal(form, o, c))}
                />
                <span>{t.channels[c]}</span>
              </label>
            {/each}
          </fieldset>
          {#if form.canal === 'electronico'}
            <label class="check">
              <input
                type="checkbox"
                checked={form.descuento3}
                onchange={(e) => o && (form = setDescuento(form, o, e.currentTarget.checked))}
              />
              <span>{t.applyDiscount}</span>
            </label>
          {/if}

          <label for="pay-amount">{t.paidAmount}</label>
          <input id="pay-amount" type="text" inputmode="decimal" autocomplete="off" bind:value={form.importe} />
          <p class="hint">{t.paidAmountHint}</p>

          <label for="pay-surcharge">{t.lateSurcharge}</label>
          <input
            id="pay-surcharge"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            bind:value={form.recargo}
          />
          <p class="hint">{t.surchargeHint}</p>

          <label for="pay-notes">{t.notesLabel}</label>
          <input id="pay-notes" type="text" autocomplete="off" bind:value={form.notas} />

          {#if showErrors}
            {#each errors as err (err)}
              <p class="error" role="alert">{t.errors[err]}</p>
            {/each}
          {/if}
          {#if failure}
            <p class="error" role="alert">{t.saveError}: {failure}</p>
          {/if}

          <div class="actions">
            <button type="button" onclick={() => (mode = 'ver')} disabled={busy}>{t.cancel}</button>
            <button type="submit" disabled={busy}>{t.confirmPay}</button>
          </div>
        </form>
      {:else}
        <h3>{t.omitTitle}</h3>
        <p>{t.omitLead}</p>
        <label for="omit-reason">{t.omitReason}</label>
        <input id="omit-reason" type="text" autocomplete="off" bind:value={reason} />
        {#if failure}
          <p class="error" role="alert">{t.saveError}: {failure}</p>
        {/if}
        <div class="actions">
          <button type="button" onclick={() => (mode = 'ver')} disabled={busy}>{t.cancel}</button>
          <button type="button" onclick={confirmOmit} disabled={busy}>{t.confirmOmit}</button>
        </div>
      {/if}
    {:else if o.estado === 'pagada'}
      <h3>{t.paidTitle}</h3>
      {#if o.pagadaEn}{@render kv(t.paidOnLine, formatDate(o.pagadaEn))}{/if}
      {@render kv(t.paidAmountLine, cup(o.importePagado))}
      {#if o.canalPago}{@render kv(t.channelLine, t.channels[o.canalPago])}{/if}
      {#if o.descuento3Aplicado}{@render kv(t.discountLine, t.yes)}{/if}
      {#if o.recargoMora !== undefined}{@render kv(t.surchargeLine, formatCup(o.recargoMora))}{/if}
      {#if o.notas}{@render kv(t.notesLine, o.notas)}{/if}
      {#if failure}<p class="error" role="alert">{t.saveError}: {failure}</p>{/if}
      <div class="actions">
        <button type="button" onclick={reopen} disabled={busy}>{t.reopen}</button>
      </div>
    {:else}
      <h3>{t.omittedTitle}</h3>
      {#if o.motivoOmision}{@render kv(t.reasonLine, o.motivoOmision)}{/if}
      {#if failure}<p class="error" role="alert">{t.saveError}: {failure}</p>{/if}
      <div class="actions">
        <button type="button" onclick={reopen} disabled={busy}>{t.reopen}</button>
      </div>
    {/if}
  {/if}
</section>

<style>
  section,
  form {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  h2,
  h3,
  p {
    margin: 0;
  }
  h3 {
    margin-top: 12px;
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .back {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    color: inherit;
  }
  .chip {
    font-size: 0.8em;
    padding: 0 8px;
    border-radius: 999px;
    border: 1px solid currentColor;
  }
  .kv {
    display: flex;
    justify-content: space-between;
    gap: 12px;
  }
  .kv span {
    opacity: 0.75;
  }
  .kv strong {
    text-align: right;
  }
  .copy-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border: 1px solid color-mix(in srgb, currentColor 25%, transparent);
    border-radius: 8px;
  }
  .copy-row .grow {
    flex: 1;
    min-width: 0;
    word-break: break-all;
  }
  .copy-row small {
    display: block;
    opacity: 0.75;
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
  button:disabled {
    opacity: 0.5;
  }
  input[type='text'],
  input[type='date'] {
    width: 100%;
    min-height: 44px;
    padding: 0 12px;
    box-sizing: border-box;
    font-size: 16px;
  }
  fieldset {
    display: flex;
    flex-direction: column;
    margin: 0;
    padding: 8px 12px;
  }
  .check {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 44px;
  }
  .check input {
    flex: none;
    width: 24px;
    height: 24px;
  }
  .actions {
    display: flex;
    gap: 8px;
    margin-top: 8px;
  }
  .actions button {
    flex: 1;
  }
  .hint {
    opacity: 0.75;
    font-size: 0.9em;
  }
  .error {
    color: #d32f2f;
  }
  .chip.s-vencida,
  .chip.s-urgente {
    border-color: #c62828;
  }
  .chip.s-pronto {
    border-color: #b26a00;
  }
  .chip.s-tranquila {
    border-color: #2e7d32;
  }
  .chip.s-pagada {
    border-color: #546e7a;
  }
  .chip.s-omitida {
    border-color: #9e9e9e;
  }
</style>
