// Texts of V08 (Calculadora del mes). Same style as src/i18n/registroLista.ts.
import type { CalcError } from '../app/calculadora';

export const esCalculadora = {
  title: 'Calculadora del mes',
  loading: 'Cargando…',
  loadError: 'No se pudieron cargar los ingresos',
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
