import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { AppDB } from '../db.js';
import { ensureSeed, SEED_CATEGORIAS } from '../seed.js';
import { createTestDb, dataCodeOf } from '../test-helpers.js';
import { SCHEMA_VERSION } from '../version.js';
import { createRepositories, type MovimientoInput, type Repositories } from './index.js';

let db: AppDB;
let repos: Repositories;

beforeEach(async () => {
  db = createTestDb();
  repos = createRepositories(db);
  await ensureSeed(db);
});

afterEach(async () => {
  db.close();
  await db.delete();
});

const ingreso = (over: Partial<MovimientoInput> = {}): MovimientoInput => ({
  fecha: '2026-10-02',
  tipo: 'ingreso',
  monto: 125050,
  categoriaId: 'cat-ing-ventas',
  metodo: 'efectivo',
  cuentaParaVentas: true,
  justificado: true,
  ...over,
});

const draft = (periodoClave: string, vence: string, tributoCodigo = '0114022') => ({
  tributoCodigo,
  periodoTipo: 'mensual' as const,
  periodoClave,
  periodoEtiqueta: periodoClave,
  vence,
  venceOrigen: 'calculada' as const,
});

describe('schema', () => {
  it('Dexie version matches SCHEMA_VERSION', () => {
    expect(db.verno).toBe(SCHEMA_VERSION);
  });
});

describe('seed', () => {
  it('inserts the system categories once', async () => {
    expect(await db.categorias.count()).toBe(SEED_CATEGORIAS.length);
    expect(await ensureSeed(db)).toBe(0);
    expect(await db.categorias.count()).toBe(SEED_CATEGORIAS.length);
  });

  it('re-adds a missing one without overwriting edited ones', async () => {
    await repos.categorias.update('cat-ing-ventas', { color: '#00aa00' });
    await db.categorias.delete('cat-gas-otros');
    expect(await ensureSeed(db)).toBe(1);
    expect((await repos.categorias.get('cat-ing-ventas'))?.color).toBe('#00aa00');
  });
});

describe('perfil', () => {
  const base = {
    nombreVisible: 'Ana',
    tieneEmpleados: false,
    tributosActivos: ['0114022'],
    onboardingCompleto: false,
  };

  it('saves, reads back and keeps creadoEn on the second save', async () => {
    const first = await repos.perfil.save(base);
    const second = await repos.perfil.save({ ...base, nombreVisible: 'Ana María' });
    expect(second.creadoEn).toBe(first.creadoEn);
    expect((await repos.perfil.get())?.nombreVisible).toBe('Ana María');
    expect(await db.perfil.count()).toBe(1);
  });

  it('patch merges fields and fails without a profile', async () => {
    expect(await dataCodeOf(repos.perfil.patch({ onboardingCompleto: true }))).toBe('not-found:perfil');
    await repos.perfil.save(base);
    const next = await repos.perfil.patch({ onboardingCompleto: true });
    expect(next.onboardingCompleto).toBe(true);
    expect(next.nombreVisible).toBe('Ana');
  });

  it('rejects a bad registration date', async () => {
    const code = await dataCodeOf(repos.perfil.save({ ...base, fechaInscripcionFiscal: '2026-02-30' }));
    expect(code.startsWith('invalid:')).toBe(true);
  });
});

describe('ajustes', () => {
  it('stores values and returns the fallback when missing', async () => {
    expect(await repos.ajustes.get('x', 7)).toBe(7);
    await repos.ajustes.set('x', { a: 1 });
    expect(await repos.ajustes.get('x', null)).toEqual({ a: 1 });
    await repos.ajustes.remove('x');
    expect(await repos.ajustes.get('x', 7)).toBe(7);
  });
});

describe('categorias', () => {
  it('creates a custom category and rejects a duplicate name of the same type', async () => {
    const c = await repos.categorias.create({ nombre: 'Propinas', tipo: 'ingreso' });
    expect(c.esSistema).toBe(false);
    const code = await dataCodeOf(repos.categorias.create({ nombre: ' propinas ', tipo: 'ingreso' }));
    expect(code.startsWith('conflict:')).toBe(true);
    // the same name is fine for the other type
    await repos.categorias.create({ nombre: 'Propinas', tipo: 'gasto' });
  });

  it('never deletes a system category', async () => {
    expect(await dataCodeOf(repos.categorias.remove('cat-ing-ventas'))).toBe('integrity:system-category-locked');
  });

  it('needs a reassignment of the same type when the category has movements', async () => {
    const c = await repos.categorias.create({ nombre: 'Propinas', tipo: 'ingreso' });
    const m = await repos.movimientos.add(ingreso({ categoriaId: c.id }));

    expect(await dataCodeOf(repos.categorias.remove(c.id))).toBe('integrity:category-in-use');
    expect(await dataCodeOf(repos.categorias.remove(c.id, 'cat-gas-otros'))).toBe('integrity:category-type-mismatch');

    const res = await repos.categorias.remove(c.id, 'cat-ing-otros');
    expect(res.reassigned).toBe(1);
    expect((await repos.movimientos.get(m.id))?.categoriaId).toBe('cat-ing-otros');
    expect(await repos.categorias.get(c.id)).toBeUndefined();
  });

  it('locks the name of system categories but allows a color', async () => {
    expect(await dataCodeOf(repos.categorias.update('cat-ing-ventas', { nombre: 'Otra' }))).toBe(
      'integrity:system-category-name-locked',
    );
    expect((await repos.categorias.update('cat-ing-ventas', { color: '#112233' })).color).toBe('#112233');
  });
});

