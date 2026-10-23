// Record parsers: one source of truth for the integrity rules in 04-modelo-de-datos.md
// (section 8). Used by the repositories before writing and by the backup importer.
// Unknown fields are dropped; optional fields that are absent stay absent.
import { ValidationError } from './errors';
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
} from './models';
import { isISODate, isISODateTime, isNonNegativeInt, isPlainObject } from './util';

type Kind = 'text' | 'str' | 'date' | 'datetime' | 'cents' | 'bool' | 'strings' | 'json';

interface FieldSpec {
  readonly kind: Kind;
  readonly optional: boolean;
  readonly values?: readonly string[];
}

type Spec = Readonly<Record<string, FieldSpec>>;

const req = (kind: Kind): FieldSpec => ({ kind, optional: false });
const opt = (kind: Kind): FieldSpec => ({ kind, optional: true });
const pick = (values: readonly string[], optional = false): FieldSpec => ({
  kind: 'text',
  optional,
  values,
});

function fail(path: string, reason: string): never {
  throw new ValidationError(path, reason);
}

function checkValue(v: unknown, f: FieldSpec, path: string): unknown {
  switch (f.kind) {
    case 'text':
      if (typeof v !== 'string' || v.length === 0) fail(path, 'expected a non-empty string');
      if (f.values && !f.values.includes(v)) fail(path, `expected one of ${f.values.join('|')}`);
      return v;
    case 'str':
      if (typeof v !== 'string') fail(path, 'expected a string');
      return v;
    case 'date':
      if (!isISODate(v)) fail(path, 'expected a date YYYY-MM-DD');
      return v;
    case 'datetime':
      if (!isISODateTime(v)) fail(path, 'expected an ISO date-time');
      return v;
    case 'cents':
      if (!isNonNegativeInt(v)) fail(path, 'expected a non-negative integer');
      return v;
    case 'bool':
      if (typeof v !== 'boolean') fail(path, 'expected a boolean');
      return v;
    case 'strings':
      if (!Array.isArray(v) || !v.every((x) => typeof x === 'string')) {
        fail(path, 'expected an array of strings');
      }
      return [...(v as string[])];
    case 'json':
      return v;
  }
}

function parseWithSpec(spec: Spec, value: unknown, path: string): Record<string, unknown> {
  if (!isPlainObject(value)) fail(path, 'expected an object');
  const out: Record<string, unknown> = {};
  for (const [key, field] of Object.entries(spec)) {
    const v = value[key];
    if (v === undefined) {
      if (!field.optional) fail(`${path}.${key}`, 'is required');
      continue;
    }
    out[key] = checkValue(v, field, `${path}.${key}`);
  }
  return out;
}

const TIPO_MOV = ['ingreso', 'gasto'] as const;
const PERIODO_TIPO = ['mensual', 'trimestral', 'anual', 'eventual'] as const;
const ORIGEN = ['vector', 'calculada', 'manual'] as const;
const ESTADO = ['pendiente', 'pagada', 'omitida'] as const;
const CANAL = ['electronico', 'ventanilla', 'otro'] as const;
const METODO = ['efectivo', 'transferencia', 'otro'] as const;
const ADJ_TIPO = ['comprobante', 'documento', 'otro'] as const;
const ADJ_ALM = ['filesystem', 'blob'] as const;
const ADJ_VINC = ['obligacion', 'movimiento', 'perfil'] as const;

const PERFIL: Spec = {
  id: pick(['perfil']),
  nombreVisible: req('str'),
  actividadCodigo: opt('str'),
  actividadNombre: opt('str'),
  municipio: opt('str'),
  municipioCodigo: opt('str'),
  rc05: opt('str'),
  nit: opt('str'),
  fechaInscripcionFiscal: opt('date'),
  tieneEmpleados: req('bool'),
  tributosActivos: req('strings'),
  onboardingCompleto: req('bool'),
  reglasVersion: req('str'),
  creadoEn: req('datetime'),
  actualizadoEn: req('datetime'),
};

const AJUSTE: Spec = { clave: req('text'), valor: req('json') };

const CATEGORIA: Spec = {
  id: req('text'),
  nombre: req('text'),
  tipo: pick(TIPO_MOV),
  esSistema: req('bool'),
  color: opt('str'),
  icono: opt('str'),
};

