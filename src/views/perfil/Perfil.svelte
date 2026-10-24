<script lang="ts">
  // V17 Perfil y tributos activos. Edits the saved profile in place.
  // Nothing is stored until "Guardar cambios". No fiscal logic here: see `perfilForm.ts`.
  import { untrack } from 'svelte';
  import { NAME_MAX, onboardingTributos } from '../../app/onboarding';
  import {
    businessChanged,
    canSave,
    draftFromPerfil,
    hasChanges,
    resetTributos,
    setEmpleados,
    toChanges,
    toggleTributo,
    validateForm,
  } from '../../app/perfilForm';
  import type { Perfil } from '../../data/models';
  import { esOnboarding as o } from '../../i18n/onboarding';
  import { esPerfil as t } from '../../i18n/perfil';
  import { errorMessage, updatePerfil } from '../../stores/perfil.svelte';

  let { perfil }: { perfil: Perfil } = $props();

  const tributos = onboardingTributos();

  let draft = $state(untrack(() => draftFromPerfil(perfil)));
  let showErrors = $state(false);
  let busy = $state(false);
  let failure = $state<string | null>(null);
  let justSaved = $state(false);
  let onatReminder = $state(false);

  const errors = $derived(validateForm(draft));
  const dirty = $derived(hasChanges(perfil, draft));

  async function save(): Promise<void> {
    showErrors = true;
    failure = null;
    justSaved = false;
    if (!canSave(draft)) return;
    const reportable = businessChanged(perfil, draft);
    busy = true;
    try {
      await updatePerfil(toChanges(draft));
      showErrors = false;
      justSaved = true;
      if (reportable) onatReminder = true;
    } catch (e) {
      failure = errorMessage(e);
    } finally {
      busy = false;
    }
  }
</script>

<section class="profile">
  <h2>{t.title}</h2>

  <form
    novalidate
    onsubmit={(e) => {
      e.preventDefault();
      void save();
    }}
  >
    <h3>{t.basicTitle}</h3>

    <label for="pf-name">{t.nameLabel}</label>
    <input
      id="pf-name"
      type="text"
      autocomplete="off"
      maxlength={NAME_MAX + 20}
      aria-invalid={showErrors && errors.some((x) => x.startsWith('name'))}
      bind:value={draft.nombreVisible}
    />
    {#if showErrors}
      {#each errors.filter((x) => x.startsWith('name')) as e (e)}
        <p class="error" role="alert">{t.error(e)}</p>
      {/each}
    {/if}

    <label for="pf-activity-code">{t.activityCodeLabel}</label>
    <input
      id="pf-activity-code"
      type="text"
      inputmode="numeric"
      autocomplete="off"
      bind:value={draft.actividadCodigo}
    />

    <label for="pf-activity-name">{t.activityNameLabel}</label>
    <input id="pf-activity-name" type="text" autocomplete="off" bind:value={draft.actividadNombre} />

    <label for="pf-municipio">{t.municipioLabel}</label>
    <input id="pf-municipio" type="text" autocomplete="off" bind:value={draft.municipio} />

    <label for="pf-municipio-code">{t.municipioCodigoLabel}</label>
    <input
      id="pf-municipio-code"
      type="text"
      inputmode="numeric"
      autocomplete="off"
      bind:value={draft.municipioCodigo}
    />

    <label for="pf-fecha">{t.fechaLabel}</label>
    <input id="pf-fecha" type="date" bind:value={draft.fechaInscripcionFiscal} />
    {#if showErrors && errors.includes('fecha-invalid')}
      <p class="error" role="alert">{t.error('fecha-invalid')}</p>
    {/if}

    <h3>{t.idTitle}</h3>
    <p class="hint">{t.idHint}</p>

    <label for="pf-rc05">{t.rc05Label}</label>
    <input
      id="pf-rc05"
      type="text"
      inputmode="numeric"
      autocomplete="off"
      aria-invalid={showErrors && errors.includes('rc05-invalid')}
      bind:value={draft.rc05}
    />
    {#if showErrors && errors.includes('rc05-invalid')}
      <p class="error" role="alert">{t.error('rc05-invalid')}</p>
    {/if}

    <label for="pf-nit">{t.nitLabel}</label>
    <input
      id="pf-nit"
      type="text"
      inputmode="numeric"
      autocomplete="off"
      aria-invalid={showErrors && errors.includes('nit-invalid')}
      bind:value={draft.nit}
    />
    {#if showErrors && errors.includes('nit-invalid')}
      <p class="error" role="alert">{t.error('nit-invalid')}</p>
    {/if}

    <label class="check">
      <input
        type="checkbox"
        checked={draft.tieneEmpleados}
        onchange={(e) => (draft = setEmpleados(draft, e.currentTarget.checked))}
      />
      <span>{t.employeesLabel}</span>
    </label>
    <p class="hint">{t.employeesHint}</p>

    <h3>{t.tributosTitle}</h3>
    <p class="hint">{t.tributosHint}</p>

    <ul class="tributos">
      {#each tributos as tr (tr.code)}
        <li>
          <label class="check">
            <input
              type="checkbox"
              checked={draft.tributosActivos.includes(tr.code)}
              onchange={() => (draft = toggleTributo(draft, tr.code))}
            />
            <span>
              <strong>{tr.shortName}</strong>
              <small>
                {tr.code} · {o.periodicity[tr.periodicity]}{tr.requiresEmployees
                  ? ` · ${o.withEmployeesTag}`
                  : ''}
              </small>
            </span>
          </label>
        </li>
      {/each}
    </ul>

    {#if showErrors && errors.includes('tributos-required')}
      <p class="error" role="alert">{t.error('tributos-required')}</p>
    {/if}
    {#if draft.tributosEditados}
      <button type="button" onclick={() => (draft = resetTributos(draft))}>
        {o.resetSuggestion}
      </button>
    {/if}

    {#if failure}
      <p class="error" role="alert">{t.saveError}: {failure}</p>
    {/if}
    {#if justSaved && !dirty}
      <p role="status">{t.saved}</p>
    {/if}
    {#if onatReminder}
      <div class="notice" role="status">
        <strong>{t.onatReminderTitle}</strong>
        <p>{t.onatReminder}</p>
      </div>
    {/if}

    <button type="submit" disabled={busy || !dirty}>{t.save}</button>
  </form>
</section>

<style>
  .profile,
  form {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  h2,
  h3,
  p {
    margin: 0;
  }
  h3 {
    margin-top: 8px;
  }
  input[type='text'],
  input[type='date'] {
    width: 100%;
    min-height: 44px;
    padding: 0 12px;
    box-sizing: border-box;
    font-size: 16px;
  }
  button {
    min-height: 44px;
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
  .check small {
    display: block;
    opacity: 0.75;
  }
  .tributos {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .hint {
    opacity: 0.75;
    font-size: 0.9em;
  }
  .error {
    color: #d32f2f;
  }
  .notice {
    padding: 8px 12px;
    border: 1px solid currentColor;
    border-radius: 8px;
  }
</style>
