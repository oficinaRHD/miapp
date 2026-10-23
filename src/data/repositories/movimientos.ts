import type { AppDB } from '../db';
import { DataError, toData } from '../errors';
import type { ISODate, Movimiento, TipoMovimiento } from '../models';
import { parseMovimiento } from '../schema';
import { newId, nowISO } from '../util';

export type MovimientoInput = Omit<Movimiento, 'id' | 'creadoEn' | 'actualizadoEn'>;

/** First and last possible date of a month key 'YYYY-MM' (string order matches date order). */
function monthBounds(mes: string): [ISODate, ISODate] {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) throw new DataError('invalid', `month key: ${mes}`);
  return [`${mes}-01`, `${mes}-31`];
}

export function movimientosRepo(db: AppDB) {
  async function assertCategoria(m: Movimiento): Promise<void> {
    const cat = await db.categorias.get(m.categoriaId);
    if (!cat) throw new DataError('integrity', `unknown category: ${m.categoriaId}`);
    if (cat.tipo !== m.tipo) throw new DataError('integrity', 'category-type-mismatch');
  }

  async function listByRange(
    desde: ISODate,
    hasta: ISODate,
    tipo?: TipoMovimiento,
  ): Promise<Movimiento[]> {
    const rows = tipo
      ? await db.movimientos
          .where('[tipo+fecha]')
          .between([tipo, desde], [tipo, hasta], true, true)
          .toArray()
      : await db.movimientos.where('fecha').between(desde, hasta, true, true).toArray();
    return rows.sort(
      (a, b) => a.fecha.localeCompare(b.fecha) || a.creadoEn.localeCompare(b.creadoEn),
    );
  }

  return {
    get(id: string): Promise<Movimiento | undefined> {
      return db.movimientos.get(id);
    },

    add(input: MovimientoInput): Promise<Movimiento> {
      return db.transaction('rw', db.movimientos, db.categorias, async () => {
        const now = nowISO();
        const rec = toData(() =>
          parseMovimiento({ ...input, id: newId(), creadoEn: now, actualizadoEn: now }),
        );
        await assertCategoria(rec);
        await db.movimientos.add(rec);
        return rec;
      });
    },

    update(id: string, changes: Partial<MovimientoInput>): Promise<Movimiento> {
      return db.transaction('rw', db.movimientos, db.categorias, async () => {
        const cur = await db.movimientos.get(id);
        if (!cur) throw new DataError('not-found', `movimiento ${id}`);
        const next = toData(() =>
          parseMovimiento({ ...cur, ...changes, id, creadoEn: cur.creadoEn, actualizadoEn: nowISO() }),
        );
        await assertCategoria(next);
        await db.movimientos.put(next);
        return next;
      });
    },

    /** Deletes and returns the record so the UI can offer "undo" through `restore`. */
    remove(id: string): Promise<Movimiento> {
      return db.transaction('rw', db.movimientos, async () => {
        const cur = await db.movimientos.get(id);
        if (!cur) throw new DataError('not-found', `movimiento ${id}`);
        await db.movimientos.delete(id);
        return cur;
      });
    },

    /** Puts back a record returned by `remove` (undo). */
    restore(m: Movimiento): Promise<Movimiento> {
      return db.transaction('rw', db.movimientos, db.categorias, async () => {
        const rec = toData(() => parseMovimiento(m));
        await assertCategoria(rec);
        await db.movimientos.put(rec);
        return rec;
      });
    },

    /** Inclusive range, optionally for one type. */
    listByRange,

    /** `mes` is 'YYYY-MM'. */
    listByMonth(mes: string, tipo?: TipoMovimiento): Promise<Movimiento[]> {
      const [desde, hasta] = monthBounds(mes);
      return listByRange(desde, hasta, tipo);
    },

    countByCategoria(categoriaId: string): Promise<number> {
      return db.movimientos.where('categoriaId').equals(categoriaId).count();
    },
  };
}