describe('movimientos', () => {
  it('adds a valid movement with id and timestamps', async () => {
    const m = await repos.movimientos.add(ingreso());
    expect(m.id.length).toBeGreaterThan(10);
    expect(m.creadoEn).toBe(m.actualizadoEn);
    expect(await repos.movimientos.get(m.id)).toEqual(m);
  });

  it('rejects decimal or negative amounts, bad dates and unknown categories', async () => {
    expect((await dataCodeOf(repos.movimientos.add(ingreso({ monto: 1250.5 })))).startsWith('invalid:')).toBe(true);
    expect((await dataCodeOf(repos.movimientos.add(ingreso({ monto: -1 })))).startsWith('invalid:')).toBe(true);
    expect((await dataCodeOf(repos.movimientos.add(ingreso({ fecha: '2026-02-30' })))).startsWith('invalid:')).toBe(true);
    expect(await dataCodeOf(repos.movimientos.add(ingreso({ categoriaId: 'nope' })))).toBe('integrity:unknown category: nope');
    expect(await dataCodeOf(repos.movimientos.add(ingreso({ categoriaId: 'cat-gas-otros' })))).toBe(
      'integrity:category-type-mismatch',
    );
    expect(await db.movimientos.count()).toBe(0);
  });

  it('lists by month and by range, optionally by type', async () => {
    await repos.movimientos.add(ingreso({ fecha: '2026-09-30' }));
    await repos.movimientos.add(ingreso({ fecha: '2026-10-01', monto: 100 }));
    await repos.movimientos.add(ingreso({ fecha: '2026-10-31', monto: 200 }));
    await repos.movimientos.add(
      ingreso({ fecha: '2026-10-15', tipo: 'gasto', categoriaId: 'cat-gas-otros', monto: 300 }),
    );
    await repos.movimientos.add(ingreso({ fecha: '2026-11-01' }));

    const oct = await repos.movimientos.listByMonth('2026-10');
    expect(oct.map((m) => m.fecha)).toEqual(['2026-10-01', '2026-10-15', '2026-10-31']);
    expect((await repos.movimientos.listByMonth('2026-10', 'gasto')).map((m) => m.monto)).toEqual([300]);
    expect(await repos.movimientos.listByRange('2026-10-01', '2026-10-15', 'ingreso')).toHaveLength(1);
    expect((await dataCodeOf(() => repos.movimientos.listByMonth('2026-13'))).startsWith('invalid:')).toBe(true);
  });

  it('update revalidates; remove returns the record and restore puts it back', async () => {
    const m = await repos.movimientos.add(ingreso());
    const up = await repos.movimientos.update(m.id, { monto: 999 });
    expect(up.monto).toBe(999);
    expect(up.creadoEn).toBe(m.creadoEn);
    expect((await dataCodeOf(repos.movimientos.update(m.id, { monto: 0.5 }))).startsWith('invalid:')).toBe(true);

    const removed = await repos.movimientos.remove(m.id);
    expect(await repos.movimientos.get(m.id)).toBeUndefined();
    await repos.movimientos.restore(removed);
    expect(await repos.movimientos.get(m.id)).toEqual(removed);
  });
});

