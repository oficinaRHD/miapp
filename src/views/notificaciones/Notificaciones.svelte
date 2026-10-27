<script lang="ts">
  // V16: permission, preferences (days before and hour), pending notices, test and battery guide.
  import { onMount } from 'svelte';
  import { DEFAULT_AVISOS, type AvisosSettings } from '../../app/avisos';
  import {
    OFFSET_CHOICES,
    draftFromSettings,
    hasChanges,
    setTime,
    toSettings,
    toggleOffset,
    validateDraft,
    type AvisosDraft,
  } from '../../app/avisosForm';
  import { DEFAULT_REMINDERS, setReminder, type ReminderSettings } from '../../app/recordatorios';
  import type { NotificationPermissionState } from '../../app/notificationPermission';
  import {
    checkNotificationPermission,
    countPendingNotices,
    countPendingReminders,
    isNotificationsSupported,
    requestNotificationPermission,
    sendTestNotice,
  } from '../../services/notifications';
  import { saveNotificationPermission } from '../../stores/ajustes';
  import {
    loadAvisosSettings,
    loadReminderSettings,
    rescheduleNotices,
    saveAvisosSettings,
    saveReminderSettings,
  } from '../../stores/avisos';
  import { esNotificaciones as t, offsetLabel, resultText, testText } from '../../i18n/notificaciones';

  type Message = { kind: 'ok' | 'error'; text: string };

  const supported = isNotificationsSupported();
  let permiso = $state<NotificationPermissionState>('unknown');
  let pending = $state(0);
  let pendingReminders = $state(0);
  let reminders = $state<ReminderSettings>(DEFAULT_REMINDERS);
  let saved = $state<AvisosSettings>(DEFAULT_AVISOS);
  let draft = $state<AvisosDraft>(draftFromSettings(DEFAULT_AVISOS));
  let busy = $state(false);
  let message = $state<Message | null>(null);

  const formError = $derived(validateDraft(draft));
  const dirty = $derived(hasChanges(draft, saved));

  function messageOf(e: unknown): string {
    return e instanceof Error ? e.message : String(e);
  }

  // The real permission is read every time (it can change in Android's settings).
  async function refresh(): Promise<void> {
    permiso = await checkNotificationPermission();
    if (supported) await saveNotificationPermission(permiso);
    pending = await countPendingNotices();
    pendingReminders = await countPendingReminders();
  }

  async function loadPrefs(): Promise<void> {
    saved = await loadAvisosSettings();
    draft = draftFromSettings(saved);
    reminders = await loadReminderSettings();
  }

  onMount(() => {
    Promise.all([refresh(), loadPrefs()]).catch((e: unknown) => {
      message = { kind: 'error', text: `${t.actionError}: ${messageOf(e)}` };
    });
  });

  async function run(action: () => Promise<Message>): Promise<void> {
    busy = true;
    message = null;
    try {
      message = await action();
      await refresh();
    } catch (e) {
      message = { kind: 'error', text: `${t.actionError}: ${messageOf(e)}` };
    } finally {
      busy = false;
    }
  }

  function ask(): Promise<void> {
    return run(async () => {
      const state = await requestNotificationPermission();
      await saveNotificationPermission(state);
      if (state !== 'granted') return { kind: 'ok', text: t.permission[state] };
      return { kind: 'ok', text: resultText(await rescheduleNotices()) };
    });
  }

  function savePrefs(): Promise<void> {
    return run(async () => {
      const settings = toSettings(draft);
      await saveAvisosSettings(settings);
      saved = settings;
      const r = await rescheduleNotices();
      return { kind: r.status === 'error' ? 'error' : 'ok', text: `${t.saved} ${resultText(r)}` };
    });
  }

  function toggleReminderSetting(kind: keyof ReminderSettings, on: boolean): Promise<void> {
    return run(async () => {
      const next = setReminder(reminders, kind, on);
      await saveReminderSettings(next);
      reminders = next;
      const r = await rescheduleNotices();
      return { kind: r.status === 'error' ? 'error' : 'ok', text: t.remindersSaved };
    });
  }

  function reschedule(): Promise<void> {
    return run(async () => {
      const r = await rescheduleNotices();
      return { kind: r.status === 'error' ? 'error' : 'ok', text: resultText(r) };
    });
  }

  function test(): Promise<void> {
    return run(async () => ({ kind: 'ok', text: testText(await sendTestNotice()) }));
  }
