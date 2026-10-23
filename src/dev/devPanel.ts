// TEMPORARY panel to check the M2 "done" criterion in the browser and in the APK:
// create test data -> export -> wipe -> import -> same fingerprint.
// Delete this file (and its two lines in main.ts) when M3 starts.
import { db, ensureSeed, exportBackup, repos, wipeAllData } from '../data';
import { countBackup } from '../data/backup';
import { todayISO } from '../data/util';
import { createAndShareBackup, restoreBackupFromPicker } from '../services/backupService';

/** FNV-1a 32 bit over text, as 8 hex digits. */
function fnv1a(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

async function snapshot(): Promise<string> {
  // Personal data is left out on purpose: a default export drops it, so the
  // fingerprint before and after a default export/import must match.
  const file = await exportBackup(db, { includePersonal: false });
  const lines = Object.entries(countBackup(file)).map(([k, n]) => `${k}: ${n}`);
  return `${lines.join('\n')}\nhuella: ${fnv1a(JSON.stringify(file.datos))}`;
}

async function createSampleData(): Promise<void> {
  await wipeAllData(db);
  await ensureSeed(db);

  const hoy = todayISO();
  const year = Number(hoy.slice(0, 4));
  const mes = hoy.slice(5, 7);

  await repos.perfil.save({
    nombreVisible: 'Prueba M2',
    tieneEmpleados: false,
    tributosActivos: ['0114022', '0510122'],
    onboardingCompleto: true,
    rc05: '0000000000000000', // fake, only to check that it is left out of the backup
    nit: '00000000000',
  });
  await repos.ajustes.set('respaldoMensual', true);

  const base = { metodo: 'efectivo', cuentaParaVentas: true, justificado: true } as const;
  await repos.movimientos.add({ ...base, fecha: `${year}-${mes}-02`, tipo: 'ingreso', monto: 125050, categoriaId: 'cat-ing-ventas', descripcion: 'Venta de prueba 1' });
  await repos.movimientos.add({ ...base, fecha: `${year}-${mes}-05`, tipo: 'ingreso', monto: 300000, categoriaId: 'cat-ing-servicios', descripcion: 'Servicio de prueba' });
  await repos.movimientos.add({ ...base, fecha: `${year}-${mes}-09`, tipo: 'ingreso', monto: 48075, categoriaId: 'cat-ing-ventas', descripcion: 'Venta de prueba 2' });
  await repos.movimientos.add({ ...base, fecha: `${year}-${mes}-03`, tipo: 'gasto', monto: 70000, categoriaId: 'cat-gas-materiales', cuentaParaVentas: false, descripcion: 'Materiales de prueba' });
  await repos.movimientos.add({ ...base, fecha: `${year}-${mes}-07`, tipo: 'gasto', monto: 25000, categoriaId: 'cat-gas-transporte', cuentaParaVentas: false, justificado: false, descripcion: 'Transporte de prueba' });

  await repos.obligaciones.addDrafts([
    { tributoCodigo: '0114022', periodoTipo: 'mensual', periodoClave: `${year}-${mes}`, periodoEtiqueta: `Prueba ${year}-${mes}`, vence: `${year}-${mes}-20`, venceOrigen: 'calculada' },
    { tributoCodigo: '0510122', periodoTipo: 'mensual', periodoClave: `${year}-${mes}`, periodoEtiqueta: `Prueba ${year}-${mes}`, vence: `${year}-${mes}-20`, venceOrigen: 'calculada', importeEstimado: 12345 },
    { tributoCodigo: '0114022', periodoTipo: 'mensual', periodoClave: `${year - 1}-12`, periodoEtiqueta: `Prueba ${year - 1}-12`, vence: `${year}-01-20`, venceOrigen: 'manual' },
  ]);
  const [pagada] = await repos.obligaciones.list({ desde: `${year}-01-01`, hasta: `${year}-01-31` });
  if (pagada) {
    await repos.obligaciones.markPaid(pagada.id, {
      pagadaEn: `${year}-01-19`,
      importePagado: 5000,
      canalPago: 'electronico',
      descuento3Aplicado: true,
    });
  }
}

export function mountDevPanel(): void {
  if (document.getElementById('m2-dev-panel')) return;
  void ensureSeed(db);

  const root = document.createElement('div');
  root.id = 'm2-dev-panel';
  Object.assign(root.style, { position: 'fixed', right: '8px', bottom: '8px', zIndex: '9999', fontFamily: 'sans-serif' });

  const panel = document.createElement('div');
  Object.assign(panel.style, {
    display: 'none', background: '#fff', color: '#111', border: '1px solid #888', borderRadius: '8px',
    padding: '8px', width: 'min(92vw, 360px)', maxHeight: '70vh', overflow: 'auto', marginBottom: '6px',
  });

  const out = document.createElement('pre');
  Object.assign(out.style, { whiteSpace: 'pre-wrap', fontSize: '12px', margin: '8px 0 0' });

  const log = (text: string): void => { out.textContent = text; };
  const run = (label: string, fn: () => Promise<string>) => async (): Promise<void> => {
    log(`${label}...`);
    try { log(`${label}: OK\n${await fn()}`); } catch (e) { log(`${label}: ERROR\n${e instanceof Error ? e.message : String(e)}`); }
  };

  const button = (text: string, onClick: () => Promise<void>): HTMLButtonElement => {
    const b = document.createElement('button');
    b.textContent = text;
    Object.assign(b.style, { display: 'block', width: '100%', minHeight: '44px', margin: '4px 0', fontSize: '14px' });
    b.addEventListener('click', () => { void onClick(); });
    return b;
  };

  const personal = document.createElement('input');
  personal.type = 'checkbox';
  const personalLabel = document.createElement('label');
  personalLabel.append(personal, ' incluir datos personales al exportar');
  personalLabel.style.fontSize = '12px';

  panel.append(
    button('0. Ver estado', run('Estado', snapshot)),
    button('1. Crear datos de prueba', run('Datos de prueba', async () => { await createSampleData(); return snapshot(); })),
    personalLabel,
    button('2. Exportar respaldo', run('Exportar', async () => {
      const r = await createAndShareBackup(db, { includePersonal: personal.checked });
      return `${r.fileName}\nresultado: ${r.outcome}\n${await snapshot()}`;
    })),
    button('3. Borrar todo', run('Borrar', async () => {
      if (!window.confirm('Se borran TODOS los datos locales. ¿Continuar?')) return 'cancelado';
      await wipeAllData(db);
      return snapshot();
    })),
    button('4. Importar respaldo', run('Importar', async () => {
      const r = await restoreBackupFromPicker(db);
      if (r === null) return 'cancelado';
      return `respaldo previo: ${r.preBackupName ?? 'no'}\n${await snapshot()}`;
    })),
    out,
  );

  const toggle = document.createElement('button');
  toggle.textContent = 'M2';
  Object.assign(toggle.style, { minWidth: '44px', minHeight: '44px', float: 'right' });
  toggle.addEventListener('click', () => { panel.style.display = panel.style.display === 'none' ? 'block' : 'none'; });

  root.append(panel, toggle);
  document.body.appendChild(root);
}
