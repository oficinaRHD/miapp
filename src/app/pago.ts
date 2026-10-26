// Pure logic of V05 (Detalle y ficha de pago): payment quote, payment form and its validation.
// No fiscal rules here: late surcharge and discount come from src/domain/rules (01, sections 4 and 5).
import type { CanalPago, Obligacion } from '../data/models';
import type { PagoInput } from '../data/repositories/obligaciones';
import { NO_HOLIDAYS, lateBusinessDays, type Holidays } from '../domain/businessDays';
import { compareDates, isValidISODate } from '../domain/dates';
import { formatCup, parseCup } from '../domain/money';
import { electronicDiscount } from '../domain/rules/descuento';
import { lateSurcharge, type LateSurcharge } from '../domain/rules/mora';
import type { Centavos, ISODate } from '../domain/types';

export interface PaymentQuote {
  /** Amount owed before discount and surcharge: official, else estimated, else null. */
  principal: Centavos | null;
  /** Business days between the due date and the payment date (weekends only, no holidays yet). */
  lateDays: number;
  /** Surcharge on the principal. Null when there is no principal. */
  late: LateSurcharge | null;
  /** 3 % electronic discount on the principal (0 if not electronic or no principal). */
  discount: Centavos;
  /** principal - discount. The surcharge is NOT included: it is a separate tributo (1060122). */
  toPay: Centavos | null;
}

export interface PaymentForm {
  pagadaEn: string;
  /** Text typed by the user, parsed with `parseCup`. */
  importe: string;
  canal: CanalPago;
  descuento3: boolean;
  /** Late surcharge as text. Empty = none. */
  recargo: string;
  notas: string;
}

export type PaymentError = 'date-invalid' | 'date-future' | 'amount-invalid' | 'surcharge-invalid';

export function principalOf(o: Obligacion): Centavos | null {
  return o.importeOficial ?? o.importeEstimado ?? null;
}

/**
 * Estimate for paying `o` on `paidOn`. The discount is applied to the principal only:
 * whether it also applies to the surcharge is not stated in 01 (pending).
 */
export function quotePayment(
  o: Obligacion,
  paidOn: ISODate,
  electronic: boolean,
  holidays: Holidays = NO_HOLIDAYS,
): PaymentQuote {
  const principal = principalOf(o);
  const lateDays = lateBusinessDays(o.vence, paidOn, holidays);
  if (principal === null) return { principal: null, lateDays, late: null, discount: 0, toPay: null };
  const discount = electronic ? electronicDiscount(principal).discount : 0;
  return { principal, lateDays, late: lateSurcharge(principal, lateDays), discount, toPay: principal - discount };
}

/** Recomputes amount and surcharge from the date and the discount flag. Keeps the form if the date is invalid. */
function recompute(form: PaymentForm, o: Obligacion, holidays: Holidays): PaymentForm {
  if (!isValidISODate(form.pagadaEn)) return form;
  const q = quotePayment(o, form.pagadaEn, form.descuento3, holidays);
  return {
    ...form,
    importe: q.toPay === null ? form.importe : formatCup(q.toPay, false),
    recargo: q.late === null ? form.recargo : q.late.surcharge > 0 ? formatCup(q.late.surcharge, false) : '',
  };
}

/** Starting form: paid today, window channel, no discount, amounts from the quote. */
export function suggestedForm(o: Obligacion, today: ISODate, holidays: Holidays = NO_HOLIDAYS): PaymentForm {
  return recompute(
    { pagadaEn: today, importe: '', canal: 'ventanilla', descuento3: false, recargo: '', notas: '' },
    o,
    holidays,
  );
}

export function setPagadaEn(
  form: PaymentForm,
  o: Obligacion,
  value: string,
  holidays: Holidays = NO_HOLIDAYS,
): PaymentForm {
  return recompute({ ...form, pagadaEn: value }, o, holidays);
}

/** The 3 % discount is only offered for the electronic channel: choosing it turns it on, another channel turns it off. */
export function setCanal(
  form: PaymentForm,
  o: Obligacion,
  canal: CanalPago,
  holidays: Holidays = NO_HOLIDAYS,
): PaymentForm {
  return recompute({ ...form, canal, descuento3: canal === 'electronico' }, o, holidays);
}

export function setDescuento(
  form: PaymentForm,
  o: Obligacion,
  value: boolean,
  holidays: Holidays = NO_HOLIDAYS,
): PaymentForm {
  return recompute({ ...form, descuento3: value && form.canal === 'electronico' }, o, holidays);
}

export function validatePayment(form: PaymentForm, today: ISODate): PaymentError[] {
  const errors: PaymentError[] = [];
  if (!isValidISODate(form.pagadaEn)) errors.push('date-invalid');
  else if (compareDates(form.pagadaEn, today) > 0) errors.push('date-future');
  if (parseCup(form.importe) === null) errors.push('amount-invalid');
  if (form.recargo.trim() !== '' && parseCup(form.recargo) === null) errors.push('surcharge-invalid');
  return errors;
}

/** Builds the repository input. Call only when `validatePayment` returns no errors. */
export function toPagoInput(form: PaymentForm): PagoInput {
  const importe = parseCup(form.importe);
  if (importe === null) throw new RangeError(`Invalid amount: ${form.importe}`);
  const out: PagoInput = {
    pagadaEn: form.pagadaEn,
    importePagado: importe,
    canalPago: form.canal,
    descuento3Aplicado: form.descuento3,
  };
  const recargo = form.recargo.trim() === '' ? null : parseCup(form.recargo);
  if (recargo !== null && recargo > 0) out.recargoMora = recargo;
  const notas = form.notas.trim();
  if (notas) out.notas = notas;
  return out;
}

/** '125050' -> '1250.50': no grouping and no suffix, to paste into a payment field. */
export function plainAmount(centavos: Centavos): string {
  const pesos = Math.floor(centavos / 100);
  return `${pesos}.${String(centavos % 100).padStart(2, '0')}`;
}

/** Basis points as a percentage with decimal comma: 200 -> '2', 610 -> '6,1', 4000 -> '40'. */
export function ratePercent(rateBp: number): string {
  return String(rateBp / 100).replace('.', ',');
}
