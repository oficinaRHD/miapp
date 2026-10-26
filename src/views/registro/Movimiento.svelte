<script lang="ts">
  // V07 Movimiento: create or edit an income/expense. No fiscal logic here: see `registro.ts`.
  import { onMount, untrack } from 'svelte';
  import { navigate } from '../../app/router.svelte';
  import {
    amountFromText,
    canSave,
    draftFromMovimiento,
    hasChanges,
    newDraft,
    setTipo,
    toMovimientoInput,
    validateDraft,
    type MovimientoDraft,
  } from '../../app/registro';
  import { todayLocal } from '../../app/today';
  import { formatCup } from '../../domain/money';
  import type { Categoria, MetodoPago, Movimiento, TipoMovimiento } from '../../data/models';
  import { esRegistro as t } from '../../i18n/registro';
  import {
    addMovement,
    getMovement,
    listCategories,
    removeMovement,
    restoreMovement,
    updateMovement,
  } from '../../stores/movimientos';
  import { errorMessage } from '../../stores/perfil.svelte';

  let { id, tipo = 'ingreso' }: { id?: string; tipo?: TipoMovimiento } = $props();

  const today = todayLocal();
  const TIPOS: TipoMovimiento[] = ['ingreso', 'gasto'];
  const METODOS: MetodoPago[] = ['efectivo', 'transferencia', 'otro'];

  let categorias = $state<Categoria[]>([]);
  let saved = $state<Movimiento | null>(null);
  let draft = $state<MovimientoDraft>(untrack(() => newDraft(tipo, today)));
  let loading = $state(true);
  let loadFailure = $state<string | null>(null);
  let notFound = $state(false);
  let showErrors = $state(false);
  let busy = $state(false);
  let failure = $state<string | null>(null);
  let notice = $state<string | null>(null);
  let removed = $state<Movimiento | null>(null);

  const errors = $derived(validateDraft(draft, categorias));
  const options = $derived(categorias.filter((c) => c.tipo === draft.tipo));
  const amount = $derived(amountFromText(draft.montoText));
  const dirty = $derived(saved ? hasChanges(draft, saved) : true);

  onMount(() => {
    void load();
  });

  async function load(): Promise<void> {
    try {
      categorias = await listCategories();
      if (id) {
        const m = await getMovement(id);
        if (m) {
          saved = m;
          draft = draftFromMovimiento(m);
        } else {
          notFound = true;
        }
      }
    } catch (e) {
      loadFailure = errorMessage(e);
    } finally {
      loading = false;
    }
  }

  function chooseTipo(next: TipoMovimiento): void {
    draft = setTipo(draft, next, categorias);
  }

  async function save(another: boolean): Promise<void> {
    showErrors = true;
    failure = null;
    notice = null;
    if (!canSave(draft, categorias)) return;
    busy = true;
    try {
      const input = toMovimientoInput(draft);
      if (id) {
        await updateMovement(id, input);
      } else {
        await addMovement(input);
      }
      if (another && !id) {
        // Keep type, date, category and method: usually the next one is similar.
        draft = { ...newDraft(draft.tipo, today), fecha: draft.fecha, categoriaId: draft.categoriaId, metodo: draft.metodo };
        showErrors = false;
        notice = t.saved;
      } else {
        navigate('/registro');
      }
    } catch (e) {
      failure = `${t.saveError}: ${errorMessage(e)}`;
    } finally {
      busy = false;
    }
  }

  async function remove(): Promise<void> {
    if (!saved) return;
    busy = true;
    failure = null;
    try {
      removed = await removeMovement(saved.id);
    } catch (e) {
      failure = `${t.deleteError}: ${errorMessage(e)}`;
    } finally {
      busy = false;
    }
  }

  async function undo(): Promise<void> {
    if (!removed) return;
    busy = true;
    failure = null;
    try {
      const back = await restoreMovement(removed);
      saved = back;
      draft = draftFromMovimiento(back);
      removed = null;
      notice = t.undone;
    } catch (e) {
      failure = `${t.undoError}: ${errorMessage(e)}`;
    } finally {
      busy = false;
    }
  }
</script>

