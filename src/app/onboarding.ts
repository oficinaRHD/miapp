import type { Perfil } from '../data/models';
import { TRIBUTOS, suggestedTributoCodes, type Tributo } from '../domain/tributos.catalog';
import type { ISODate } from '../domain/types';
import type { NotificationPermissionState } from './notificationPermission';
import type { YearDatesMode } from './yearDates';

// Pure onboarding wizard logic (V01, steps 1-5). No UI, no DB, no fiscal rules:
// suggested tributos come from the domain catalog.

export const ONBOARDING_STEPS = ['bienvenida', 'perfil', 'tributos', 'notificaciones', 'fechas'] as const;
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

/** Steps of the full wizard (03, V01). */
export const ONBOARDING_TOTAL_STEPS = ONBOARDING_STEPS.length;
export const NAME_MAX = 60;

export interface OnboardingDraft {
  nombreVisible: string;
  actividadCodigo: string;
  actividadNombre: string;
  tieneEmpleados: boolean;
  tributosActivos: string[];
  /** True once the user changed a tributo by hand; stops auto-suggestion. */
  tributosEditados: boolean;
  /** Result of the last permission check or request (stored in settings, not in the profile). */
  notificationPermission: NotificationPermissionState;
  /** Step 5: calculated pattern or dates copied from the vector. */
  fechasModo: YearDatesMode;
  /** Vector dates by `obligationKey`; only used when `fechasModo` is 'vector'. */
  fechasVector: Record<string, ISODate>;
}

export type StepError = 'name-required' | 'name-too-long' | 'tributos-required';

/** Shape handed to the profile store (a subset of PerfilInput). */
export interface OnboardingProfileInput {
  nombreVisible: string;
  actividadCodigo?: string;
  actividadNombre?: string;
  tieneEmpleados: boolean;
  tributosActivos: string[];
  onboardingCompleto: boolean;
}

function sameSet(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((x) => set.has(x));
}

export function emptyDraft(): OnboardingDraft {
  return {
    nombreVisible: '',
    actividadCodigo: '',
    actividadNombre: '',
    tieneEmpleados: false,
    tributosActivos: [...suggestedTributoCodes(false)],
    tributosEditados: false,
    notificationPermission: 'unknown',
    fechasModo: 'patron',
    fechasVector: {},
  };
}

/** Rebuilds the draft from a saved profile (onboarding left unfinished). */
export function draftFromPerfil(perfil: Perfil): OnboardingDraft {
  const suggested = suggestedTributoCodes(perfil.tieneEmpleados);
  return {
    nombreVisible: perfil.nombreVisible,
    actividadCodigo: perfil.actividadCodigo ?? '',
    actividadNombre: perfil.actividadNombre ?? '',
    tieneEmpleados: perfil.tieneEmpleados,
    tributosActivos: [...perfil.tributosActivos],
    tributosEditados: !sameSet(perfil.tributosActivos, suggested),
    notificationPermission: 'unknown',
    fechasModo: 'patron',
    fechasVector: {},
  };
}

/** Tributos listed in step 3: the ones the vector can contain (not the late surcharge). */
export function onboardingTributos(): readonly Tributo[] {
  return TRIBUTOS.filter((t) => t.inVector);
}

export function setTieneEmpleados(draft: OnboardingDraft, value: boolean): OnboardingDraft {
  const next: OnboardingDraft = { ...draft, tieneEmpleados: value };
  if (!draft.tributosEditados) {
    next.tributosActivos = [...suggestedTributoCodes(value)];
  }
  return next;
}

export function toggleTributo(draft: OnboardingDraft, code: string): OnboardingDraft {
  const tributosActivos = draft.tributosActivos.includes(code)
    ? draft.tributosActivos.filter((c) => c !== code)
    : [...draft.tributosActivos, code];
  return { ...draft, tributosActivos, tributosEditados: true };
}

export function resetTributos(draft: OnboardingDraft): OnboardingDraft {
  return {
    ...draft,
    tributosActivos: [...suggestedTributoCodes(draft.tieneEmpleados)],
    tributosEditados: false,
  };
}

export function setNotificationPermission(
  draft: OnboardingDraft,
  state: NotificationPermissionState,
): OnboardingDraft {
  return { ...draft, notificationPermission: state };
}

export function setYearMode(draft: OnboardingDraft, mode: YearDatesMode): OnboardingDraft {
  return { ...draft, fechasModo: mode };
}

/** Sets or clears (empty value) the vector date of one obligation key. */
export function setVectorDate(draft: OnboardingDraft, key: string, value: string): OnboardingDraft {
  const fechasVector = { ...draft.fechasVector };
  if (value === '') delete fechasVector[key];
  else fechasVector[key] = value;
  return { ...draft, fechasVector };
}

export function validateStep(step: OnboardingStep, draft: OnboardingDraft): StepError[] {
  const errors: StepError[] = [];
  if (step === 'perfil') {
    const name = draft.nombreVisible.trim();
    if (name.length === 0) errors.push('name-required');
    else if (name.length > NAME_MAX) errors.push('name-too-long');
  }
  if (step === 'tributos' && draft.tributosActivos.length === 0) {
    errors.push('tributos-required');
  }
  // 'notificaciones' never blocks: a denied or undecided permission lets the user continue.
  // 'fechas' never blocks: an empty vector field falls back to the calculated pattern.
  return errors;
}

export function canAdvance(step: OnboardingStep, draft: OnboardingDraft): boolean {
  return validateStep(step, draft).length === 0;
}

export function stepNumber(step: OnboardingStep): number {
  return ONBOARDING_STEPS.indexOf(step) + 1;
}

export function nextStep(step: OnboardingStep): OnboardingStep | null {
  return ONBOARDING_STEPS[ONBOARDING_STEPS.indexOf(step) + 1] ?? null;
}

export function prevStep(step: OnboardingStep): OnboardingStep | null {
  const i = ONBOARDING_STEPS.indexOf(step);
  return i > 0 ? (ONBOARDING_STEPS[i - 1] ?? null) : null;
}

/** Trims text, omits empty optional fields and copies the tributos list. */
export function toPerfilInput(
  draft: OnboardingDraft,
  onboardingCompleto: boolean,
): OnboardingProfileInput {
  const out: OnboardingProfileInput = {
    nombreVisible: draft.nombreVisible.trim(),
    tieneEmpleados: draft.tieneEmpleados,
    tributosActivos: [...draft.tributosActivos],
    onboardingCompleto,
  };
  const code = draft.actividadCodigo.trim();
  const name = draft.actividadNombre.trim();
  if (code) out.actividadCodigo = code;
  if (name) out.actividadNombre = name;
  return out;
}
