<script lang="ts">
  // V14 "Acerca de": versions and the notice. Read-only.
  import { aboutRows } from '../../app/acerca';
  import { APP_VERSION } from '../../app/version';
  import { RULES_VERSION } from '../../domain/tributos.catalog';
  import { esAcerca as t } from '../../i18n/acerca';

  const rows = aboutRows({ appVersion: APP_VERSION, rulesVersion: RULES_VERSION });
</script>

<section>
  <p><a href="#/ajustes">{t.back}</a></p>
  <h1>{t.title}</h1>
  <p><strong>{t.appName}</strong></p>

  <dl>
    {#each rows as row (row.key)}
      <dt>{t.rows[row.key]}</dt>
      <dd>{row.value}</dd>
    {/each}
  </dl>
  <p class="note">{t.rulesNote}</p>
  <p>{t.offline}</p>

  <div class="card">
    <h2>{t.disclaimerTitle}</h2>
    <p>{t.disclaimer}</p>
  </div>
</section>

<style>
  dl {
    margin: 16px 0 8px;
  }
  dt {
    font-size: 0.9rem;
    opacity: 0.8;
  }
  dd {
    margin: 0 0 12px;
    font-weight: 600;
  }
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
  .note {
    font-size: 0.9rem;
    opacity: 0.8;
  }
</style>
