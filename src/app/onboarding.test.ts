import { describe, expect, it } from 'vitest';
import type { Perfil } from '../data/models';
import {
  canAdvance,
  draftFromPerfil,
  emptyDraft,
  nextStep,
  onboardingTributos,
  prevStep,
  resetTributos,
  setNotificationPermission,
  setTieneEmpleados,
  stepNumber,
  toggleTributo,
  toPerfilInput,
  validateStep,
} from './onboarding';

const BASE = ['0114022', '0510122', '0530222'];
const WITH_EMPLOYEES = ['0114022', '0510122', '0520522', '0530222', '0610322', '0810132', '0820232'];

const named = (name: string) => ({ ...emptyDraft(), nombreVisible: name });

const perfilBase: Perfil = {
  id: 'perfil',
  nombreVisible: 'Rolando',
  tieneEmpleados: false,
  tributosActivos: [...BASE],
  onboardingCompleto: false,
  reglasVersion: '2026.1',
  creadoEn: '2026-10-23T09:00:00-04:00',
  actualizadoEn: '2026-10-23T09:00:00-04:00',
};

describe('emptyDraft', () => {
  it('starts without employees and with the base tributos', () => {
    const d = emptyDraft();
    expect(d.tieneEmpleados).toBe(false);
    expect(d.tributosActivos).toEqual(BASE);
  });

  it('starts with empty texts and no manual edits', () => {
    const d = emptyDraft();
    expect(d.nombreVisible).toBe('');
    expect(d.actividadCodigo).toBe('');
    expect(d.actividadNombre).toBe('');
    expect(d.tributosEditados).toBe(false);
  });

  it('starts with an unknown notification permission', () => {
    expect(emptyDraft().notificationPermission).toBe('unknown');
  });
});

describe('setTieneEmpleados', () => {
  it('suggests the employee tributos when turned on', () => {
    expect(setTieneEmpleados(emptyDraft(), true).tributosActivos).toEqual(WITH_EMPLOYEES);
  });

  it('goes back to the base suggestion when turned off', () => {
    const on = setTieneEmpleados(emptyDraft(), true);
    expect(setTieneEmpleados(on, false).tributosActivos).toEqual(BASE);
  });

  it('keeps a manual selection once the user edited it', () => {
    const edited = toggleTributo(emptyDraft(), '0730122');
    const next = setTieneEmpleados(edited, true);
    expect(next.tieneEmpleados).toBe(true);
    expect(next.tributosActivos).toHaveLength(4);
    expect(next.tributosActivos).toContain('0730122');
    expect(next.tributosActivos).not.toContain('0520522');
  });

  it('does not mutate the original draft', () => {
    const d = emptyDraft();
    setTieneEmpleados(d, true);
    expect(d.tieneEmpleados).toBe(false);
    expect(d.tributosActivos).toHaveLength(3);
  });
});

describe('toggleTributo', () => {
  it('adds a code and marks the list as edited', () => {
    const d = toggleTributo(emptyDraft(), '0730122');
    expect(d.tributosActivos).toContain('0730122');
    expect(d.tributosEditados).toBe(true);
  });

  it('removes an active code', () => {
    const d = toggleTributo(emptyDraft(), '0114022');
    expect(d.tributosActivos).not.toContain('0114022');
    expect(d.tributosActivos).toHaveLength(2);
  });
});

describe('resetTributos', () => {
  it('returns to the suggestion and clears the edited flag', () => {
    const edited = toggleTributo(setTieneEmpleados(emptyDraft(), true), '0114022');
    const reset = resetTributos(edited);
    expect(reset.tributosEditados).toBe(false);
    expect(reset.tributosActivos).toEqual(WITH_EMPLOYEES);
  });
});

describe('validateStep', () => {
  it('has no errors in the welcome step', () => {
    expect(validateStep('bienvenida', emptyDraft())).toEqual([]);
  });

  it('requires a name', () => {
    expect(validateStep('perfil', named(''))).toEqual(['name-required']);
  });

  it('treats a whitespace-only name as empty', () => {
    expect(validateStep('perfil', named('   '))).toEqual(['name-required']);
  });

  it('rejects names over 60 characters', () => {
    expect(validateStep('perfil', named('a'.repeat(61)))).toEqual(['name-too-long']);
  });

  it('accepts a name of exactly 60 characters', () => {
    expect(validateStep('perfil', named('a'.repeat(60)))).toEqual([]);
  });

  it('requires at least one tributo', () => {
    const d = { ...named('Rolando'), tributosActivos: [] };
    expect(validateStep('tributos', d)).toEqual(['tributos-required']);
  });

  it('accepts the suggested tributos', () => {
    expect(validateStep('tributos', named('Rolando'))).toEqual([]);
  });

  it('never blocks the notifications step, whatever the permission', () => {
    for (const state of ['granted', 'denied', 'unknown'] as const) {
      const d = setNotificationPermission(named('Rolando'), state);
      expect(validateStep('notificaciones', d)).toEqual([]);
      expect(canAdvance('notificaciones', d)).toBe(true);
    }
  });
});

