<script lang="ts">
  // V16 (first version): permission, reschedule and test notice.
  // Preferences (days before, hour) and the full battery guide arrive in the next step.
  import { onMount } from 'svelte';
  import type { NotificationPermissionState } from '../../app/notificationPermission';
  import {
    checkNotificationPermission,
    countPendingNotices,
    isNotificationsSupported,
    requestNotificationPermission,
    sendTestNotice,
  } from '../../services/notifications';
  import { saveNotificationPermission } from '../../stores/ajustes';
  import { rescheduleNotices } from '../../stores/avisos';
  import { esNotificaciones as t, resultText, testText } from '../../i18n/notificaciones';

  type Message = { kind: 'ok' | 'error'; text: string };

  const supported = isNotificationsSupported();
  let permiso = $state<NotificationPermissionState>('unknown');
  let pending = $state(0);
  let busy = $state(false);
  let message = $state<Message | null>(null);

  function messageOf(e: unknown): string {
    return e instanceof Error ? e.message : String(e);
  }

  // The real permission is read every time (it can change in Android's settings).
  async function refresh(): Promise<void> {
    permiso = await checkNotificationPermission();
    if (supported) await saveNotificationPermission(permiso);
    pending = await countPendingNotices();
  }

  onMount(() => {
    refresh().catch((e: unknown) => {
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
    <h2>{t.pendingTitle}</h2>
    <p>{t.pendingCount(pending)}</p>
    <p class="note">{t.pendingNote}</p>
    <button type="button" onclick={reschedule} disabled={busy}>{busy ? t.working : t.reschedule}</button>
  </div>

  <div class="card">
    <h2>{t.testTitle}</h2>
    <button type="button" onclick={test} disabled={busy}>{busy ? t.working : t.test}</button>
  </div>

  <div class="card">
    <h2>{t.batteryTitle}</h2>
    <p>{t.batteryBody}</p>
  </div>
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
  button {
    min-height: 44px;
    padding: 0 12px;
  }
  .note {
    font-size: 0.9rem;
    opacity: 0.8;
  }
  .error {
    font-weight: 600;
  }
</style>
