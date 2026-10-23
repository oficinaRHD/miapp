import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { countBackup, exportBackup, importBackup, wipeAllData } from './backup';
import { BackupError, serializeBackup } from './backupSchema';
import type { AppDB } from './db';
import { createRepositories, type Repositories } from './repositories';
import { ensureSeed } from './seed';
import { createTestDb } from './test-helpers';

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

async function fillSampleData(): Promise<void> {
  await repos.perfil.save({
    nombreVisible: 'Prueba',
    tieneEmpleados: false,
    tributosActivos: ['0114022', '0510122'],
    onboardingCompleto: true,
    rc05: '0000000000000000',
    nit: '123',
  });
  await repos.ajustes.set('respaldoMensual', true);
  const base = { metodo: 'efectivo', cuentaParaVentas: true, justificado: true } as const;
  await repos.movimientos.add({ ...base, fecha: '2026-10-02', tipo: 'ingreso', monto: 125050, categoriaId: 'cat-ing-ventas' });
  await repos.movimientos.add({ ...base, fecha: '2026-10-05', tipo: 'ingreso', monto: 300000, categoriaId: 'cat-ing-servicios' });
  await repos.movimientos.add({ ...base, fecha: '2026-10-09', tipo: 'ingreso', monto: 48075, categoriaId: 'cat-ing-ventas' });
  await repos.movimientos.add({ ...base, fecha: '2026-10-03', tipo: 'gasto', monto: 70000, categoriaId: 'cat-gas-materiales', cuentaParaVentas: false });
  await repos.movimientos.add({ ...base, fecha: '2026-10-07', tipo: 'gasto', monto: 25000, categoriaId: 'cat-gas-transporte', cuentaParaVentas: false, justificado: false });
  await repos.obligaciones.addDrafts([
    { tributoCodigo: '0114022', periodoTipo: 'mensual', periodoClave: '2026-09', periodoEtiqueta: 'Septiembre 2026', vence: '2026-10-20', venceOrigen: 'calculada' },
    { tributoCodigo: '0510122', periodoTipo: 'mensual', periodoClave: '2026-09', periodoEtiqueta: 'Septiembre 2026', vence: '2026-10-20', venceOrigen: 'vector', importeEstimado: 12345 },
  ]);
  const [first] = await repos.obligaciones.list();
  if (first) await repos.obligaciones.markPaid(first.id, { pagadaEn: '2026-10-19', importePagado: 5000, canalPago: 'electronico', descuento3Aplicado: true });
  await repos.feriados.replaceAll([{ fecha: '2027-01-01', nombre: 'Prueba' }]);
  await repos.adjuntos.add({ tipo: 'comprobante', nombre: 'a.jpg', mime: 'image/jpeg', tamano: 10, almacenamiento: 'filesystem', ruta: 'adjuntos/a.jpg', vinculadoTipo: 'obligacion', vinculadoId: 'o-1' });
  await db.empleados.add({ id: 'e1', nombre: 'Ana', remuneracionMensual: 100000, alta: '2026-01-01' });
  await db.nominas.add({ id: 'n1', empleadoId: 'e1', periodoClave: '2026-09', remuneracion: 100000, retencionIsip: 0, contribucionEspecial: 0 });
  await db.recordatorios.add({ id: 'r1', tipo: 'respaldo', fechaHora: '2026-11-01T09:00:00-04:00', notificacionId: 1 });
}

async function codeOf(p: Promise<unknown>): Promise<string> {
  try {
    await p;
    return 'none';
  } catch (e) {
    return e instanceof BackupError ? e.code : `other:${String(e)}`;
  }
}

describe('export', () => {
  it('leaves RC-05 and NIT out by default and keeps them when asked', async () => {
    await fillSampleData();
    const plain = await exportBackup(db);
    expect(plain.incluyeDatosPersonales).toBe(false);
    expect(plain.datos.perfil?.rc05).toBeUndefined();
    expect(plain.datos.perfil?.nit).toBeUndefined();
    expect(plain.datos.perfil?.nombreVisible).toBe('Prueba');

    const full = await exportBackup(db, { includePersonal: true });
    expect(full.incluyeDatosPersonales).toBe(true);
    expect(full.datos.perfil?.rc05).toBe('0000000000000000');
  });

  it('does not export reminders, and attachments travel as metadata only', async () => {
    await fillSampleData();
    const file = await exportBackup(db);
    expect('recordatorios' in file.datos).toBe(false);
    expect(file.datos.adjuntos).toHaveLength(1);
    expect(file.datos.adjuntos[0]?.nombre).toBe('a.jpg');
    expect('blob' in (file.datos.adjuntos[0] ?? {})).toBe(false);
  });

  it('writes an object whose JSON text parses back to the same data', async () => {
    await fillSampleData();
    const file = await exportBackup(db);
    expect(JSON.parse(serializeBackup(file))).toEqual(file);
  });

  it('exports an empty database as a valid file', async () => {
    await wipeAllData(db);
    const file = await exportBackup(db);
    expect(file.datos.perfil).toBeNull();
    expect(countBackup(file).movimientos).toBe(0);
    await importBackup(db, serializeBackup(file));
  });
});

