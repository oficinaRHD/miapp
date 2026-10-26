<script lang="ts">
  // TEMPORARY list so V07 can be tested. V06 replaces this file in the next step.
  import { onMount } from 'svelte';
  import { categoryName, monthKeyOf } from '../../app/registro';
  import { editMovementPath, newMovementPath } from '../../app/registroRoutes';
  import { todayLocal } from '../../app/today';
  import { formatCup } from '../../domain/money';
  import type { Categoria, Movimiento } from '../../data/models';
  import { listCategories, listMovementsByMonth } from '../../stores/movimientos';

  let rows = $state<Movimiento[]>([]);
  let categorias = $state<Categoria[]>([]);
  let failure = $state<string | null>(null);
  const mes = monthKeyOf(todayLocal());

  onMount(async () => {
    try {
      categorias = await listCategories();
      rows = await listMovementsByMonth(mes);
    } catch (e) {
      failure = e instanceof Error ? e.message : String(e);
    }
  });
</script>

<section>
  <h2>Registro (provisional) {mes}</h2>
  <p>
    <a href={'#' + newMovementPath('ingreso')}>+ Ingreso</a> ·
    <a href={'#' + newMovementPath('gasto')}>+ Gasto</a>
  </p>
  {#if failure}
    <p role="alert">Error: {failure}</p>
  {/if}
  <ul>
    {#each rows as m (m.id)}
      <li>
        <a href={'#' + editMovementPath(m.id)}>
          {m.fecha} · {m.tipo === 'ingreso' ? '+' : '-'}{formatCup(m.monto)} · {categoryName(m.categoriaId, categorias)}
        </a>
      </li>
    {:else}
      <li>Sin movimientos este mes.</li>
    {/each}
  </ul>
</section>

<style>
  a {
    display: inline-block;
    min-height: 44px;
    line-height: 44px;
  }
</style>