const MOVIMIENTO: Spec = {
  id: req('text'),
  fecha: req('date'),
  tipo: pick(TIPO_MOV),
  monto: req('cents'),
  categoriaId: req('text'),
  descripcion: opt('str'),
  contraparte: opt('str'),
  metodo: pick(METODO),
  cuentaParaVentas: req('bool'),
  justificado: req('bool'),
  adjuntoId: opt('text'),
  creadoEn: req('datetime'),
  actualizadoEn: req('datetime'),
};

const OBLIGACION: Spec = {
  id: req('text'),
  tributoCodigo: req('text'),
  periodoTipo: pick(PERIODO_TIPO),
  periodoClave: req('text'),
  periodoEtiqueta: req('str'),
  vence: req('date'),
  venceOrigen: pick(ORIGEN),
  codigoBarras: opt('str'),
  importeEstimado: opt('cents'),
  importeOficial: opt('cents'),
  estado: pick(ESTADO),
  pagadaEn: opt('date'),
  importePagado: opt('cents'),
  canalPago: pick(CANAL, true),
  descuento3Aplicado: opt('bool'),
  recargoMora: opt('cents'),
  comprobanteAdjuntoId: opt('text'),
  motivoOmision: opt('str'),
  notas: opt('str'),
  creadoEn: req('datetime'),
  actualizadoEn: req('datetime'),
};

const ADJUNTO: Spec = {
  id: req('text'),
  tipo: pick(ADJ_TIPO),
  nombre: req('str'),
  mime: req('str'),
  tamano: req('cents'),
  almacenamiento: pick(ADJ_ALM),
  ruta: opt('str'),
  vinculadoTipo: pick(ADJ_VINC, true),
  vinculadoId: opt('text'),
  creadoEn: req('datetime'),
};

const FERIADO: Spec = { fecha: req('date'), nombre: req('str') };

const EMPLEADO: Spec = {
  id: req('text'),
  nombre: req('str'),
  cargo: opt('str'),
  remuneracionMensual: req('cents'),
  alta: req('date'),
  baja: opt('date'),
};

const NOMINA: Spec = {
  id: req('text'),
  empleadoId: req('text'),
  periodoClave: req('text'),
  remuneracion: req('cents'),
  retencionIsip: req('cents'),
  contribucionEspecial: req('cents'),
};

export function parsePerfil(v: unknown, path = 'perfil'): Perfil {
  return parseWithSpec(PERFIL, v, path) as unknown as Perfil;
}

export function parseAjuste(v: unknown, path = 'ajuste'): Ajuste {
  return parseWithSpec(AJUSTE, v, path) as unknown as Ajuste;
}

export function parseCategoria(v: unknown, path = 'categoria'): Categoria {
  return parseWithSpec(CATEGORIA, v, path) as unknown as Categoria;
}

export function parseMovimiento(v: unknown, path = 'movimiento'): Movimiento {
  return parseWithSpec(MOVIMIENTO, v, path) as unknown as Movimiento;
}

/** Also enforces: a `pagada` obligation needs `pagadaEn` and `importePagado`. */
export function parseObligacion(v: unknown, path = 'obligacion'): Obligacion {
  const o = parseWithSpec(OBLIGACION, v, path) as unknown as Obligacion;
  if (o.estado === 'pagada') {
    if (o.pagadaEn === undefined) fail(`${path}.pagadaEn`, 'is required when estado is pagada');
    if (o.importePagado === undefined) {
      fail(`${path}.importePagado`, 'is required when estado is pagada');
    }
  }
  return o;
}

/** Metadata only: the optional `blob` is handled by the caller. */
export function parseAdjunto(v: unknown, path = 'adjunto'): Omit<Adjunto, 'blob'> {
  return parseWithSpec(ADJUNTO, v, path) as unknown as Omit<Adjunto, 'blob'>;
}

export function parseFeriado(v: unknown, path = 'feriado'): Feriado {
  return parseWithSpec(FERIADO, v, path) as unknown as Feriado;
}

export function parseEmpleado(v: unknown, path = 'empleado'): Empleado {
  return parseWithSpec(EMPLEADO, v, path) as unknown as Empleado;
}

export function parseNomina(v: unknown, path = 'nomina'): Nomina {
  return parseWithSpec(NOMINA, v, path) as unknown as Nomina;
}