describe('create data -> export -> wipe -> import', () => {
  it('brings everything back, identical', async () => {
    await fillSampleData();
    const before = await exportBackup(db, { includePersonal: true });
    const text = serializeBackup(before);

    await wipeAllData(db);
    for (const table of db.tables) expect(await table.count()).toBe(0);

    const result = await importBackup(db, text);
    expect(result.counts.movimientos).toBe(5);
    expect(result.counts.obligaciones).toBe(2);
    expect(result.counts.categorias).toBe(11);

    const after = await exportBackup(db, { includePersonal: true, now: new Date(before.exportadoEn) });
    expect(after.datos).toEqual(before.datos);
    expect(await db.recordatorios.count()).toBe(0);
  });

  it('a default export restores everything except RC-05 and NIT', async () => {
    await fillSampleData();
    const text = serializeBackup(await exportBackup(db));
    await wipeAllData(db);
    await importBackup(db, text);
    const perfil = await repos.perfil.get();
    expect(perfil?.nombreVisible).toBe('Prueba');
    expect(perfil?.rc05).toBeUndefined();
    expect(await db.movimientos.count()).toBe(5);
  });

  it('replaces (not merges) existing data', async () => {
    await fillSampleData();
    const text = serializeBackup(await exportBackup(db, { includePersonal: true }));
    await repos.movimientos.add({ fecha: '2026-10-30', tipo: 'ingreso', monto: 1, categoriaId: 'cat-ing-ventas', metodo: 'efectivo', cuentaParaVentas: true, justificado: true });
    expect(await db.movimientos.count()).toBe(6);
    await importBackup(db, text);
    expect(await db.movimientos.count()).toBe(5);
  });
});

describe('import safety', () => {
  it('rejects an invalid file and leaves the data untouched', async () => {
    await fillSampleData();
    const good = await exportBackup(db, { includePersonal: true });
    const bad = JSON.parse(serializeBackup(good)) as Record<string, unknown>;
    bad.app = 'otra-app';

    expect(await codeOf(importBackup(db, bad))).toBe('wrong-app');
    expect(await codeOf(importBackup(db, '{no es json'))).toBe('not-json');
    expect(await codeOf(importBackup(db, { ...good, schemaVersion: 99 }))).toBe('future-version');

    const after = await exportBackup(db, { includePersonal: true, now: new Date(good.exportadoEn) });
    expect(after.datos).toEqual(good.datos);
  });

  it('hands over the previous data to onPreBackup before replacing it', async () => {
    await fillSampleData();
    const text = serializeBackup(await exportBackup(db, { includePersonal: true }));
    await wipeAllData(db);
    await repos.ajustes.set('marca', 'datos-actuales');

    let seen: string | undefined;
    const result = await importBackup(db, text, {
      onPreBackup: async (previous) => {
        seen = previous.datos.ajustes.find((a) => a.clave === 'marca')?.valor as string | undefined;
      },
    });
    expect(result.preBackupMade).toBe(true);
    expect(seen).toBe('datos-actuales');
    expect(await repos.ajustes.get('marca', 'gone')).toBe('gone');
  });

  it('aborts the import if the pre-backup fails', async () => {
    await fillSampleData();
    const text = serializeBackup(await exportBackup(db, { includePersonal: true }));
    await repos.ajustes.set('marca', 'intacto'); // not in the backup: it must survive the failed import

    let message = '';
    try {
      await importBackup(db, text, {
        onPreBackup: async () => {
          throw new Error('disk full');
        },
      });
    } catch (e) {
      message = e instanceof Error ? e.message : String(e);
    }
    expect(message).toBe('disk full');
    expect(await repos.ajustes.get('marca', 'gone')).toBe('intacto');
  });
});
