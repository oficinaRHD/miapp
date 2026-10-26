// Texts of V06/V07 (Registro). Same style as src/i18n/perfil.ts.
import type { DraftError } from '../app/registro';
import type { MetodoPago, TipoMovimiento } from '../data/models';

export const esRegistro = {
  newTitle: 'Nuevo movimiento',
  editTitle: 'Editar movimiento',
  loading: 'Cargando…',
  loadError: 'No se pudo cargar el movimiento',
  notFound: 'Este movimiento ya no existe.',
  back: 'Volver al registro',
  typeLabel: 'Tipo',
  tipo: { ingreso: 'Ingreso', gasto: 'Gasto' } satisfies Record<TipoMovimiento, string>,
  amountLabel: 'Monto (CUP)',
  amountHint: 'Ejemplo: 1250.50',
  amountPreview: (cup: string) => `Se guardará ${cup}`,
  dateLabel: 'Fecha',
  categoryLabel: 'Categoría',
  categoryPlaceholder: 'Elige una categoría',
  descriptionLabel: 'Descripción (opcional)',
  counterpartLabel: {
    ingreso: 'Cliente (opcional)',
    gasto: 'Proveedor (opcional)',
  } satisfies Record<TipoMovimiento, string>,
  methodLabel: 'Método',
  metodo: {
    efectivo: 'Efectivo',
    transferencia: 'Transferencia',
    otro: 'Otro',
  } satisfies Record<MetodoPago, string>,
  countsLabel: 'Cuenta para el impuesto de ventas y servicios',
  countsHint: 'Marca los ingresos por ventas o servicios. La calculadora solo usa los marcados.',
  receiptLabel: 'Tengo comprobante',
  receiptHint: 'Un gasto con comprobante cuenta como justificado.',
  save: 'Guardar',
  saveAndAnother: 'Guardar y añadir otro',
  remove: 'Eliminar',
  cancel: 'Cancelar',
  saved: 'Movimiento guardado. Puedes añadir otro.',
  saveError: 'No se pudo guardar el movimiento',
  deleted: 'Movimiento eliminado.',
  deleteError: 'No se pudo eliminar el movimiento',
  undo: 'Deshacer',
  undone: 'Movimiento restaurado.',
  undoError: 'No se pudo deshacer',
  error: (e: DraftError): string =>
    ({
      amount: 'Escribe un monto mayor que 0 (por ejemplo 1250.50).',
      date: 'Escribe una fecha válida.',
      category: 'Elige una categoría.',
      'category-type': 'La categoría no corresponde al tipo elegido.',
    })[e],
} as const;
