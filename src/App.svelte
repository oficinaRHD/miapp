<script lang="ts">
  import { es } from './i18n/es';

  const APP_VERSION = '0.0.1';
</script>

<main>
  <h1>{es.appName}</h1>
  <p class="tagline">{es.tagline}</p>

  <section class="card">
    <h2>{es.milestoneTitle}</h2>
    <p>{es.milestoneBody}</p>
  </section>

  <p class="note">{es.offlineNote}</p>
  <p class="version">{es.versionLabel} {APP_VERSION}</p>
</main>

<style>
  main {
    max-width: 480px;
    margin: 0 auto;
    padding: 24px 16px;
  }
  h1 {
    margin: 0 0 4px;
    color: var(--primary);
  }
  .tagline {
    margin: 0 0 20px;
    color: var(--muted);
  }
  .card {
    background: var(--surface);
    border-radius: var(--radius);
    padding: 16px;
  }
  .card h2 {
    margin: 0 0 8px;
    font-size: 1.1rem;
  }
  .card p {
    margin: 0;
  }
  .note,
  .version {
    color: var(--muted);
    font-size: 0.9rem;
  }
</style>
