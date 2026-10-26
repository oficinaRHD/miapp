// Text of the payment sheet that V05 shares. Pure: the view decides what to include.
import { detalle as t } from '../i18n/detalle';
import type { Centavos, ISODate } from '../domain/types';
import { formatDate } from './format';
import { plainAmount } from './pago';

export interface SheetTextInput {
  tributoName: string;
  tributoCodigo: string;
  periodoEtiqueta: string;
  vence: ISODate;
  codigoBarras: string | undefined;
  /** Amount to pay, in centavos, or null when unknown. */
  importe: Centavos | null;
  /** RC-05 already formatted, or undefined to leave it out (it is personal data). */
  rc05: string | undefined;
}

export function buildSheetText(i: SheetTextInput): string {
  const lines = [
    t.share.heading,
    `${t.tributo}: ${i.tributoName} (${i.tributoCodigo})`,
    `${t.period}: ${i.periodoEtiqueta}`,
    `${t.due}: ${formatDate(i.vence)}`,
  ];
  if (i.codigoBarras) lines.push(`${t.barcode}: ${i.codigoBarras}`);
  if (i.importe !== null) lines.push(`${t.fields.importe}: ${plainAmount(i.importe)} CUP`);
  if (i.rc05) lines.push(`${t.share.rc05Label}: ${i.rc05}`);
  lines.push('', t.notes.estimate);
  return lines.join('\n');
}
