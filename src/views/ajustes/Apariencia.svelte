<script lang="ts">
  // V14 "Apariencia": automatic, light or dark. Saves and applies on each choice.
  import { onMount } from 'svelte';
  import { DEFAULT_TEMA, TEMA_CHOICES, type Tema } from '../../app/apariencia';
  import { esApariencia as t } from '../../i18n/apariencia';
  import { applyTema, loadTema, saveTema } from '../../stores/tema';

  let tema = $state<Tema>(DEFAULT_TEMA);
  let message = $state<{ kind: 'ok' | 'error'; text: string } | null>(null);

  onMount(() => {
    loadTema()
      .then((v) => (tema = v))
      .catch(() => {});
  });

  async function choose(next: Tema): Promise<void> {
    tema = next;
    applyTema(next);
    try {
      await saveTema(next);
      message = { kind: 'ok', text: t.saved };
    } catch (e) {
      message = { kind: 'error', text: `${t.actionError}: ${e instanceof Error ? e.message : String(e)}` };
    }
  }
</script>

<section>
  <p><a href="#/ajustes">{t.back}</a></p>
  <h1>{t.title}</h1>
  <p>{t.body}</p>

  {#if message}
    <p role={message.kind === 'error' ? 'alert' : 'status'}>{message.text}</p>
  {/if}

  <div class="options" role="radiogroup" aria-label={t.title}>
    {#each TEMA_CHOICES as choice (choice)}
      <label class="card option">
        <input
          type="radio"
          name="tema"
          value={choice}
          checked={tema === choice}
          onchange={() => choose(choice)}
        />
        <span class="text">
          <strong>{t.choices[choice].label}</strong>
          <span class="note">{t.choices[choice].hint}</span>
        </span>
      </label>
    {/each}
  </div>
</section>

<style>
  .options {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 16px 0;
  }
  .option {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 44px;
    padding: 10px 12px;
  }
  .text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .note {
    font-size: 0.9rem;
  }
</style>