describe('canAdvance', () => {
  it('follows the validation of the current step', () => {
    expect(canAdvance('perfil', named(''))).toBe(false);
    expect(canAdvance('perfil', named('Rolando'))).toBe(true);
  });
});

describe('step navigation', () => {
  it('moves forward in order and ends with null', () => {
    expect(nextStep('bienvenida')).toBe('perfil');
    expect(nextStep('perfil')).toBe('tributos');
    expect(nextStep('tributos')).toBe('notificaciones');
    expect(nextStep('notificaciones')).toBeNull();
  });

  it('moves back and stops at the first step', () => {
    expect(prevStep('notificaciones')).toBe('tributos');
    expect(prevStep('tributos')).toBe('perfil');
    expect(prevStep('perfil')).toBe('bienvenida');
    expect(prevStep('bienvenida')).toBeNull();
  });

  it('numbers the steps from 1', () => {
    expect(stepNumber('bienvenida')).toBe(1);
    expect(stepNumber('perfil')).toBe(2);
    expect(stepNumber('tributos')).toBe(3);
    expect(stepNumber('notificaciones')).toBe(4);
  });
});

describe('setNotificationPermission', () => {
  it('stores the state in the draft without touching the rest', () => {
    const d = named('Rolando');
    const next = setNotificationPermission(d, 'denied');
    expect(next.notificationPermission).toBe('denied');
    expect(next.nombreVisible).toBe('Rolando');
    expect(d.notificationPermission).toBe('unknown');
  });
});

describe('toPerfilInput', () => {
  it('trims the name and omits empty activity fields', () => {
    expect(toPerfilInput(named('  Rolando  '), false)).toEqual({
      nombreVisible: 'Rolando',
      tieneEmpleados: false,
      tributosActivos: BASE,
      onboardingCompleto: false,
    });
  });

  it('includes trimmed activity fields and the completion flag', () => {
    const d = { ...named('Rolando'), actividadCodigo: ' 6201 ', actividadNombre: ' Actividad de prueba ' };
    const out = toPerfilInput(d, true);
    expect(out.actividadCodigo).toBe('6201');
    expect(out.actividadNombre).toBe('Actividad de prueba');
    expect(out.onboardingCompleto).toBe(true);
  });

  it('copies the tributos list instead of sharing it', () => {
    const d = emptyDraft();
    const out = toPerfilInput(d, false);
    expect(out.tributosActivos === d.tributosActivos).toBe(false);
  });
});

describe('draftFromPerfil', () => {
  it('restores the saved values', () => {
    const d = draftFromPerfil({
      ...perfilBase,
      actividadCodigo: '6201',
      actividadNombre: 'Actividad de prueba',
      tieneEmpleados: true,
      tributosActivos: [...WITH_EMPLOYEES],
    });
    expect(d.nombreVisible).toBe('Rolando');
    expect(d.actividadCodigo).toBe('6201');
    expect(d.actividadNombre).toBe('Actividad de prueba');
    expect(d.tieneEmpleados).toBe(true);
    expect(d.tributosActivos).toEqual(WITH_EMPLOYEES);
  });

  it('starts with an unknown notification permission', () => {
    expect(draftFromPerfil(perfilBase).notificationPermission).toBe('unknown');
  });

  it('is not edited when the tributos match the suggestion, in any order', () => {
    const d = draftFromPerfil({ ...perfilBase, tributosActivos: [...BASE].reverse() });
    expect(d.tributosEditados).toBe(false);
  });

  it('is edited when the tributos differ from the suggestion', () => {
    const d = draftFromPerfil({ ...perfilBase, tributosActivos: ['0114022', '0730122'] });
    expect(d.tributosEditados).toBe(true);
  });
});

describe('onboardingTributos', () => {
  it('lists the 8 vector tributos and not the late surcharge', () => {
    const codes = onboardingTributos().map((t) => t.code);
    expect(codes).toHaveLength(8);
    expect(codes).toContain('0730122');
    expect(codes).not.toContain('1060122');
  });
});
