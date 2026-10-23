import Dexie, { type DexieOptions, type Table } from 'dexie';
import type {
  Adjunto,
  Ajuste,
  Categoria,
  Empleado,
  Feriado,
  Movimiento,
  Nomina,
  Obligacion,
  Perfil,
  Recordatorio,
} from './models';
import { DB_NAME } from './version';

export class AppDB extends Dexie {
  declare perfil: Table<Perfil, string>;
  declare ajustes: Table<Ajuste, string>;
  declare categorias: Table<Categoria, string>;
  declare movimientos: Table<Movimiento, string>;
  declare obligaciones: Table<Obligacion, string>;
  declare adjuntos: Table<Adjunto, string>;
  declare feriados: Table<Feriado, string>;
  declare recordatorios: Table<Recordatorio, string>;
  declare empleados: Table<Empleado, string>;
  declare nominas: Table<Nomina, string>;

  /** `name` and `options` are only overridden in tests (fake-indexeddb). */
  constructor(name: string = DB_NAME, options?: DexieOptions) {
    super(name, options);
    // Never edit a published version: add this.version(n + 1) with .upgrade(), and bump
    // SCHEMA_VERSION in version.ts (04-modelo-de-datos.md, section 3).
    this.version(1).stores({
      perfil: 'id',
      ajustes: 'clave',
      categorias: 'id, tipo',
      movimientos: 'id, fecha, tipo, categoriaId, [tipo+fecha]',
      obligaciones: 'id, vence, estado, tributoCodigo, &[tributoCodigo+periodoClave]',
      adjuntos: 'id, vinculadoTipo, vinculadoId',
      feriados: 'fecha',
      recordatorios: 'id, obligacionId, fechaHora',
      empleados: 'id',
      nominas: 'id, empleadoId, periodoClave',
    });
  }
}
