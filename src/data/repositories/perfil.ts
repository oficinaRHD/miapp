import { RULES_VERSION } from '../../domain/tributos.catalog';
import type { AppDB } from '../db';
import { DataError, toData } from '../errors';
import type { Perfil } from '../models';
import { parsePerfil } from '../schema';
import { nowISO } from '../util';

export type PerfilInput = Omit<Perfil, 'id' | 'creadoEn' | 'actualizadoEn' | 'reglasVersion'> & {
  reglasVersion?: string;
};

export function perfilRepo(db: AppDB) {
  return {
    get(): Promise<Perfil | undefined> {
      return db.perfil.get('perfil');
    },

    /** Creates or replaces the profile; keeps `creadoEn` of the existing one. */
    save(input: PerfilInput): Promise<Perfil> {
      return db.transaction('rw', db.perfil, async () => {
        const prev = await db.perfil.get('perfil');
        const now = nowISO();
        const next = toData(() =>
          parsePerfil({
            ...input,
            id: 'perfil',
            reglasVersion: input.reglasVersion ?? prev?.reglasVersion ?? RULES_VERSION,
            creadoEn: prev?.creadoEn ?? now,
            actualizadoEn: now,
          }),
        );
        await db.perfil.put(next);
        return next;
      });
    },

    /** Merges fields into the existing profile. Pass `undefined` to clear an optional field. */
    patch(changes: Partial<PerfilInput>): Promise<Perfil> {
      return db.transaction('rw', db.perfil, async () => {
        const prev = await db.perfil.get('perfil');
        if (!prev) throw new DataError('not-found', 'perfil');
        const next = toData(() =>
          parsePerfil({ ...prev, ...changes, id: 'perfil', actualizadoEn: nowISO() }),
        );
        await db.perfil.put(next);
        return next;
      });
    },
  };
}
