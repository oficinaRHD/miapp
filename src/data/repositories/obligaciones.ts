import type { AppDB } from '../db';
import { DataError, toData } from '../errors';
import type {
  CanalPago,
  Centavos,
  EstadoObligacion,
  ISODate,
  Obligacion,
  OrigenFecha,
  PeriodoTipo,
} from '../models';
import { parseObligacion } from '../schema';
import { newId, nowISO } from '../util';

/** What `generateObligations` (src/domain/schedule.ts) returns, before the repository adds id and stamps. */
export interface ObligacionDraftInput {
  tributoCodigo: string;
  periodoTipo: PeriodoTipo;
  periodoClave: string;
  periodoEtiqueta: string;
  vence: ISODate;
  venceOrigen: OrigenFecha;
  codigoBarras?: string;
  importeEstimado?: Centavos;
  importeOficial?: Centavos;
}

export interface PagoInput {
  pagadaEn: ISODate;
  importePagado: Centavos;
  canalPago?: CanalPago;
  descuento3Aplicado?: boolean;
  recargoMora?: Centavos;
  comprobanteAdjuntoId?: string;
  notas?: string;
}

export interface ObligacionFilter {
  estado?: EstadoObligacion;
  desde?: ISODate;
  hasta?: ISODate;
}

export interface ObligacionChanges {
  importeEstimado?: Centavos;
  importeOficial?: Centavos;
  codigoBarras?: string;
  notas?: string;
}

const keyOf = (tributoCodigo: string, periodoClave: string): string =>
  `${tributoCodigo}|${periodoClave}`;

export function obligacionesRepo(db: AppDB) {
  async function load(id: string): Promise<Obligacion> {
    const cur = await db.obligaciones.get(id);
    if (!cur) throw new DataError('not-found', `obligacion ${id}`);
    return cur;
  }

  return {
    get(id: string): Promise<Obligacion | undefined> {
      return db.obligaciones.get(id);
    },

    /**
     * Idempotent: a draft whose [tributoCodigo + periodoClave] already exists is skipped, so
     * existing obligations (paid ones included) are never overwritten. New ones start `pendiente`.
     */
    addDrafts(drafts: readonly ObligacionDraftInput[]): Promise<{ added: number; skipped: number }> {
      return db.transaction('rw', db.obligaciones, async () => {
        const seen = new Set((await db.obligaciones.toArray()).map((o) => keyOf(o.tributoCodigo, o.periodoClave)));
        const toAdd: Obligacion[] = [];
        let skipped = 0;
        drafts.forEach((d, i) => {
          const k = keyOf(d.tributoCodigo, d.periodoClave);
          if (seen.has(k)) {
            skipped++;
            return;
          }
          seen.add(k);
          const now = nowISO();
          toAdd.push(
            toData(() =>
              parseObligacion(
                { ...d, id: newId(), estado: 'pendiente', creadoEn: now, actualizadoEn: now },
                `drafts[${i}]`,
              ),
            ),
          );
        });
        if (toAdd.length > 0) await db.obligaciones.bulkAdd(toAdd);
        return { added: toAdd.length, skipped };
      });
    },

    /** Filters by due date range (inclusive) and/or state; ordered by due date. */
    async list(filter: ObligacionFilter = {}): Promise<Obligacion[]> {
      const { estado, desde, hasta } = filter;
      let rows: Obligacion[];
      if (desde !== undefined || hasta !== undefined) {
        rows = await db.obligaciones
          .where('vence')
          .between(desde ?? '0000-01-01', hasta ?? '9999-12-31', true, true)
          .toArray();
      } else if (estado !== undefined) {
        rows = await db.obligaciones.where('estado').equals(estado).toArray();
      } else {
        rows = await db.obligaciones.toArray();
      }
      if (estado !== undefined) rows = rows.filter((o) => o.estado === estado);
      return rows.sort(
        (a, b) => a.vence.localeCompare(b.vence) || a.tributoCodigo.localeCompare(b.tributoCodigo),
      );
    },

    markPaid(id: string, pago: PagoInput): Promise<Obligacion> {
      return db.transaction('rw', db.obligaciones, async () => {
        const cur = await load(id);
        const next = toData(() =>
          parseObligacion({
            ...cur,
            ...pago,
            estado: 'pagada',
            motivoOmision: undefined,
            actualizadoEn: nowISO(),
          }),
        );
        await db.obligaciones.put(next);
        return next;
      });
    },

    /** Back to `pendiente`, clearing the payment data (undo of markPaid). */
    reopen(id: string): Promise<Obligacion> {
      return db.transaction('rw', db.obligaciones, async () => {
        const cur = await load(id);
        const next = toData(() =>
          parseObligacion({
            ...cur,
            estado: 'pendiente',
            pagadaEn: undefined,
            importePagado: undefined,
            canalPago: undefined,
            descuento3Aplicado: undefined,
            recargoMora: undefined,
            motivoOmision: undefined,
            actualizadoEn: nowISO(),
          }),
        );
        await db.obligaciones.put(next);
        return next;
      });
    },

    markOmitted(id: string, motivo?: string): Promise<Obligacion> {
      return db.transaction('rw', db.obligaciones, async () => {
        const cur = await load(id);
        if (cur.estado === 'pagada') throw new DataError('integrity', 'paid-obligation-locked');
        const next = toData(() =>
          parseObligacion({ ...cur, estado: 'omitida', motivoOmision: motivo, actualizadoEn: nowISO() }),
        );
        await db.obligaciones.put(next);
        return next;
      });
    },

    /** Changes the due date (e.g. from the vector). A paid obligation is never touched. */
    setDueDate(id: string, vence: ISODate, origen: OrigenFecha = 'manual'): Promise<Obligacion> {
      return db.transaction('rw', db.obligaciones, async () => {
        const cur = await load(id);
        if (cur.estado === 'pagada') throw new DataError('integrity', 'paid-obligation-locked');
        const next = toData(() =>
          parseObligacion({ ...cur, vence, venceOrigen: origen, actualizadoEn: nowISO() }),
        );
        await db.obligaciones.put(next);
        return next;
      });
    },

    update(id: string, changes: ObligacionChanges): Promise<Obligacion> {
      return db.transaction('rw', db.obligaciones, async () => {
        const cur = await load(id);
        const next = toData(() => parseObligacion({ ...cur, ...changes, actualizadoEn: nowISO() }));
        await db.obligaciones.put(next);
        return next;
      });
    },

    async remove(id: string): Promise<void> {
      await db.obligaciones.delete(id);
    },
  };
}
