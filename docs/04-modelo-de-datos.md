# Modelo de datos

Base de datos local con Dexie (IndexedDB). Todo el acceso pasa por repositorios en `src/data/repositories/`.

## 1. Convenciones

- **Dinero**: enteros en **centavos** de CUP (`125050` = 1,250.50). Nunca decimales flotantes.
- **Fechas**: texto `YYYY-MM-DD` en fecha local de Cuba, sin hora ni zona horaria. Marcas de tiempo (`creadoEn`) en ISO con zona.
- **IDs**: `crypto.randomUUID()`.
- **Borrado**: borrado real con "deshacer" en pantalla (sin papelera en v0.1).
- **Datos personales** (`rc05`, `nit`): opcionales, solo locales, excluidos del respaldo por defecto.

## 2. Tipos (TypeScript)

Los tipos primitivos `ISODate`, `Centavos`, `PeriodoTipo` y `OrigenFecha` viven en `src/domain/types.ts` y `src/data/models.ts` los importa; `ISODateTime` se define en `src/data/models.ts`.

```ts
export type ISODate = string;      // 'YYYY-MM-DD'
export type ISODateTime = string;  // '2026-10-20T08:36:00-04:00'
export type Centavos = number;     // entero

export interface Perfil {
  id: 'perfil';
  nombreVisible: string;
  actividadCodigo?: string;        // ej. '6201'
  actividadNombre?: string;
  municipio?: string;
  municipioCodigo?: string;        // ej. '3406' (DPA del vector y del RC-05)
  rc05?: string;                   // 16 dígitos sin guiones
  nit?: string;
  fechaInscripcionFiscal?: ISODate;
  tieneEmpleados: boolean;
  tributosActivos: string[];       // códigos: '0114022', ...
  onboardingCompleto: boolean;
  reglasVersion: string;           // '2026.1'
  creadoEn: ISODateTime;
  actualizadoEn: ISODateTime;
}

export type PeriodoTipo = 'mensual' | 'trimestral' | 'anual' | 'eventual';
export type EstadoObligacion = 'pendiente' | 'pagada' | 'omitida';
export type OrigenFecha = 'vector' | 'calculada' | 'manual';
export type CanalPago = 'electronico' | 'ventanilla' | 'otro';

export interface Obligacion {
  id: string;
  tributoCodigo: string;
  periodoTipo: PeriodoTipo;
  periodoClave: string;            // '2026-09' | '2026-T3' | '2026' | 'evt-2026-06'
  periodoEtiqueta: string;         // 'Septiembre 2026'
  vence: ISODate;
  venceOrigen: OrigenFecha;
  codigoBarras?: string;           // parcial, ej. '764 - 16'
  importeEstimado?: Centavos;
  importeOficial?: Centavos;       // el que figura en el vector, si lo hay
  estado: EstadoObligacion;
  pagadaEn?: ISODate;
  importePagado?: Centavos;        // lo pagado del tributo, tras el descuento y sin el recargo
  canalPago?: CanalPago;
  descuento3Aplicado?: boolean;
  recargoMora?: Centavos;          // recargo anotado (tributo 1060122), aparte de importePagado
  comprobanteAdjuntoId?: string;
  motivoOmision?: string;
  notas?: string;
  creadoEn: ISODateTime;
  actualizadoEn: ISODateTime;
}

export type TipoMovimiento = 'ingreso' | 'gasto';
export type MetodoPago = 'efectivo' | 'transferencia' | 'otro';

export interface Movimiento {
  id: string;
  fecha: ISODate;
  tipo: TipoMovimiento;
  monto: Centavos;                 // siempre positivo
  categoriaId: string;
  descripcion?: string;
  contraparte?: string;            // cliente o proveedor
  metodo: MetodoPago;
  cuentaParaVentas: boolean;       // ingreso sujeto a 0114022 (ventas y servicios); 0510122 usa todos los ingresos
  justificado: boolean;            // tiene comprobante (regla del 80 % de gastos)
  adjuntoId?: string;
  creadoEn: ISODateTime;
  actualizadoEn: ISODateTime;
}

export interface Categoria {
  id: string;
  nombre: string;
  tipo: TipoMovimiento;
  esSistema: boolean;              // no se puede borrar
  color?: string;
  icono?: string;
}

export interface Adjunto {          // v0.2 (la tabla existe desde v0.1)
  id: string;
  tipo: 'comprobante' | 'documento' | 'otro';
  nombre: string;
  mime: string;
  tamano: number;
  almacenamiento: 'filesystem' | 'blob';
  ruta?: string;                   // Filesystem, directorio de datos de la app
  blob?: Blob;                     // solo para pruebas en navegador
  vinculadoTipo?: 'obligacion' | 'movimiento' | 'perfil';
  vinculadoId?: string;
  creadoEn: ISODateTime;
}

export interface Feriado { fecha: ISODate; nombre: string; }

export interface Recordatorio {
  id: string;
  tipo: 'vencimiento' | 'registro-mensual' | 'respaldo' | 'formal';
  obligacionId?: string;
  desfaseDias?: number;
  fechaHora: ISODateTime;
  notificacionId: number;          // entero que usa el plugin de notificaciones
}

export interface Ajuste { clave: string; valor: unknown; }

export interface Empleado {         // v0.3
  id: string;
  nombre: string;
  cargo?: string;
  remuneracionMensual: Centavos;
  alta: ISODate;
  baja?: ISODate;
}

export interface Nomina {           // v0.3
  id: string;
  empleadoId: string;
  periodoClave: string;            // '2026-09'
  remuneracion: Centavos;
  retencionIsip: Centavos;         // 0520522
  contribucionEspecial: Centavos;  // 0820232
}
```