describe('obligaciones', () => {
  it('addDrafts is idempotent and skips repeated periods inside the same call', async () => {
    const drafts = [draft('2026-09', '2026-10-20'), draft('2026-10', '2026-11-20'), draft('2026-10', '2026-11-20')];
    expect(await repos.obligaciones.addDrafts(drafts)).toEqual({ added: 2, skipped: 1 });
    expect(await repos.obligaciones.addDrafts(drafts)).toEqual({ added: 0, skipped: 3 });
    expect(await db.obligaciones.count()).toBe(2);
    expect((await repos.obligaciones.list()).every((o) => o.estado === 'pendiente')).toBe(true);
  });

  it('never overwrites an obligation that is already paid', async () => {
    await repos.obligaciones.addDrafts([draft('2026-09', '2026-10-20')]);
    const [o] = await repos.obligaciones.list();
    if (!o) throw new Error('missing obligation');
    await repos.obligaciones.markPaid(o.id, { pagadaEn: '2026-10-19', importePagado: 5000 });
    await repos.obligaciones.addDrafts([draft('2026-09', '2026-10-25')]);
    const after = await repos.obligaciones.get(o.id);
    expect(after?.estado).toBe('pagada');
    expect(after?.vence).toBe('2026-10-20');
  });

  it('markPaid needs an integer amount; reopen clears the payment', async () => {
    await repos.obligaciones.addDrafts([draft('2026-09', '2026-10-20')]);
    const [o] = await repos.obligaciones.list();
    if (!o) throw new Error('missing obligation');

    const bad = await dataCodeOf(repos.obligaciones.markPaid(o.id, { pagadaEn: '2026-10-19', importePagado: 50.5 }));
    expect(bad.startsWith('invalid:')).toBe(true);

    const paid = await repos.obligaciones.markPaid(o.id, {
      pagadaEn: '2026-10-19',
      importePagado: 5000,
      canalPago: 'electronico',
      descuento3Aplicado: true,
    });
    expect(paid.estado).toBe('pagada');

    const open = await repos.obligaciones.reopen(o.id);
    expect(open.estado).toBe('pendiente');
    expect(open.pagadaEn).toBeUndefined();
    expect(open.importePagado).toBeUndefined();
    expect(open.canalPago).toBeUndefined();
  });

  it('setDueDate changes pending obligations and refuses paid ones', async () => {
    await repos.obligaciones.addDrafts([draft('2026-09', '2026-10-20'), draft('2026-10', '2026-11-20')]);
    const [a, b] = await repos.obligaciones.list();
    if (!a || !b) throw new Error('missing obligations');
    const moved = await repos.obligaciones.setDueDate(a.id, '2026-10-21', 'vector');
    expect(moved.vence).toBe('2026-10-21');
    expect(moved.venceOrigen).toBe('vector');

    await repos.obligaciones.markPaid(b.id, { pagadaEn: '2026-11-19', importePagado: 1 });
    expect(await dataCodeOf(repos.obligaciones.setDueDate(b.id, '2026-11-25'))).toBe('integrity:paid-obligation-locked');
  });

  it('lists by due-date range and by state', async () => {
    await repos.obligaciones.addDrafts([
      draft('2026-08', '2026-09-21'),
      draft('2026-09', '2026-10-20'),
      draft('2026-10', '2026-11-20'),
    ]);
    const all = await repos.obligaciones.list();
    const second = all[1];
    if (!second) throw new Error('missing obligation');
    await repos.obligaciones.markOmitted(second.id, 'no aplica');

    expect((await repos.obligaciones.list({ desde: '2026-10-01', hasta: '2026-10-31' })).map((o) => o.periodoClave)).toEqual(['2026-09']);
    expect(await repos.obligaciones.list({ estado: 'pendiente' })).toHaveLength(2);
    expect((await repos.obligaciones.list({ estado: 'omitida' }))[0]?.motivoOmision).toBe('no aplica');
  });

  it('the unique index [tributoCodigo+periodoClave] also protects direct writes', async () => {
    await repos.obligaciones.addDrafts([draft('2026-09', '2026-10-20')]);
    const [o] = await repos.obligaciones.list();
    if (!o) throw new Error('missing obligation');
    let failed = false;
    try {
      await db.obligaciones.add({ ...o, id: 'otro-id' });
    } catch {
      failed = true;
    }
    expect(failed).toBe(true);
  });
});

describe('adjuntos and feriados', () => {
  it('adds, links and removes an attachment', async () => {
    const a = await repos.adjuntos.add({
      tipo: 'comprobante',
      nombre: 'recibo.jpg',
      mime: 'image/jpeg',
      tamano: 1024,
      almacenamiento: 'filesystem',
      ruta: 'adjuntos/recibo.jpg',
      vinculadoTipo: 'movimiento',
      vinculadoId: 'm-1',
    });
    expect(await repos.adjuntos.listByLink('movimiento', 'm-1')).toHaveLength(1);
    expect(await repos.adjuntos.listByLink('obligacion', 'm-1')).toHaveLength(0);
    await repos.adjuntos.remove(a.id);
    expect(await repos.adjuntos.get(a.id)).toBeUndefined();
  });

  it('replaces the holiday list and rejects duplicates', async () => {
    expect(await repos.feriados.replaceAll([{ fecha: '2027-01-01', nombre: 'A' }, { fecha: '2026-12-25', nombre: 'B' }])).toBe(2);
    expect((await repos.feriados.list()).map((f) => f.fecha)).toEqual(['2026-12-25', '2027-01-01']);
    expect((await dataCodeOf(repos.feriados.replaceAll([{ fecha: '2027-01-01', nombre: 'A' }, { fecha: '2027-01-01', nombre: 'B' }]))).startsWith('conflict:')).toBe(true);
    expect(await repos.feriados.list()).toHaveLength(2);
  });
});
