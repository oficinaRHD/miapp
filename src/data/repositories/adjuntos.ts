import type { AppDB } from '../db';
import { DataError, toData } from '../errors';
import type { Adjunto } from '../models';
import { parseAdjunto } from '../schema';
import { newId, nowISO } from '../util';

export type AdjuntoInput = Omit<Adjunto, 'id' | 'creadoEn'>;

export function adjuntosRepo(db: AppDB) {
  return {
    get(id: string): Promise<Adjunto | undefined> {
      return db.adjuntos.get(id);
    },

    async add(input: AdjuntoInput): Promise<Adjunto> {
      const { blob, ...meta } = input;
      const rec = toData(() => parseAdjunto({ ...meta, id: newId(), creadoEn: nowISO() }));
      const full: Adjunto = blob ? { ...rec, blob } : rec;
      await db.adjuntos.add(full);
      return full;
    },

    listByLink(vinculadoTipo: NonNullable<Adjunto['vinculadoTipo']>, vinculadoId: string): Promise<Adjunto[]> {
      return db.adjuntos
        .where('vinculadoId')
        .equals(vinculadoId)
        .filter((a) => a.vinculadoTipo === vinculadoTipo)
        .toArray();
    },

    async remove(id: string): Promise<Adjunto> {
      const cur = await db.adjuntos.get(id);
      if (!cur) throw new DataError('not-found', `adjunto ${id}`);
      await db.adjuntos.delete(id);
      return cur;
    },
  };
}
