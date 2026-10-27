<script lang="ts">
  // V15: export, import and wipe. No fiscal logic here; decisions live in src/app/respaldo.ts.
  import { onMount } from 'svelte';
  import { db } from '../../data';
  import { wipeAllData } from '../../data/backup';
  import { ensureSeed } from '../../data/seed';
  import { nowISO } from '../../data/util';
  import { createAndShareBackup, restoreBackupFromPicker } from '../../services/backupService';
  import { rescheduleNotices } from '../../stores/avisos';
  import { loadPerfil } from '../../stores/perfil.svelte';
  import {
    loadBackupReminder,
    loadIncludePersonal,
    loadLastBackup,
    saveBackupReminder,
    saveIncludePersonal,
    saveLastBackup,
  } from '../../stores/respaldo';
  import {
    backupState,
    isWipeConfirmed,
    parseLastBackup,
    shouldRecordBackup,
  } from '../../app/respaldo';
  import { todayLocal } from '../../app/today';
  import { esRespaldo as t } from '../../i18n/respaldo';

  type Message = { kind: 'ok' | 'error'; text: string };

  let lastBackup = $state<string | undefined>(undefined);
  let includePersonal = $state(false);
  let reminder = $state(true);
  let busy = $state(false);
  let message = $state<Message | null>(null);
  let confirmImport = $state(false);
  let confirmWipe = $state(false);
  let wipeText = $state('');

  const status = $derived(backupState(lastBackup, todayLocal()));
  const lastDate = $derived(lastBackup ? lastBackup.slice(0, 10) : '');
  const wipeReady = $derived(isWipeConfirmed(wipeText));

  function messageOf(e: unknown): string {
    return e instanceof Error ? e.message : String(e);
  }

  async function loadSettings(): Promise<void> {
    lastBackup = await loadLastBackup();
    includePersonal = await loadIncludePersonal();
    reminder = await loadBackupReminder();
  }

  onMount(() => {
    loadSettings().catch((e: unknown) => {
      message = { kind: 'error', text: `${t.loadError}: ${messageOf(e)}` };
    });
  });

  async function run(action: () => Promise<Message | null>): Promise<void> {
    busy = true;
    message = null;
    try {
      message = await action();
    } catch (e) {
      message = { kind: 'error', text: `${t.actionError}: ${messageOf(e)}` };
    } finally {
      busy = false;
    }
  }

  async function onIncludePersonal(): Promise<void> {
    try {
      await saveIncludePersonal(includePersonal);
    } catch (e) {
      message = { kind: 'error', text: `${t.actionError}: ${messageOf(e)}` };
    }
  }

  async function onReminder(): Promise<void> {
    try {
      await saveBackupReminder(reminder);
    } catch (e) {
      message = { kind: 'error', text: `${t.actionError}: ${messageOf(e)}` };
    }
  }

  function doExport(): Promise<void> {
    return run(async () => {
      const r = await createAndShareBackup(db, { includePersonal });
      if (shouldRecordBackup(r.outcome)) {
        const iso = nowISO();
        await saveLastBackup(iso);
        lastBackup = iso;
      }
      return {
        kind: 'ok',
        text: t.exportDone(r.outcome, r.fileName, r.counts.movimientos, r.counts.obligaciones),
      };
    });
  }

  function doImport(): Promise<void> {
    return run(async () => {
      confirmImport = false;
      const r = await restoreBackupFromPicker(db);
      if (r === null) return { kind: 'ok', text: t.importCancelled };
      await loadPerfil();
      await loadSettings();
      // The most recent backup we know of is the one just restored.
      const iso = parseLastBackup(r.exportadoEn);
      if (iso) {
        await saveLastBackup(iso);
        lastBackup = iso;
      }
      // The restored obligations replace the old ones, so the notices must follow.
      void rescheduleNotices();
      return {
        kind: 'ok',
        text: t.importDone(r.counts.movimientos, r.counts.obligaciones, r.preBackupName),
      };
    });
  }

  function doWipe(): Promise<void> {
    return run(async () => {
      confirmWipe = false;
      wipeText = '';
      await wipeAllData(db);
      await ensureSeed(db);
      await loadPerfil();
      await loadSettings();
      // No obligations left: this cancels the pending notices.
      void rescheduleNotices();
      return { kind: 'ok', text: t.wipeDone };
    });
  }
</script>

<section>
  <p><a href="#/">{t.back}</a></p>
  <h1>{t.title}</h1>
  <p>{t.intro}</p>

  {#if message}
    <p role={message.kind === 'error' ? 'alert' : 'status'} class={message.kind}>{message.text}</p>
  {/if}

  <div class="card">
    <h2>{t.lastTitle}</h2>
    {#if status.status === 'never'}
      <p>{t.never}</p>
    {:else if status.status === 'due' && status.days !== null}
      <p class="warn">{t.lastDue(lastDate, status.days)}</p>
    {:else if status.days !== null}
      <p>{t.lastOk(lastDate, status.days)}</p>
    {/if}
  </div>

  <div class="card">
    <h2>{t.exportTitle}</h2>
    <p>{t.exportBody}</p>
    <label class="check">
      <input type="checkbox" bind:checked={includePersonal} onchange={onIncludePersonal} />
      <span>{t.includePersonal}</span>
    </label>
    {#if includePersonal}
      <p class="warn">{t.includePersonalWarn}</p>
    {/if}
    <label class="check">
      <input type="checkbox" bind:checked={reminder} onchange={onReminder} />
      <span>{t.reminder}</span>
    </label>
    <p class="note">{t.reminderNote}</p>
    <button type="button" onclick={doExport} disabled={busy}>
      {busy ? t.exporting : t.exportButton}
    </button>
  </div>

  <div class="card">
    <h2>{t.importTitle}</h2>
    <p>{t.importBody}</p>
    {#if confirmImport}
      <p class="warn">{t.importWarn}</p>
      <p class="note">{t.importNote}</p>
      <div class="row">
        <button type="button" onclick={doImport} disabled={busy}>
          {busy ? t.importing : t.importPick}
        </button>
        <button type="button" onclick={() => (confirmImport = false)} disabled={busy}>
          {t.cancel}
        </button>
      </div>
    {:else}
      <button type="button" onclick={() => (confirmImport = true)} disabled={busy}>
        {t.importButton}
      </button>
    {/if}
  </div>

  <div class="card">
    <h2>{t.wipeTitle}</h2>
    <p>{t.wipeBody}</p>
    {#if confirmWipe}
      <label class="field">
        <span>{t.wipePrompt}</span>
        <input type="text" bind:value={wipeText} autocomplete="off" autocapitalize="characters" />
      </label>
      <div class="row">
        <button type="button" class="danger" onclick={doWipe} disabled={busy || !wipeReady}>
          {busy ? t.wiping : t.wipeConfirm}
        </button>
        <button
          type="button"
          onclick={() => {
            confirmWipe = false;
            wipeText = '';
          }}
          disabled={busy}
        >
          {t.cancel}
        </button>
      </div>
    {:else}
      <button type="button" class="danger" onclick={() => (confirmWipe = true)} disabled={busy}>
        {t.wipeButton}
      </button>
    {/if}
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
  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
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
    margin-bottom: 8px;
  }
  .field input {
    min-height: 44px;
    padding: 0 8px;
  }
  .note {
    font-size: 0.9rem;
    opacity: 0.8;
  }
  .warn,
  .error {
    font-weight: 600;
  }
</style>