<section class="movement">
  <h2>{id ? t.editTitle : t.newTitle}</h2>

  {#if loading}
    <p>{t.loading}</p>
  {:else if loadFailure}
    <p class="error" role="alert">{t.loadError}: {loadFailure}</p>
    <a class="btn" href="#/registro">{t.back}</a>
  {:else if notFound}
    <p role="status">{t.notFound}</p>
    <a class="btn" href="#/registro">{t.back}</a>
  {:else if removed}
    <p role="status">{t.deleted}</p>
    {#if failure}
      <p class="error" role="alert">{failure}</p>
    {/if}
    <button type="button" disabled={busy} onclick={() => void undo()}>{t.undo}</button>
    <a class="btn" href="#/registro">{t.back}</a>
  {:else}
    <form
      novalidate
      onsubmit={(e) => {
        e.preventDefault();
        void save(false);
      }}
    >
      <div class="field">
        <span class="label" id="mv-tipo">{t.typeLabel}</span>
        <div class="segmented" role="group" aria-labelledby="mv-tipo">
          {#each TIPOS as tp (tp)}
            <button
              type="button"
              aria-pressed={draft.tipo === tp}
              class:on={draft.tipo === tp}
              onclick={() => chooseTipo(tp)}
            >
              {t.tipo[tp]}
            </button>
          {/each}
        </div>
      </div>

      <label for="mv-monto">{t.amountLabel}</label>
      <input
        id="mv-monto"
        type="text"
        inputmode="decimal"
        autocomplete="off"
        placeholder={t.amountHint}
        aria-invalid={showErrors && errors.includes('amount')}
        bind:value={draft.montoText}
      />
      {#if amount !== null && amount > 0}
        <p class="hint">{t.amountPreview(formatCup(amount))}</p>
      {/if}
      {#if showErrors && errors.includes('amount')}
        <p class="error" role="alert">{t.error('amount')}</p>
      {/if}

      <label for="mv-fecha">{t.dateLabel}</label>
      <input
        id="mv-fecha"
        type="date"
        aria-invalid={showErrors && errors.includes('date')}
        bind:value={draft.fecha}
      />
      {#if showErrors && errors.includes('date')}
        <p class="error" role="alert">{t.error('date')}</p>
      {/if}

      <label for="mv-categoria">{t.categoryLabel}</label>
      <select
        id="mv-categoria"
        aria-invalid={showErrors && (errors.includes('category') || errors.includes('category-type'))}
        bind:value={draft.categoriaId}
      >
        <option value="">{t.categoryPlaceholder}</option>
        {#each options as c (c.id)}
          <option value={c.id}>{c.nombre}</option>
        {/each}
      </select>
      {#if showErrors && errors.includes('category')}
        <p class="error" role="alert">{t.error('category')}</p>
      {/if}
      {#if showErrors && errors.includes('category-type')}
        <p class="error" role="alert">{t.error('category-type')}</p>
      {/if}

      <label for="mv-desc">{t.descriptionLabel}</label>
      <input id="mv-desc" type="text" autocomplete="off" bind:value={draft.descripcion} />

      <label for="mv-contraparte">{t.counterpartLabel[draft.tipo]}</label>
      <input id="mv-contraparte" type="text" autocomplete="off" bind:value={draft.contraparte} />

      <label for="mv-metodo">{t.methodLabel}</label>
      <select id="mv-metodo" bind:value={draft.metodo}>
        {#each METODOS as m (m)}
          <option value={m}>{t.metodo[m]}</option>
        {/each}
      </select>

      {#if draft.tipo === 'ingreso'}
        <label class="check">
          <input type="checkbox" bind:checked={draft.cuentaParaVentas} />
          <span>{t.countsLabel}</span>
        </label>
        <p class="hint">{t.countsHint}</p>
      {:else}
        <label class="check">
          <input type="checkbox" bind:checked={draft.justificado} />
          <span>{t.receiptLabel}</span>
        </label>
        <p class="hint">{t.receiptHint}</p>
      {/if}

      {#if failure}
        <p class="error" role="alert">{failure}</p>
      {/if}
      {#if notice}
        <p role="status">{notice}</p>
      {/if}

      <button type="submit" disabled={busy || !dirty}>{t.save}</button>
      {#if !id}
        <button type="button" disabled={busy} onclick={() => void save(true)}>
          {t.saveAndAnother}
        </button>
      {:else}
        <button type="button" class="danger" disabled={busy} onclick={() => void remove()}>
          {t.remove}
        </button>
      {/if}
      <a class="btn" href="#/registro">{t.cancel}</a>
    </form>
  {/if}
</section>

<style>
  .movement,
  form,
  .field {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  h2,
  p {
    margin: 0;
  }
  input[type='text'],
  input[type='date'],
  select {
    width: 100%;
    min-height: 44px;
    padding: 0 12px;
    box-sizing: border-box;
    font-size: 16px;
  }
  button,
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 44px;
    padding: 0 12px;
    box-sizing: border-box;
    color: inherit;
    text-decoration: none;
  }
  .btn {
    border: 1px solid currentColor;
    border-radius: 8px;
  }
  .segmented {
    display: flex;
    gap: 8px;
  }
  .segmented button {
    flex: 1;
  }
  .segmented button.on {
    font-weight: 700;
    outline: 2px solid currentColor;
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
  .hint {
    opacity: 0.75;
    font-size: 0.9em;
  }
  .error {
    color: #d32f2f;
  }
  .danger {
    color: #d32f2f;
  }
</style>
