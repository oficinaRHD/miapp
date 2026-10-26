import { describe, expect, it } from 'vitest';
import type { Obligacion } from '../data/models';
import { findEstimateTarget } from './calculadoraLink';

function obl(p: Partial<Obligacion> = {}): Obligacion {
  return {
    id: 'o1',
    tributoCodigo: '0114022',
    periodoTipo: 'mensual',
    periodoClave: '2026-10',
    periodoEtiqueta: 'Octubre 2026',
    vence: '2026-11-20',
    venceOrigen: 'calculada',
    estado: 'pendiente',
    creadoEn: '2026-10-01T10:00:00-04:00',
    actualizadoEn: '2026-10-01T10:00:00-04:00',
    ...p,
  };
}

describe('findEstimateTarget', () => {
  it('finds the pending obligation of that tributo and month', () => {
    const t = findEstimateTarget([obl()], '0114022', '2026-10', 10_000);
    expect(t).toMatchObject({
      status: 'ready',
      obligacionId: 'o1',
      periodoEtiqueta: 'Octubre 2026',
      hasOfficial: false,
      upToDate: false,
    });
  });
  it('is missing for another month, another tributo or an empty list', () => {
    expect(findEstimateTarget([obl()], '0114022', '2026-09', 1).status).toBe('missing');
    expect(findEstimateTarget([obl()], '0510122', '2026-10', 1).status).toBe('missing');
    expect(findEstimateTarget([], '0114022', '2026-10', 1).status).toBe('missing');
  });
  it('reports paid and omitted obligations as locked', () => {
    expect(findEstimateTarget([obl({ estado: 'pagada' })], '0114022', '2026-10', 1).status).toBe('paid');
    expect(findEstimateTarget([obl({ estado: 'omitida' })], '0114022', '2026-10', 1).status).toBe('omitted');
  });
  it('knows when the estimate is already stored', () => {
    const t = findEstimateTarget([obl({ importeEstimado: 10_000 })], '0114022', '2026-10', 10_000);
    expect(t.upToDate).toBe(true);
    expect(t.currentEstimate).toBe(10_000);
    expect(findEstimateTarget([obl({ importeEstimado: 10_000 })], '0114022', '2026-10', 9_000).upToDate).toBe(false);
  });
  it('flags an official amount from the vector', () => {
    expect(findEstimateTarget([obl({ importeOficial: 3_000 })], '0114022', '2026-10', 1).hasOfficial).toBe(true);
  });
});
