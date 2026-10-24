import type { Perfil } from '../data/models';
import { isValidISODate } from '../domain/dates';
import { suggestedTributoCodes } from '../domain/tributos.catalog';
import { NAME_MAX } from './onboarding';

// Pure logic of the profile form (V17). No UI, no DB, no fiscal rules:
// suggested tributos come from the domain catalog.

/** RC-05: 16 digits, stored without hyphens (01, section 6). */
export const RC05_LENGTH = 16;
/** NIT: 11 digits (same number as the identity card in the vector, see 00). */
export const NIT_LENGTH = 11;

export interface PerfilFormDraft {
  nombreVisible: string;
  actividadCodigo: string;
  actividadNombre: string;
  municipio: string;
  municipioCodigo: string;
  rc05: string;
  nit: string;
  fechaInscripcionFiscal: string;
  tieneEmpleados: boolean;
  tributosActivos: string[];
  /** True once the user changed a tributo by hand; stops auto-suggestion. */
  tributosEditados: boolean;
}

export type FormError =
  | 'name-required'
  | 'name-too-long'
  | 'tributos-required'
  | 'rc05-invalid'
  | 'nit-invalid'
  | 'fecha-invalid';

/** Fields handed to the profile store (`undefined` = clear the optional field). */
export interface PerfilChanges {
  nombreVisible: string;
  actividadCodigo: string | undefined;
  actividadNombre: string | undefined;
  municipio: string | undefined;
  municipioCodigo: string | undefined;
  rc05: string | undefined;
  nit: string | undefined;
  fechaInscripcionFiscal: string | undefined;
  tieneEmpleados: boolean;
  tributosActivos: string[];
}

function sameSet(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((x) => set.has(x));
}

/** Removes spaces and hyphens: '1234-5678' -> '12345678'. */
export function stripSeparators(value: string): string {
  return value.replace(/[\s-]/g, '');
}

function opt(value: string): string | undefined {
  const t = value.trim();
  return t === '' ? undefined : t;
}

function optDigits(value: string): string | undefined {
  const t = stripSeparators(value);
  return t === '' ? undefined : t;
}

export function draftFromPerfil(perfil: Perfil): PerfilFormDraft {
  return {
    nombreVisible: perfil.nombreVisible,
    actividadCodigo: perfil.actividadCodigo ?? '',
    actividadNombre: perfil.actividadNombre ?? '',
    municipio: perfil.municipio ?? '',
    municipioCodigo: perfil.municipioCodigo ?? '',
    rc05: perfil.rc05 ?? '',
    nit: perfil.nit ?? '',
    fechaInscripcionFiscal: perfil.fechaInscripcionFiscal ?? '',
    tieneEmpleados: perfil.tieneEmpleados,
    tributosActivos: [...perfil.tributosActivos],
    tributosEditados: !sameSet(perfil.tributosActivos, suggestedTributoCodes(perfil.tieneEmpleados)),
  };
}

export function setEmpleados(draft: PerfilFormDraft, value: boolean): PerfilFormDraft {
  const next: PerfilFormDraft = { ...draft, tieneEmpleados: value };
  if (!draft.tributosEditados) next.tributosActivos = [...suggestedTributoCodes(value)];
  return next;
}

export function toggleTributo(draft: PerfilFormDraft, code: string): PerfilFormDraft {
  const tributosActivos = draft.tributosActivos.includes(code)
    ? draft.tributosActivos.filter((c) => c !== code)
    : [...draft.tributosActivos, code];
  return { ...draft, tributosActivos, tributosEditados: true };
}

export function resetTributos(draft: PerfilFormDraft): PerfilFormDraft {
  return {
    ...draft,
    tributosActivos: [...suggestedTributoCodes(draft.tieneEmpleados)],
    tributosEditados: false,
  };
}

export function validateForm(draft: PerfilFormDraft): FormError[] {
  const errors: FormError[] = [];
  const name = draft.nombreVisible.trim();
  if (name.length === 0) errors.push('name-required');
  else if (name.length > NAME_MAX) errors.push('name-too-long');

  if (draft.tributosActivos.length === 0) errors.push('tributos-required');

  const rc05 = stripSeparators(draft.rc05);
  if (rc05 !== '' && !new RegExp(`^\\d{${RC05_LENGTH}}$`).test(rc05)) errors.push('rc05-invalid');

  const nit = stripSeparators(draft.nit);
  if (nit !== '' && !new RegExp(`^\\d{${NIT_LENGTH}}$`).test(nit)) errors.push('nit-invalid');

  const fecha = draft.fechaInscripcionFiscal.trim();
  if (fecha !== '' && !isValidISODate(fecha)) errors.push('fecha-invalid');

  return errors;
}

export function canSave(draft: PerfilFormDraft): boolean {
  return validateForm(draft).length === 0;
}

/** Trims text, strips hyphens from RC-05 and NIT, and maps empty optionals to `undefined`. */
export function toChanges(draft: PerfilFormDraft): PerfilChanges {
  return {
    nombreVisible: draft.nombreVisible.trim(),
    actividadCodigo: opt(draft.actividadCodigo),
    actividadNombre: opt(draft.actividadNombre),
    municipio: opt(draft.municipio),
    municipioCodigo: opt(draft.municipioCodigo),
    rc05: optDigits(draft.rc05),
    nit: optDigits(draft.nit),
    fechaInscripcionFiscal: opt(draft.fechaInscripcionFiscal),
    tieneEmpleados: draft.tieneEmpleados,
    tributosActivos: [...draft.tributosActivos],
  };
}

/** True when saving the draft would change the stored profile. */
export function hasChanges(perfil: Perfil, draft: PerfilFormDraft): boolean {
  const a = toChanges(draftFromPerfil(perfil));
  const b = toChanges(draft);
  return (
    a.nombreVisible !== b.nombreVisible ||
    a.actividadCodigo !== b.actividadCodigo ||
    a.actividadNombre !== b.actividadNombre ||
    a.municipio !== b.municipio ||
    a.municipioCodigo !== b.municipioCodigo ||
    a.rc05 !== b.rc05 ||
    a.nit !== b.nit ||
    a.fechaInscripcionFiscal !== b.fechaInscripcionFiscal ||
    a.tieneEmpleados !== b.tieneEmpleados ||
    !sameSet(a.tributosActivos, b.tributosActivos)
  );
}

/**
 * True when a business datum reported to the ONAT changed (activity, municipality).
 * 01, section 6: changes must be reported within 30 calendar days.
 * The display name, identifiers, employees and tributos are not included
 * because the document does not list them as reportable changes.
 */
export function businessChanged(perfil: Perfil, draft: PerfilFormDraft): boolean {
  const a = toChanges(draftFromPerfil(perfil));
  const b = toChanges(draft);
  return (
    a.actividadCodigo !== b.actividadCodigo ||
    a.actividadNombre !== b.actividadNombre ||
    a.municipio !== b.municipio ||
    a.municipioCodigo !== b.municipioCodigo
  );
}

/** RC-05 formatted for copying: 'plain' (no hyphens) as stored, or groups of 4 with hyphens. */
export function formatRc05(rc05: string, withHyphens: boolean): string {
  const plain = stripSeparators(rc05);
  if (!withHyphens) return plain;
  return plain.replace(/(\d{4})(?=\d)/g, '$1-');
}