## 3. Esquema de Dexie

```ts
import Dexie, { type Table } from 'dexie';

export class AppDB extends Dexie {
  perfil!: Table<Perfil, string>;
  ajustes!: Table<Ajuste, string>;
  categorias!: Table<Categoria, string>;
  movimientos!: Table<Movimiento, string>;
  obligaciones!: Table<Obligacion, string>;
  adjuntos!: Table<Adjunto, string>;
  feriados!: Table<Feriado, string>;
  recordatorios!: Table<Recordatorio, string>;
  empleados!: Table<Empleado, string>;
  nominas!: Table<Nomina, string>;

  constructor() {
    super('asistente-tcp');
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
```

**Migraciones**: cada cambio de esquema añade `this.version(n+1).stores({...}).upgrade(...)`. Nunca editar una versión ya publicada. El número de versión de Dexie y el `schemaVersion` del respaldo se mantienen alineados.

## 4. Datos iniciales (semillas)

**Categorías de ingreso**: Ventas, Servicios, Otros ingresos.
**Categorías de gasto**: Materiales e insumos, Electricidad y comunicaciones, Transporte, Alquiler, Equipos y herramientas, Salarios, Tributos y contribuciones, Otros gastos.

**Catálogo de tributos**: tomado de `01-reglas-fiscales-tcp.md` (código, nombre, periodicidad, regla de fecha por defecto). Vive en `src/domain/tributos.catalog.ts` como código versionado (`reglasVersion`), no en la base de datos, para que una actualización de la app corrija reglas sin migrar datos.

## 5. Generación de obligaciones del año

`schedule.ts` recibe los tributos activos del perfil, el año y, opcionalmente, las fechas del vector, y devuelve borradores (`ObligationDraft`, sin `id` ni marcas de tiempo); el repositorio (`addDrafts`) los completa y los guarda:

1. Para cada tributo activo mensual, una por mes, con fecha calculada por patrón (`venceOrigen: 'calculada'`).
2. Para los trimestrales, una por trimestre; para el anual, una.
3. Si el usuario carga fechas del vector, reemplazan a las calculadas (`venceOrigen: 'vector'`).
4. Es **idempotente**: el repositorio (`addDrafts`) salta los borradores cuya clave `[tributoCodigo+periodoClave]` ya existe, así nunca pisa obligaciones ya pagadas; el índice único lo respalda.
5. **Generación inicial (onboarding)**: solo se crean los periodos del año en curso cuya fecha calculada es igual o posterior al día 1 del mes actual (`buildPlan`, `src/app/yearDates.ts`). Una fecha del vector reemplaza a la calculada pero nunca añade ni quita periodos. Generar el año siguiente queda pendiente.

## 6. Estadísticas (se calculan, no se guardan)

| Dato | Consulta |
|---|---|
| Ingresos y gastos por mes | `movimientos` por rango de `fecha`, agrupado por `AAAA-MM` y `tipo` |
| Neto del mes | ingresos menos gastos |
| Impuesto estimado del mes | 0114022 sobre los ingresos con `cuentaParaVentas`; 0510122 sobre todos los ingresos del mes (`src/app/calculadora.ts`) |
| Impuesto pagado | suma de `importePagado` de obligaciones `pagada` |
| Pagos a tiempo | `pagadaEn <= vence` entre las obligaciones pagadas |
| Gastos justificados | suma de gastos con `justificado` entre gastos totales |
| Acumulado anual | suma de ingresos del año frente a 500,000.00 |

## 7. Formato del respaldo

```json
{
  "app": "asistente-tcp",
  "schemaVersion": 1,
  "reglasVersion": "2026.1",
  "exportadoEn": "2026-10-20T08:36:00-04:00",
  "incluyeDatosPersonales": false,
  "datos": {
    "perfil": {},
    "ajustes": [],
    "categorias": [],
    "movimientos": [],
    "obligaciones": [],
    "adjuntos": [],
    "feriados": [],
    "empleados": [],
    "nominas": []
  }
}
```

- `perfil` puede ser `null` (aún sin onboarding).
- `recordatorios` no se respalda: se regeneran al restaurar.
- Si `incluyeDatosPersonales` es `false`, se omiten `rc05` y `nit`.
- v0.1: respaldo de datos sin archivos adjuntos: los adjuntos viajan solo como metadatos (se pierde el `blob`). v0.2: ZIP con los adjuntos.
- **Importar**: validar `app` y `schemaVersion` (rechazar versiones futuras), migrar si es anterior, hacer respaldo automático previo, reemplazar en una sola transacción y reprogramar notificaciones.

## 8. Reglas de integridad

- `monto` y los importes son enteros no negativos.
- Una obligación `pagada` exige `pagadaEn` e `importePagado`.
- `[tributoCodigo+periodoClave]` es único.
- Eliminar una categoría con movimientos exige reasignarlos antes.
- Todo cambio en obligaciones dispara la reprogramación de notificaciones.
