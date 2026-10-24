<script lang="ts">
  // V01 Onboarding, 5 steps: welcome, profile, tributos, notifications, year dates.
  // Nothing is stored until the last step; then the permission state, the year's
  // obligations and the completed profile are saved, in that order. The profile goes
  // last so a failure leaves onboarding unfinished and the user can retry (idempotent).
  import {
    NAME_MAX,
    ONBOARDING_TOTAL_STEPS,
    canAdvance,
    draftFromPerfil,
    emptyDraft,
    nextStep,
    onboardingTributos,
    prevStep,
    resetTributos,
    setNotificationPermission,
    setTieneEmpleados,
    setVectorDate,
    setYearMode,
    stepNumber,
    toPerfilInput,
    toggleTributo,
    validateStep,
    type OnboardingStep,
  } from '../../app/onboarding';
  import { buildPlan, groupPlan, patternDates, planSummary, yearOf } from '../../app/yearDates';
  import { localISODate } from '../../domain/dates';
  import { obligationKey } from '../../domain/schedule';
  import { esOnboarding as t } from '../../i18n/onboarding';
  import {
    checkNotificationPermission,
    requestNotificationPermission,
  } from '../../services/notifications';
  import { saveNotificationPermission } from '../../stores/ajustes';
  import { addObligationDrafts } from '../../stores/obligaciones';
  import { errorMessage, perfilStore, savePerfil } from '../../stores/perfil.svelte';

  const tributos = onboardingTributos();
  const today = localISODate(new Date());

  let draft = $state(perfilStore.perfil ? draftFromPerfil(perfilStore.perfil) : emptyDraft());
  let step = $state<OnboardingStep>('bienvenida');
  let showErrors = $state(false);
  let busy = $state(false);
  let failure = $state<string | null>(null);

  const errors = $derived(validateStep(step, draft));

  // Year dates (step 5). Vector dates only count in vector mode.
  const plan = $derived(
    buildPlan({
      activeTributos: draft.tributosActivos,
      today,
      ...(draft.fechasModo === 'vector' ? { vectorDates: draft.fechasVector } : {}),
    }),
  );
  const pattern = $derived(patternDates({ activeTributos: draft.tributosActivos, today }));
  const groups = $derived(groupPlan(plan));
  const summary = $derived(planSummary(plan));

  async function refreshPermission(): Promise<void> {
    draft = setNotificationPermission(draft, await checkNotificationPermission());
  }

  async function askPermission(): Promise<void> {
    busy = true;
    try {
      draft = setNotificationPermission(draft, await requestNotificationPermission());
    } finally {
      busy = false;
    }
  }

  async function advance(): Promise<void> {
    showErrors = true;
    if (!canAdvance(step, draft)) return;
    const next = nextStep(step);
    if (next) {
      step = next;
      showErrors = false;
      if (next === 'notificaciones') void refreshPermission();
      return;
    }
    busy = true;
    failure = null;
    try {
      await saveNotificationPermission(draft.notificationPermission);
      await addObligationDrafts(plan);
      // Last: once the profile is complete the guard leaves this view.
      await savePerfil(toPerfilInput(draft, true));
    } catch (e) {
      failure = errorMessage(e);
    } finally {
      busy = false;
    }
  }

  function back(): void {
    const previous = prevStep(step);
    if (!previous) return;
    step = previous;
    showErrors = false;
    failure = null;
  }
</script>