</script>

<section>
  <p><a href="#/">{t.back}</a></p>
  <h1>{t.title}</h1>

  {#if message}
    <p role={message.kind === 'error' ? 'alert' : 'status'} class={message.kind}>{message.text}</p>
  {/if}

  <div class="card">
    <h2>{t.permissionTitle}</h2>
    <p>{t.permission[permiso]}</p>
    {#if supported && permiso !== 'granted'}
      <button type="button" onclick={ask} disabled={busy}>{busy ? t.working : t.ask}</button>
    {/if}
  </div>

  <div class="card">
    <h2>{t.prefsTitle}</h2>
    <p>{t.prefsBody}</p>
    {#each OFFSET_CHOICES as offset (offset)}
      <label class="check">
        <input
          type="checkbox"
          checked={draft.offsets.includes(offset)}
          onchange={() => (draft = toggleOffset(draft, offset))}
        />
        <span>{offsetLabel(offset)}</span>
      </label>
    {/each}
    <label class="field">
      <span>{t.timeLabel}</span>
      <input
        type="time"
        value={draft.time}
        oninput={(e) => (draft = setTime(draft, e.currentTarget.value))}
      />
    </label>
    {#if formError}
      <p role="alert" class="error">{t.formError[formError]}</p>
    {/if}
    <button type="button" onclick={savePrefs} disabled={busy || !dirty || formError !== null}>
      {busy ? t.working : t.save}
    </button>
  </div>

  <div class="card">
    <h2>{t.remindersTitle}</h2>
    <p>{t.remindersBody}</p>
    <label class="check">
      <input
        type="checkbox"
        checked={reminders.registro}
        disabled={busy}
        onchange={(e) => toggleReminderSetting('registro', e.currentTarget.checked)}
      />
      <span>{t.reminderRegistro}</span>
    </label>
    <label class="check">
      <input
        type="checkbox"
        checked={reminders.calculadora}
        disabled={busy}
        onchange={(e) => toggleReminderSetting('calculadora', e.currentTarget.checked)}
      />
      <span>{t.reminderCalculadora}</span>
    </label>
    <p>{t.reminderRespaldo} <a href="#/ajustes/respaldo">{t.reminderBackupLink}</a></p>
    <p class="note">{t.remindersPending(pendingReminders)}</p>
  </div>

  <div class="card">
    <h2>{t.pendingTitle}</h2>
    <p>{t.pendingCount(pending)}</p>
    <p class="note">{t.pendingNote}</p>
    <button type="button" onclick={reschedule} disabled={busy}>{busy ? t.working : t.reschedule}</button>
  </div>

  <div class="card">
    <h2>{t.testTitle}</h2>
    <button type="button" onclick={test} disabled={busy}>{busy ? t.working : t.test}</button>
  </div>

  <details class="card">
    <summary>{t.battery.title}</summary>
    <p>{t.battery.intro}</p>
    <ol>
      {#each t.battery.steps as step (step)}
        <li>{step}</li>
      {/each}
    </ol>
    <p class="note">{t.battery.tip}</p>
  </details>
</section>

<style>
  .card {
    margin: 16px 0;
    padding: 12px;
    border: 1px solid currentColor;
    border-radius: 8px;
  }
  h2 {
    margin: 0 0 8px;
    font-size: 1.05rem;
  }
  summary {
    min-height: 44px;
    display: flex;
    align-items: center;
    font-weight: 600;
    cursor: pointer;
  }
  button {
    min-height: 44px;
    padding: 0 12px;
  }
  .check {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin: 8px 0;
  }
  .field input {
    min-height: 44px;
    padding: 0 8px;
  }
  .note {
    font-size: 0.9rem;
    opacity: 0.8;
  }
  .error {
    font-weight: 600;
  }
</style>
