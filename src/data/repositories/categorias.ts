import type { AppDB } from '../db';
import { DataError, toData } from '../errors';
import type { Categoria, TipoMovimiento } from '../models';
import { parseCategoria } from '../schema';
import { newId, nowISO } from '../util';

export interface CategoriaInput {
  nombre: string;
  tipo: TipoMovimiento;
  color?: string;
  icono?: string;
}

export interface CategoriaChanges {
  nombre?: string;
  color?: string;
  icono?: string;
}

export function categoriasRepo(db: AppDB) {
  const sameName = (a: string, b: string): boolean => a.trim().toLowerCase() === b.trim().toLowerCase();

  return {
    async list(tipo?: TipoMovimiento): Promise<Categoria[]> {
      const rows = tipo
        ? await db.categorias.where('tipo').equals(tipo).toArray()
        : await db.categorias.toArray();
      return rows.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    },

    get(id: string): Promise<Categoria | undefined> {
      return db.categorias.get(id);
    },

    create(input: CategoriaInput): Promise<Categoria> {
      return db.transaction('rw', db.categorias, async () => {
        const rec = toData(() =>
          parseCategoria({
            id: newId(),
            nombre: input.nombre.trim(),
            tipo: input.tipo,
            esSistema: false,
            color: input.color,
            icono: input.icono,
          }),
        );
        const same = await db.categorias.where('tipo').equals(rec.tipo).toArray();
        if (same.some((c) => sameName(c.nombre, rec.nombre))) {
          throw new DataError('conflict', `category name already exists: ${rec.nombre}`);
        }
        await db.categorias.add(rec);
        return rec;
      });
    },

    update(id: string, changes: CategoriaChanges): Promise<Categoria> {
      return db.transaction('rw', db.categorias, async () => {
        const cur = await db.categorias.get(id);
        if (!cur) throw new DataError('not-found', `categoria ${id}`);
        const nombre = changes.nombre === undefined ? cur.nombre : changes.nombre.trim();
        if (cur.esSistema && nombre !== cur.nombre) {
          throw new DataError('integrity', 'system-category-name-locked');
        }
        const next = toData(() => parseCategoria({ ...cur, ...changes, nombre }));
        const same = await db.categorias.where('tipo').equals(next.tipo).toArray();
        if (same.some((c) => c.id !== id && sameName(c.nombre, next.nombre))) {
          throw new DataError('conflict', `category name already exists: ${next.nombre}`);
        }
        await db.categorias.put(next);
        return next;
      });
    },

    /**
     * System categories cannot be deleted. A category with movements needs `reassignTo`
     * (same type); the movements are moved before the delete. Returns how many moved.
     */
    remove(id: string, reassignTo?: string): Promise<{ reassigned: number }> {
      return db.transaction('rw', db.categorias, db.movimientos, async () => {
        const cur = await db.categorias.get(id);
        if (!cur) throw new DataError('not-found', `categoria ${id}`);
        if (cur.esSistema) throw new DataError('integrity', 'system-category-locked');

        const used = await db.movimientos.where('categoriaId').equals(id).count();
        if (used > 0) {
          if (!reassignTo) throw new DataError('integrity', 'category-in-use');
          if (reassignTo === id) throw new DataError('integrity', 'reassign-to-same-category');
          const dest = await db.categorias.get(reassignTo);
          if (!dest) throw new DataError('not-found', `categoria ${reassignTo}`);
          if (dest.tipo !== cur.tipo) throw new DataError('integrity', 'category-type-mismatch');
          await db.movimientos
            .where('categoriaId')
            .equals(id)
            .modify({ categoriaId: reassignTo, actualizadoEn: nowISO() });
        }
        await db.categorias.delete(id);
        return { reassigned: used };
      });
    },
  };
}
