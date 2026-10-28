<script lang="ts">
  // "Editar fechas del año": the user types the dates of their vector. Only changed,
  // pending obligations are saved (venceOrigen 'vector'); paid ones are never touched.
  import type { Obligacion } from '../../data/models';
  import { yearOf } from '../../app/yearDates';
  import {
    defaultYear,
    editableRows,
    fiscalYears,
    groupEditable,
    patternByKey,
    pendingChanges,
    setEditDate,
    type EditDraft,
  } from '../../app/editDates';
  import { holidaysStore } from '../../stores/holidays.svelte';
  import { formatDate } from '../../app/format';
  import { obligationKey } from '../../domain/schedule';
  import type { ISODate } from '../../domain/types';
  import { obligaciones } from '../../i18n/obligaciones';
  import { setObligationDueDates, type SaveResult } from '../../stores/obligaciones';
  import { errorMessage } from '../../stores/perfil.svelte';

  const t = obligaciones.editDates;

  let {
    obligaciones: all,
    today,
    onclose,
  }: {
    obligaciones: Obligacion[];
    today: ISODate;
    onclose: (result: SaveResult | null) => void;
  } = $props();

  let chosen = $state<number | null>(null);
  let draft = $state<EditDraft>({});
  let busy = $state(false);
  let failure = $state<string | null>(null);

  const years = $derived(fiscalYears(all));
  const year = $derived(chosen ?? defaultYear(years, yearOf(today)));
  const rows = $derived(editableRows(all, year));
  const groups = $derived(groupEditable(rows));
  const pattern = $derived(patternByKey(rows.map((o) => o.tributoCodigo), year, holidaysStore.value));
  const changes = $derived(pendingChanges(all, draft));

  function moveYear(delta: number): void {
    const i = years.indexOf(year) + delta;
    const next = years[i];
    if (next !== undefined) chosen = next;
  }

  async function save(): Promise<void> {
    busy = true;
    failure = null;
    try {
      onclose(await setObligationDueDates(changes));
    } catch (e) {
      failure = errorMessage(e);
    } finally {
      busy = false;
    }
  }
</script>

<section>
  <h2>{t.title}</h2>
  <p>{t.lead}</p>
  <p class="hint">{t.scope}</p>

  {#if years.length > 1}
    <div class="years">
      <button
        type="button"
        aria-label={t.prevYear}
        disabled={years.indexOf(year) <= 0}
        onclick={() => moveYear(-1)}>‹</button>
      <strong>{t.yearLabel} {year}</strong>
      <button
        type="button"
        aria-label={t.nextYear}
        disabled={years.indexOf(year) >= years.length - 1}
        onclick={() => moveYear(1)}>›</button>
    </div>
  {/if}

  {#if groups.length === 0}
    <p>{t.empty}</p>
  {:else}
    {#each groups as group (group.code)}
      <fieldset>
        <legend>{group.name}</legend>
        {#each group.rows as o (o.id)}
          {@const key = obligationKey(o.tributoCodigo, o.periodoClave)}
          {@const calc = pattern[key]}
          <div class="date-row">
            <label for={'ed-' + o.id}>
              {o.periodoEtiqueta}
              <small>
                {t.now}: {formatDate(o.vence)} · {t.pattern}: {calc ? formatDate(calc) : '—'}
              </small>
            </label>
            <input
              id={'ed-' + o.id}
              type="date"
              value={draft[o.id] ?? o.vence}
              onchange={(e) => (draft = setEditDate(draft, o.id, e.currentTarget.value))}
            />
          </div>
        {/each}
      </fieldset>
    {/each}
  {/if}

  {#if holidaysStore.value.size === 0}<p class="hint">{t.holidaysNote}</p>{/if}
  <p class="hint">{t.estimateNotice}</p>

  {#if failure}
    <p class="error" role="alert">{t.saveError}: {failure}</p>
  {/if}

  <p role="status"><strong>{t.changes(changes.length)}</strong></p>
  <div class="actions">
    <button type="button" onclick={() => onclose(null)} disabled={busy}>{t.cancel}</button>
    <button type="button" onclick={save} disabled={busy || changes.length === 0}>{t.save}</button>
  </div>
</section>

<style>
  section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  h2,
  p {
    margin: 0;
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
  input[type='date'] {
    width: 100%;
    min-height: 44px;
    padding: 0 12px;
    box-sizing: border-box;
    font-size: 16px;
  }
  .years {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  fieldset {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 0;
    padding: 8px 12px;
  }
  .date-row {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .date-row small {
    display: block;
    opacity: 0.75;
  }
  .hint {
    opacity: 0.75;
    font-size: 0.9em;
  }
  .error {
    color: #d32f2f;
  }
  .actions {
    display: flex;
    gap: 8px;
  }
  .actions button {
    flex: 1;
  }
</style>
