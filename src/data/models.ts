// Stored record types. Primitive types come from the domain layer.
import type { Centavos, ISODate, OrigenFecha, PeriodoTipo } from '../domain/types';

export type { Centavos, ISODate, OrigenFecha, PeriodoTipo };

/** '2026-10-20T08:36:00-04:00' */
export type ISODateTime = string;

export type EstadoObligacion = 'pendiente' | 'pagada' | 'omitida';
export type CanalPago = 'electronico' | 'ventanilla' | 'otro';
export type TipoMovimiento = 'ingreso' | 'gasto';
export type MetodoPago = 'efectivo' | 'transferencia' | 'otro';

export interface Perfil {
  id: 'perfil';
  nombreVisible: string;
  actividadCodigo?: string;
  actividadNombre?: string;
  municipio?: string;
  municipioCodigo?: string;
  rc05?: string; // personal: excluded from backups by default
  nit?: string; // personal: excluded from backups by default
  fechaInscripcionFiscal?: ISODate;
  tieneEmpleados: boolean;
  tributosActivos: string[];
  onboardingCompleto: boolean;
  reglasVersion: string;
  creadoEn: ISODateTime;
  actualizadoEn: ISODateTime;
}

export interface Obligacion {
  id: string;
  tributoCodigo: string;
  periodoTipo: PeriodoTipo;
  periodoClave: string;
  periodoEtiqueta: string;
  vence: ISODate;
  venceOrigen: OrigenFecha;
  codigoBarras?: string;
  importeEstimado?: Centavos;
  importeOficial?: Centavos;
  estado: EstadoObligacion;
  pagadaEn?: ISODate;
  importePagado?: Centavos;
  canalPago?: CanalPago;
  descuento3Aplicado?: boolean;
  recargoMora?: Centavos;
  comprobanteAdjuntoId?: string;
  motivoOmision?: string;
  notas?: string;
  creadoEn: ISODateTime;
  actualizadoEn: ISODateTime;
}

export interface Movimiento {
  id: string;
  fecha: ISODate;
  tipo: TipoMovimiento;
  monto: Centavos;
  categoriaId: string;
  descripcion?: string;
  contraparte?: string;
  metodo: MetodoPago;
  cuentaParaVentas: boolean;
  justificado: boolean;
  adjuntoId?: string;
  creadoEn: ISODateTime;
  actualizadoEn: ISODateTime;
}

export interface Categoria {
  id: string;
  nombre: string;
  tipo: TipoMovimiento;
  esSistema: boolean;
  color?: string;
  icono?: string;
}

export interface Adjunto {
  id: string;
  tipo: 'comprobante' | 'documento' | 'otro';
  nombre: string;
  mime: string;
  tamano: number;
  almacenamiento: 'filesystem' | 'blob';
  ruta?: string;
  blob?: Blob; // browser tests only; never exported
  vinculadoTipo?: 'obligacion' | 'movimiento' | 'perfil';
  vinculadoId?: string;
  creadoEn: ISODateTime;
}

export interface Feriado {
  fecha: ISODate;
  nombre: string;
}

export interface Recordatorio {
  id: string;
  tipo: 'vencimiento' | 'registro-mensual' | 'respaldo' | 'formal';
  obligacionId?: string;
  desfaseDias?: number;
  fechaHora: ISODateTime;
  notificacionId: number;
}

export interface Ajuste {
  clave: string;
  valor: unknown;
}

export interface Empleado {
  id: string;
  nombre: string;
  cargo?: string;
  remuneracionMensual: Centavos;
  alta: ISODate;
  baja?: ISODate;
}

export interface Nomina {
  id: string;
  empleadoId: string;
  periodoClave: string;
  remuneracion: Centavos;
  retencionIsip: Centavos;
  contribucionEspecial: Centavos;
}
