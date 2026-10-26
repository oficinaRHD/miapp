import { describe, expect, it } from 'vitest';
import type { Obligacion } from '../data/models';
import {
  plainAmount,
  principalOf,
  quotePayment,
  ratePercent,
  setCanal,
  setDescuento,
  setPagadaEn,
  suggestedForm,
  toPagoInput,
  validatePayment,
  type PaymentForm,
} from './pago';

function ob(over: Partial<Obligacion> = {}): Obligacion {
  return {
    id: 'o1',
    tributoCodigo: '0114022',
    periodoTipo: 'mensual',
    periodoClave: '2026-09',
    periodoEtiqueta: 'Septiembre 2026',
    vence: '2026-10-20', // Tuesday
    venceOrigen: 'calculada',
    estado: 'pendiente',
    creadoEn: '2026-10-01T08:00:00-04:00',
    actualizadoEn: '2026-10-01T08:00:00-04:00',
    ...over,
  };
}

const withAmount = ob({ importeEstimado: 100000 }); // 1,000.00
const today = '2026-10-25'; // Sunday

describe('principalOf', () => {
  it('prefers the official amount, then the estimated one', () => {
    expect(principalOf(ob({ importeOficial: 5000, importeEstimado: 3000 }))).toBe(5000);
    expect(principalOf(ob({ importeEstimado: 3000 }))).toBe(3000);
    expect(principalOf(ob())).toBeNull();
  });
});

describe('quotePayment', () => {
  it('has no surcharge when paid on the due date', () => {
    const q = quotePayment(withAmount, '2026-10-20', false);
    expect(q.lateDays).toBe(0);
    expect(q.late?.surcharge).toBe(0);
    expect(q.toPay).toBe(100000);
  });

  it('counts business days late and applies 2 % up to 30 days', () => {
    const q = quotePayment(withAmount, '2026-10-26', false); // Wed, Thu, Fri, Mon
    expect(q.lateDays).toBe(4);
    expect(q.late?.tier).toBe('upTo30');
    expect(q.late?.surcharge).toBe(2000);
  });

  it('applies 5 % between 31 and 60 business days', () => {
    const q = quotePayment(ob({ vence: '2026-08-20', importeEstimado: 100000 }), '2026-10-20', false);
    expect(q.lateDays).toBe(43);
    expect(q.late?.tier).toBe('from31to60');
    expect(q.late?.surcharge).toBe(5000);
  });

  it('applies the 3 % discount to the principal only', () => {
    const q = quotePayment(withAmount, '2026-10-26', true);
    expect(q.discount).toBe(3000);
    expect(q.toPay).toBe(97000);
    expect(q.late?.surcharge).toBe(2000);
  });

  it('cannot estimate without an amount, but still counts the days', () => {
    const q = quotePayment(ob(), '2026-10-26', true);
    expect(q).toEqual({ principal: null, lateDays: 4, late: null, discount: 0, toPay: null });
  });
});

describe('payment form', () => {
  it('starts paid today, at the window, with the amounts of the quote', () => {
    const f = suggestedForm(withAmount, today);
    expect(f).toEqual({
      pagadaEn: today,
      importe: '1,000.00',
      canal: 'ventanilla',
      descuento3: false,
      recargo: '20.00',
      notas: '',
    });
  });

  it('turns the discount on with the electronic channel and off with another', () => {
    const f = setCanal(suggestedForm(withAmount, today), withAmount, 'electronico');
    expect(f.descuento3).toBe(true);
    expect(f.importe).toBe('970.00');
    const g = setCanal(f, withAmount, 'otro');
    expect(g.descuento3).toBe(false);
    expect(g.importe).toBe('1,000.00');
  });

  it('only allows the discount flag with the electronic channel', () => {
    const f = suggestedForm(withAmount, today);
    expect(setDescuento(f, withAmount, true).descuento3).toBe(false);
    const e = setCanal(f, withAmount, 'electronico');
    expect(setDescuento(e, withAmount, false).importe).toBe('1,000.00');
  });

  it('recomputes the surcharge when the date changes and clears it when on time', () => {
    const f = suggestedForm(withAmount, today);
    expect(setPagadaEn(f, withAmount, '2026-10-20').recargo).toBe('');
    expect(setPagadaEn(f, withAmount, '2026-10-26').recargo).toBe('20.00');
  });

  it('keeps what the user typed when the date is invalid or there is no amount', () => {
    const f = { ...suggestedForm(withAmount, today), importe: '999.00' };
    expect(setPagadaEn(f, withAmount, '').importe).toBe('999.00');
    const none = suggestedForm(ob(), today);
    expect(none.importe).toBe('');
    expect(none.recargo).toBe('');
  });
});

describe('validatePayment and toPagoInput', () => {
  const ok: PaymentForm = {
    pagadaEn: '2026-10-22',
    importe: '1,000.00',
    canal: 'electronico',
    descuento3: true,
    recargo: '',
    notas: '  ',
  };

  it('accepts a valid form', () => {
    expect(validatePayment(ok, today)).toEqual([]);
  });

  it('reports each problem', () => {
    expect(validatePayment({ ...ok, pagadaEn: '' }, today)).toEqual(['date-invalid']);
    expect(validatePayment({ ...ok, pagadaEn: '2026-10-26' }, today)).toEqual(['date-future']);
    expect(validatePayment({ ...ok, importe: 'abc' }, today)).toEqual(['amount-invalid']);
    expect(validatePayment({ ...ok, importe: '' }, today)).toEqual(['amount-invalid']);
    expect(validatePayment({ ...ok, recargo: '1x' }, today)).toEqual(['surcharge-invalid']);
  });

  it('builds the repository input without empty optional fields', () => {
    expect(toPagoInput(ok)).toEqual({
      pagadaEn: '2026-10-22',
      importePagado: 100000,
      canalPago: 'electronico',
      descuento3Aplicado: true,
    });
  });

  it('includes the surcharge only when above zero, and trimmed notes', () => {
    const f = { ...ok, recargo: '20.00', notas: ' pagado en banco ' };
    const out = toPagoInput(f);
    expect(out.recargoMora).toBe(2000);
    expect(out.notas).toBe('pagado en banco');
    expect(toPagoInput({ ...ok, recargo: '0' }).recargoMora).toBeUndefined();
  });

  it('refuses to build from an invalid amount', () => {
    expect(() => toPagoInput({ ...ok, importe: 'x' })).toThrow(RangeError);
  });
});

describe('plainAmount and ratePercent', () => {
  it('formats an amount to paste into a payment field', () => {
    expect(plainAmount(125050)).toBe('1250.50');
    expect(plainAmount(5)).toBe('0.05');
    expect(plainAmount(0)).toBe('0.00');
    expect(plainAmount(100000)).toBe('1000.00');
  });
  it('formats rates with decimal comma', () => {
    expect(ratePercent(200)).toBe('2');
    expect(ratePercent(500)).toBe('5');
    expect(ratePercent(610)).toBe('6,1');
    expect(ratePercent(4000)).toBe('40');
  });
});
