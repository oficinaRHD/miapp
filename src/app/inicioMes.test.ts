import { describe, expect, it } from 'vitest';
import type { Movimiento } from '../data/models';
import { buildMonthSummary } from './inicioMes';

function mov(p: Partial<Movimiento> & Pick<Movimiento, 'id' | 'tipo' | 'monto'>): Movimiento {
  return {
    fecha: '2026-10-05',
    categoriaId: p.tipo === 'ingreso' ? 'cat-ing-ventas' : 'cat-gas-transporte',
    metodo: 'efectivo',
    cuentaParaVentas: p.tipo === 'ingreso',
    justificado: false,
    creadoEn: '2026-10-05T10:00:00-04:00',
    actualizadoEn: '2026-10-05T10:00:00-04:00',
    ...p,
  };
}

describe('buildMonthSummary', () => {
  it('is all zero for a month without movements', () => {
    expect(buildMonthSummary([])).toEqual({ ingresos: 0, gastos: 0, impuesto: 0, count: 0 });
  });
  it('estimates the tax from sales income and total income', () => {
    const s = buildMonthSummary([
      mov({ id: '1', tipo: 'ingreso', monto: 100_000 }), // sales: 10 % = 100.00
      mov({ id: '2', tipo: 'ingreso', monto: 400_000, cuentaParaVentas: false }),
      mov({ id: '3', tipo: 'gasto', monto: 30_000 }),
    ]);
    // 0114022: 10 % of 1,000.00 = 100.00; 0510122: 5 % of (5,000.00 - 3,260.00) = 87.00
    expect(s).toEqual({ ingresos: 500_000, gastos: 30_000, impuesto: 18_700, count: 3 });
  });
});
