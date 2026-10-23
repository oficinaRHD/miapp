import type { AppDB } from '../db';
import { DataError, toData } from '../errors';
import type { Feriado } from '../models';
import { parseFeriado } from '../schema';

export function feriadosRepo(db: AppDB) {
  return {
    async list(): Promise<Feriado[]> {
      return (await db.feriados.toArray()).sort((a, b) => a.fecha.localeCompare(b.fecha));
    },

    /** Replaces the whole list (the official list is pending, 01-reglas-fiscales section 7). */
    replaceAll(items: readonly Feriado[]): Promise<number> {
      return db.transaction('rw', db.feriados, async () => {
        const rows = items.map((f, i) => toData(() => parseFeriado(f, `feriados[${i}]`)));
        if (new Set(rows.map((r) => r.fecha)).size !== rows.length) {
          throw new DataError('conflict', 'duplicate holiday date');
        }
        await db.feriados.clear();
        if (rows.length > 0) await db.feriados.bulkAdd(rows);
        return rows.length;
      });
    },
  };
}
