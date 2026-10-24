import { describe, expect, it } from 'vitest';
import type { Perfil } from '../data/models';
import { suggestedTributoCodes } from '../domain/tributos.catalog';
import {
  businessChanged,
  canSave,
  draftFromPerfil,
  formatRc05,
  hasChanges,
  resetTributos,
  setEmpleados,
  stripSeparators,
  toChanges,
  toggleTributo,
  validateForm,
  type PerfilFormDraft,
} from './perfilForm';

function perfil(over: Partial<Perfil> = {}): Perfil {
  return {
    id: 'perfil',
    nombreVisible: 'Rolando',
    tieneEmpleados: false,
    tributosActivos: [...suggestedTributoCodes(false)],
    onboardingCompleto: true,
    reglasVersion: '2026.1',
    creadoEn: '2026-10-23T20:00:00-04:00',
    actualizadoEn: '2026-10-23T20:00:00-04:00',
    ...over,
  };
}

function draft(over: Partial<PerfilFormDraft> = {}): PerfilFormDraft {
  return { ...draftFromPerfil(perfil()), ...over };
}

describe('stripSeparators / formatRc05', () => {
  it('removes spaces and hyphens', () => {
    expect(stripSeparators(' 1234-5678 9 ')).toBe('123456789');
  });
  it('formats without and with hyphens', () => {
    const rc = '1234567890123456';
    expect(formatRc05(rc, false)).toBe(rc);
    expect(formatRc05(rc, true)).toBe('1234-5678-9012-3456');
    expect(formatRc05('1234-5678-9012-3456', false)).toBe(rc);
  });
});

describe('draftFromPerfil', () => {
  it('maps missing optionals to empty strings', () => {
    const d = draftFromPerfil(perfil());
    expect(d.rc05).toBe('');
    expect(d.nit).toBe('');
    expect(d.municipio).toBe('');
    expect(d.tributosEditados).toBe(false);
  });
  it('flags a hand-edited tributo list', () => {
    const d = draftFromPerfil(perfil({ tributosActivos: ['0114022'] }));
    expect(d.tributosEditados).toBe(true);
  });
});

describe('validateForm', () => {
  it('accepts a valid draft', () => {
    expect(validateForm(draft())).toEqual([]);
    expect(canSave(draft())).toBe(true);
  });
  it('requires a name', () => {
    expect(validateForm(draft({ nombreVisible: '   ' }))).toContain('name-required');
  });
  it('rejects a name that is too long', () => {
    expect(validateForm(draft({ nombreVisible: 'a'.repeat(61) }))).toContain('name-too-long');
  });
  it('requires at least one tributo', () => {
    expect(validateForm(draft({ tributosActivos: [] }))).toContain('tributos-required');
  });
  it('accepts RC-05 with hyphens and rejects wrong length', () => {
    expect(validateForm(draft({ rc05: '1234-5678-9012-3456' }))).toEqual([]);
    expect(validateForm(draft({ rc05: '12345' }))).toContain('rc05-invalid');
    expect(validateForm(draft({ rc05: '123456789012345a' }))).toContain('rc05-invalid');
  });
  it('validates NIT as 11 digits', () => {
    expect(validateForm(draft({ nit: '12345678901' }))).toEqual([]);
    expect(validateForm(draft({ nit: '1234' }))).toContain('nit-invalid');
  });
  it('validates the registration date', () => {
    expect(validateForm(draft({ fechaInscripcionFiscal: '2020-02-30' }))).toContain('fecha-invalid');
    expect(validateForm(draft({ fechaInscripcionFiscal: '2020-02-28' }))).toEqual([]);
    expect(validateForm(draft({ fechaInscripcionFiscal: '' }))).toEqual([]);
  });
});

describe('tributos editing', () => {
  it('follows the suggestion until edited by hand', () => {
    const on = setEmpleados(draft(), true);
    expect([...on.tributosActivos].sort()).toEqual([...suggestedTributoCodes(true)].sort());
    const edited = toggleTributo(draft(), '0730122');
    expect(edited.tributosEditados).toBe(true);
    const still = setEmpleados(edited, true);
    expect(still.tributosActivos).toEqual(edited.tributosActivos);
  });
  it('resets to the suggestion', () => {
    const d = resetTributos(toggleTributo(draft({ tieneEmpleados: true }), '0114022'));
    expect(d.tributosEditados).toBe(false);
    expect([...d.tributosActivos].sort()).toEqual([...suggestedTributoCodes(true)].sort());
  });
});

describe('toChanges', () => {
  it('trims, strips hyphens and maps empty optionals to undefined', () => {
    const c = toChanges(
      draft({ nombreVisible: '  Ana ', rc05: '1234-5678-9012-3456', nit: '', municipio: ' ' }),
    );
    expect(c.nombreVisible).toBe('Ana');
    expect(c.rc05).toBe('1234567890123456');
    expect(c.nit).toBeUndefined();
    expect(c.municipio).toBeUndefined();
  });
});

describe('hasChanges / businessChanged', () => {
  it('detects no change on an untouched draft', () => {
    const p = perfil();
    expect(hasChanges(p, draftFromPerfil(p))).toBe(false);
    expect(businessChanged(p, draftFromPerfil(p))).toBe(false);
  });
  it('ignores whitespace-only edits', () => {
    const p = perfil({ nombreVisible: 'Rolando' });
    expect(hasChanges(p, draft({ nombreVisible: ' Rolando ' }))).toBe(false);
  });
  it('flags a name change as a change but not as a business change', () => {
    const p = perfil();
    const d = draft({ nombreVisible: 'Otro' });
    expect(hasChanges(p, d)).toBe(true);
    expect(businessChanged(p, d)).toBe(false);
  });
  it('flags activity or municipality as a business change', () => {
    const p = perfil();
    expect(businessChanged(p, draft({ actividadCodigo: '6201' }))).toBe(true);
    expect(businessChanged(p, draft({ municipio: 'Centro' }))).toBe(true);
  });
  it('does not flag RC-05 or employees as a business change', () => {
    const p = perfil();
    expect(businessChanged(p, draft({ rc05: '1234567890123456' }))).toBe(false);
    expect(hasChanges(p, draft({ rc05: '1234567890123456' }))).toBe(true);
  });
  it('treats tributos as a set, not a sequence', () => {
    const p = perfil({ tributosActivos: ['0114022', '0510122'] });
    expect(hasChanges(p, draft({ tributosActivos: ['0510122', '0114022'] }))).toBe(false);
  });
});
