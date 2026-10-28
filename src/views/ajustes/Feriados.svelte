<script lang="ts">
  // V14 "Feriados": the user types the holidays; each change is saved at once. No fiscal logic here.
  import { onMount } from 'svelte';
  import {
    addFeriado,
    feriadoDateText,
    groupByYear,
    mergeFeriados,
    removeFeriado,
    validateFeriado,
    type FeriadoError,
    type FeriadoItem,
  } from '../../app/feriadosForm';
  import { feriadosFijosDe } from '../../domain/feriadosFijos';
  import { esFeriados as t } from '../../i18n/feriados';
  import { listFeriados, saveFeriados } from '../../stores/feriados';
  import { refreshHolidays } from '../../stores/holidays.svelte';

  let list = $state<FeriadoItem[]>([]);
  let fecha = $state('');
  let nombre = $state('');
  let formError = $state<FeriadoError | null>(null);
  let message = $state<{ kind: 'ok' | 'error'; text: string } | null>(null);
  let removed = $state<FeriadoItem | null>(null);
  let busy = $state(false);
  let year = $state(String(new Date().getFullYear()));

  const groups = $derived(groupByYear(list));

  function messageOf(e: unknown): string {
    return e instanceof Error ? e.message : String(e);
  }

  onMount(() => {
    listFeriados()
      .then((rows) => (list = rows.map((r) => ({ fecha: r.fecha, nombre: r.nombre }))))
      .catch((e: unknown) => (message = { kind: 'error', text: `${t.actionError}: ${messageOf(e)}` }));
  });

  // Saves `next`; on failure the list on screen stays as it was.
  async function commit(next: FeriadoItem[]): Promise<boolean> {
    busy = true;
    try {
      await saveFeriados(next);
      list = next;
      await refreshHolidays();
      return true;
    } catch (e) {
      message = { kind: 'error', text: `${t.actionError}: ${messageOf(e)}` };
      return false;
    } finally {
      busy = false;
    }
  }

  async function add(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    formError = validateFeriado({ fecha, nombre }, list);
    if (formError) return;
    message = null;
    removed = null;
    if (await commit(addFeriado(list, { fecha, nombre }))) {
      fecha = '';
      nombre = '';
      message = { kind: 'ok', text: t.added };
    }
  }

  async function addFixed(): Promise<void> {
    const y = Number(year);
    if (!Number.isInteger(y) || y < 1900 || y > 2200) {
      message = { kind: 'error', text: t.fixedYearError };
      return;
    }
    message = null;
    removed = null;
    const merged = mergeFeriados(list, feriadosFijosDe(y));
    if (merged.added === 0 || (await commit(merged.list))) {
      message = { kind: 'ok', text: t.fixedDone(merged.added) };
    }
  }

  async function remove(item: FeriadoItem): Promise<void> {
    message = null;
    if (await commit(removeFeriado(list, item.fecha))) {
      removed = item;
      message = { kind: 'ok', text: t.removed(item.nombre) };
    }
  }

  async function undo(): Promise<void> {
    if (!removed) return;
    const item = removed;
    if (validateFeriado(item, list) !== null) {
      removed = null;
      return;
    }
    if (await commit(addFeriado(list, item))) {
      removed = null;
      message = null;
    }
  }
</script>

<section>
  <p><a href="#/ajustes">{t.back}</a></p>
  <h1>{t.title}</h1>
  <p>{t.intro}</p>

  {#if list.length === 0}
    <p class="note">{t.emptyWarning}</p>
  {/if}

  {#if message}
    <p role={message.kind === 'error' ? 'alert' : 'status'}>
      {message.text}
      {#if removed && message.kind === 'ok'}
        <button type="button" class="undo" onclick={undo} disabled={busy}>{t.undo}</button>
      {/if}
    </p>
  {/if}

  <div class="card">
    <h2>{t.fixedTitle}</h2>
    <p class="note">{t.fixedBody}</p>
    <label class="field">
      <span>{t.fixedYear}</span>
      <input type="number" inputmode="numeric" bind:value={year} min="1900" max="2200" />
    </label>
    <button type="button" onclick={addFixed} disabled={busy}>{t.fixedButton}</button>
  </div>

  <form class="card" onsubmit={add} novalidate>
    <h2>{t.addTitle}</h2>
    <label class="field">
      <span>{t.dateLabel}</span>
      <input type="date" bind:value={fecha} />
    </label>
    <label class="field">
      <span>{t.nameLabel}</span>
      <input type="text" bind:value={nombre} maxlength="80" placeholder={t.namePlaceholder} />
    </label>
    {#if formError}
      <p role="alert" class="error">{t.errors[formError]}</p>
    {/if}
    <button type="submit" disabled={busy}>{t.add}</button>
  </form>

  <h2>{t.listTitle}</h2>
  {#if list.length === 0}
    <p>{t.empty}</p>
  {:else}
    <p class="note">{t.count(list.length)}</p>
    {#each groups as group (group.year)}
      <h3>{group.year}</h3>
      <ul>
        {#each group.items as item (item.fecha)}
          <li class="card row">
            <span class="info">
              <strong>{feriadoDateText(item.fecha)}</strong>
              <span class="note">{item.nombre}</span>
            </span>
            <button type="button" onclick={() => remove(item)} disabled={busy}>{t.remove}</button>
          </li>
        {/each}
      </ul>
    {/each}
  {/if}
</section>

<style>
  .card {
    margin: 12px 0;
    padding: 12px;
    border: 1px solid currentColor;
    border-radius: 8px;
  }
  h2 {
    margin: 12px 0 8px;
    font-size: 1.05rem;
  }
  h3 {
    margin: 12px 0 4px;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin: 8px 0;
  }
  button {
    min-height: 44px;
    padding: 0 12px;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin: 8px 0;
  }
  .info {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .note {
    font-size: 0.9rem;
  }
  .undo {
    margin-left: 8px;
  }
</style>
