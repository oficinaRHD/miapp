import type { AppDB } from '../db';
import { toData } from '../errors';
import type { Ajuste } from '../models';
import { parseAjuste } from '../schema';

export function ajustesRepo(db: AppDB) {
  return {
    async get<T>(clave: string, fallback: T): Promise<T> {
      const row = await db.ajustes.get(clave);
      return row === undefined ? fallback : (row.valor as T);
    },

    async set(clave: string, valor: unknown): Promise<void> {
      const row = toData(() => parseAjuste({ clave, valor }));
      await db.ajustes.put(row);
    },

    async remove(clave: string): Promise<void> {
      await db.ajustes.delete(clave);
    },

    all(): Promise<Ajuste[]> {
      return db.ajustes.toArray();
    },
  };
}