<section class="wizard">
  <p class="hint">{t.stepLabel(stepNumber(step), ONBOARDING_TOTAL_STEPS)}</p>

  <form
    novalidate
    onsubmit={(e) => {
      e.preventDefault();
      void advance();
    }}
  >
    {#if step === 'bienvenida'}
      <h2>{t.welcomeTitle}</h2>
      <p>{t.welcomeLead}</p>
      <ul>
        {#each t.welcomePoints as point}
          <li>{point}</li>
        {/each}
      </ul>
    {:else if step === 'perfil'}
      <h2>{t.profileTitle}</h2>

      <label for="ob-name">{t.nameLabel}</label>
      <input
        id="ob-name"
        type="text"
        autocomplete="off"
        aria-invalid={showErrors && errors.length > 0}
        bind:value={draft.nombreVisible}
      />
      <p class="hint">{t.nameHint}</p>
      {#if showErrors && errors.includes('name-required')}
        <p class="error" role="alert">{t.nameRequired}</p>
      {/if}
      {#if showErrors && errors.includes('name-too-long')}
        <p class="error" role="alert">{t.nameTooLong(NAME_MAX)}</p>
      {/if}

      <label for="ob-activity-code">{t.activityCodeLabel}</label>
      <input
        id="ob-activity-code"
        type="text"
        inputmode="numeric"
        autocomplete="off"
        bind:value={draft.actividadCodigo}
      />

      <label for="ob-activity-name">{t.activityNameLabel}</label>
      <input
        id="ob-activity-name"
        type="text"
        autocomplete="off"
        bind:value={draft.actividadNombre}
      />

      <label class="check">
        <input
          type="checkbox"
          checked={draft.tieneEmpleados}
          onchange={(e) => (draft = setTieneEmpleados(draft, e.currentTarget.checked))}
        />
        <span>{t.employeesLabel}</span>
      </label>
      <p class="hint">{t.employeesHint}</p>
    {:else if step === 'tributos'}
      <h2>{t.tributosTitle}</h2>
      <p>{t.tributosLead}</p>
      <p class="hint">{t.tributosEventualHint}</p>

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
                  {tr.code} · {t.periodicity[tr.periodicity]}{tr.requiresEmployees
                    ? ` · ${t.withEmployeesTag}`
                    : ''}
                </small>
              </span>
            </label>
          </li>
        {/each}
      </ul>

      {#if showErrors && errors.includes('tributos-required')}
        <p class="error" role="alert">{t.tributosRequired}</p>
      {/if}
      {#if draft.tributosEditados}
        <button type="button" onclick={() => (draft = resetTributos(draft))}>
          {t.resetSuggestion}
        </button>
      {/if}
    {:else if step === 'notificaciones'}
      <h2>{t.notifTitle}</h2>
      <p>{t.notifLead}</p>

      <p role="status">
        {#if draft.notificationPermission === 'granted'}
          {t.notifStatusGranted}
        {:else if draft.notificationPermission === 'denied'}
          {t.notifStatusDenied}
        {:else}
          {t.notifStatusUnknown}
        {/if}
      </p>

      {#if draft.notificationPermission !== 'granted'}
        <button type="button" onclick={askPermission} disabled={busy}>{t.notifAllow}</button>
      {/if}
    {:else}
      <h2>{t.datesTitle}</h2>
      <p>{t.datesLead(yearOf(today))}</p>

      <label class="check">
        <input
          type="radio"
          name="ob-mode"
          checked={draft.fechasModo === 'patron'}
          onchange={() => (draft = setYearMode(draft, 'patron'))}
        />
        <span>
          <strong>{t.modePattern}</strong>
          <small>{t.modePatternHint}</small>
        </span>
      </label>
      <label class="check">
        <input
          type="radio"
          name="ob-mode"
          checked={draft.fechasModo === 'vector'}
          onchange={() => (draft = setYearMode(draft, 'vector'))}
        />
        <span>
          <strong>{t.modeVector}</strong>
          <small>{t.modeVectorHint}</small>
        </span>
      </label>

      {#if summary.first && summary.last}
        <p>{t.summary(summary.count, summary.first, summary.last)}</p>
      {:else}
        <p>{t.summaryNone}</p>
      {/if}

      {#if draft.fechasModo === 'vector'}
        {#each groups as group (group.code)}
          <fieldset>
            <legend>{group.name}</legend>
            {#each group.rows as row (row.periodoClave)}
              {@const key = obligationKey(row.tributoCodigo, row.periodoClave)}
              <div class="date-row">
                <label for={'ob-date-' + key}>
                  {row.periodoEtiqueta}
                  <small>{t.patternPrefix}: {pattern[key]}</small>
                </label>
                <input
                  id={'ob-date-' + key}
                  type="date"
                  value={draft.fechasVector[key] ?? ''}
                  onchange={(e) => (draft = setVectorDate(draft, key, e.currentTarget.value))}
                />
              </div>
            {/each}
          </fieldset>
        {/each}
      {/if}

      <p class="hint">{t.holidaysNote}</p>
      <p class="hint">{t.estimateNotice}</p>
    {/if}

    {#if failure}
      <p class="error" role="alert">{t.saveError}: {failure}</p>
    {/if}

    <div class="actions">
      {#if prevStep(step)}
        <button type="button" onclick={back} disabled={busy}>{t.back}</button>
      {/if}
      <button type="submit" disabled={busy}>
        {step === 'bienvenida' ? t.start : nextStep(step) === null ? t.finish : t.next}
      </button>
    </div>
  </form>
</section>

<style>
  .wizard,
  form {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  h2,
  p {
    margin: 0;
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
  .check small,
  .date-row small {
    display: block;
    opacity: 0.75;
  }
  .tributos {
    list-style: none;
    margin: 0;
    padding: 0;
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
