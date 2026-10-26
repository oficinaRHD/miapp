// Texts of V08 (Calculadora del mes). Same style as src/i18n/registroLista.ts.
import type { CalcError } from '../app/calculadora';

export const esCalculadora = {
  title: 'Calculadora del mes',
  loading: 'Cargando…',
  loadError: 'No se pudieron cargar los datos',
  prevMonth: 'Mes anterior',
  nextMonth: 'Mes siguiente',
  lead: 'Toma los ingresos que registraste este mes. Puedes cambiarlos para probar otras cifras.',
  noIncome: 'No hay ingresos registrados este mes.',
  goRegistro: 'Ir al registro',
  ventasLabel: 'Ingresos por ventas y servicios (CUP)',
  ventasHint: 'Los ingresos marcados como "cuenta para el impuesto de ventas y servicios".',
  ingresosLabel: 'Ingresos totales del mes (CUP)',
  ingresosHint: 'Todos los ingresos del mes.',
  reset: 'Usar los del registro',
  base: 'Base',
  rate: 'Tasa',
  exempt: 'Mínimo exento mensual',
  rateOverExcess: (pct: string) => `${pct} sobre lo que pasa del mínimo exento`,
  tax: 'Impuesto estimado',
  totalTitle: 'Total estimado del mes',
  discount: {
    title: 'Si pagas por canal electrónico',
    lead: (pct: string) => `Descuento de ${pct} sobre cada pago.`,
    total: 'Total con descuento',
    saved: 'Descuento total',
  },
  use: {
    button: 'Usar como importe estimado',
    forPeriod: (label: string) => `Se guarda en la obligación de ${label}, sin el descuento.`,
    upToDate: 'Ya es el importe estimado de esa obligación.',
    saved: (label: string) => `Guardado como importe estimado de ${label}.`,
    open: 'Ver obligación',
    missing: (mes: string) =>
      `No hay una obligación de ${mes} para este tributo. Revisa tus tributos activos o genera el año en Obligaciones.`,
    paid: 'Esa obligación ya está pagada; no se cambia su importe.',
    omitted: 'Esa obligación está omitida; no se cambia su importe.',
    official:
      'Esa obligación ya tiene un importe oficial del vector, que es el que se muestra; el estimado se guarda igual.',
    editedNote: 'Se guardarán las cifras de arriba, aunque las hayas cambiado.',
    saveError: 'No se pudo guardar el importe',
  },
  disclaimer: 'Estimación orientativa. Confirma con tu vector fiscal.',
  exceptionNote:
    'No se consideran las excepciones del vector (por ejemplo, agentes de telecomunicaciones y de seguros).',
  error: (e: CalcError): string =>
    ({
      'ventas-invalid': 'Escribe un monto válido para ventas y servicios (puede ser 0).',
      'ingresos-invalid': 'Escribe un monto válido para los ingresos totales (puede ser 0).',
      'ventas-exceeds': 'Las ventas y servicios no pueden ser más que los ingresos totales.',
    })[e],
} as const;
