// Step 5b: passes the saved holidays to the payment sheet, the date patterns and their notes.
// Run once from the repository root:  node scripts/patch-5b.mjs
// Each file is changed only if every required anchor is found; otherwise it is left untouched and reported.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const HOLIDAYS = 'holidaysStore.value';
let failures = 0;

/** Index of the ')' that closes the '(' at `open`, or -1. Skips strings, so quotes inside args are safe. */
function closeIndex(text, open) {
  let depth = 0;
  let quote = null;
  for (let i = open; i < text.length; i++) {
    const c = text[i];
    if (quote) {
      if (c === '\\') i++;
      else if (c === quote) quote = null;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') quote = c;
    else if (c === '(') depth++;
    else if (c === ')') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/** Number of top-level arguments in `args`. */
function argCount(args) {
  if (args.trim() === '') return 0;
  let depth = 0;
  let quote = null;
  let count = 1;
  for (let i = 0; i < args.length; i++) {
    const c = args[i];
    if (quote) {
      if (c === '\\') i++;
      else if (c === quote) quote = null;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') quote = c;
    else if ('([{'.includes(c)) depth++;
    else if (')]}'.includes(c)) depth--;
    else if (c === ',' && depth === 0) count++;
  }
  return count;
}

/** Adds `, holidaysStore.value` to every call of `name` that has exactly `wanted` arguments. */
function addArgToCalls(text, name, wanted) {
  let out = '';
  let pos = 0;
  let changed = 0;
  const re = new RegExp(`(?<![\\w$.])${name}\\(`, 'g');
  let m;
  while ((m = re.exec(text))) {
    const open = m.index + name.length;
    const close = closeIndex(text, open);
    if (close === -1) continue;
    const args = text.slice(open + 1, close);
    if (args.includes('holidaysStore') || argCount(args) !== wanted) continue;
    out += text.slice(pos, close) + `, ${HOLIDAYS}`;
    pos = close;
    changed++;
  }
  return { text: out + text.slice(pos), changed };
}

/** Wraps the line holding `needle` in {#if holidaysStore.value.size === 0}. */
function wrapNote(text, needle) {
  const i = text.indexOf(needle);
  if (i === -1 || text.includes(`size === 0}${needle}`)) return null;
  return text.replace(needle, `{#if holidaysStore.value.size === 0}${needle}{/if}`);
}

function patchFile(path, steps, doneMarker) {
  if (!existsSync(path)) {
    console.log(`MISSING  ${path}`);
    failures++;
    return;
  }
  let text = readFileSync(path, 'utf8');
  if (text.includes(doneMarker)) {
    console.log(`ALREADY  ${path}`);
    return;
  }
  const original = text;
  const problems = [];
  for (const step of steps) {
    const next = step.apply(text);
    if (next === null) {
      if (step.required) problems.push(step.name);
    } else text = next;
  }
  if (problems.length > 0) {
    console.log(`SKIPPED  ${path}  (not found: ${problems.join('; ')})`);
    failures++;
    return;
  }
  if (text === original) console.log(`UNCHANGED ${path}`);
  else {
    writeFileSync(path, text);
    console.log(`PATCHED  ${path}`);
  }
}

const replace = (name, from, to, required = true) => ({
  name,
  required,
  apply: (t) => (t.includes(from) && !t.includes(to) ? t.replace(from, to) : null),
});
const calls = (name, fn, wanted, required = false) => ({
  name: `${fn}(...)`,
  required,
  apply: (t) => {
    const r = addArgToCalls(t, fn, wanted);
    return r.changed > 0 ? r.text : null;
  },
});
const note = (name, needle, required = true) => ({ name, required, apply: (t) => wrapNote(t, needle) });
const addImport = (after, line) =>
  replace(`import after ${after.slice(0, 40)}`, after, `${after}\n${line}`);

// --- Payment sheet (V05)
patchFile('src/views/obligaciones/ObligacionDetalle.svelte', [
  addImport(
    "import { findTributo } from '../../domain/tributos.catalog';",
    "  import { holidaysStore } from '../../stores/holidays.svelte';",
  ),
  calls('quotePayment', 'quotePayment', 3, true),
  calls('suggestedForm', 'suggestedForm', 2, true),
  calls('setCanal', 'setCanal', 3, true),
  calls('setPagadaEn', 'setPagadaEn', 3),
  calls('setDescuento', 'setDescuento', 3),
  note('holidays note', '<p class="hint">{t.notes.holidays}</p>'),
], 'stores/holidays.svelte');

// --- Onboarding (step 5)
patchFile('src/views/onboarding/Onboarding.svelte', [
  addImport(
    "import { buildPlan, groupPlan, patternDates, planSummary, yearOf } from '../../app/yearDates';",
    "  import { holidaysStore } from '../../stores/holidays.svelte';",
  ),
  replace('buildPlan options', 'buildPlan({', `buildPlan({\n      holidays: ${HOLIDAYS},`),
  replace('patternDates options', 'patternDates({', `patternDates({ holidays: ${HOLIDAYS},`),
  note('holidays note', '<p class="hint">{t.holidaysNote}</p>'),
], 'stores/holidays.svelte');

// --- Obligations list (next year)
patchFile('src/views/obligaciones/Obligaciones.svelte', [
  addImport(
    "import { nextYearPlan, nextYearToGenerate } from '../../app/nextYear';",
    "  import { holidaysStore } from '../../stores/holidays.svelte';",
  ),
  calls('nextYearPlan', 'nextYearPlan', 2, true),
  calls('patternByKey', 'patternByKey', 2),
  note('holidays note', '<p class="note">{t.nextYear.holidaysNote}</p>'),
], 'stores/holidays.svelte');

// --- Edit dates of the year
patchFile('src/views/obligaciones/EditarFechas.svelte', [
  addImport("} from '../../app/editDates';", "  import { holidaysStore } from '../../stores/holidays.svelte';"),
  calls('patternByKey', 'patternByKey', 2),
  note('holidays note', '<p class="hint">{t.holidaysNote}</p>'),
], 'stores/holidays.svelte');

// --- Pure logic: patternByKey takes the holidays
patchFile('src/app/editDates.ts', [
  addImport(
    "import { generateObligations, obligationKey } from '../domain/schedule';",
    "import type { Holidays } from '../domain/businessDays';",
  ),
  replace(
    'patternByKey signature',
    'export function patternByKey(codes: readonly string[], year: number): Record<string, ISODate> {',
    'export function patternByKey(\n  codes: readonly string[],\n  year: number,\n  holidays?: Holidays,\n): Record<string, ISODate> {',
  ),
  replace(
    'generateObligations call',
    'generateObligations({ activeTributos: [...new Set(codes)], year })',
    'generateObligations({\n    activeTributos: [...new Set(codes)],\n    year,\n    ...(holidays ? { holidays } : {}),\n  })',
  ),
], 'holidays?: Holidays');

// --- Texts
patchFile('src/i18n/onboarding.ts', [
  replace(
    'holidays note',
    'Las fechas calculadas aún no tienen en cuenta los feriados.',
    'Las fechas calculadas no tienen en cuenta feriados. Después podrás cargarlos en Ajustes, Feriados.',
  ),
], 'Ajustes, Feriados');
patchFile('src/i18n/obligaciones.ts', [
  {
    name: 'holidays notes',
    required: true,
    apply: (t) => {
      const from = 'Las fechas calculadas aún no tienen en cuenta los feriados.';
      return t.includes(from)
        ? t.split(from).join('Las fechas calculadas no tienen en cuenta feriados porque no has cargado ninguno (Ajustes, Feriados).')
        : null;
    },
  },
], 'Ajustes, Feriados');
patchFile('src/i18n/detalle.ts', [
  replace(
    'holidays note',
    'Aún no hay lista de feriados: se cuentan lunes a viernes.',
    'Aún no hay lista de feriados: se cuentan lunes a viernes. Cárgala en Ajustes, Feriados.',
  ),
], 'Ajustes, Feriados');

console.log(failures === 0 ? '\nOK. Now run: npm test && npx svelte-check' : `\n${failures} file(s) not patched: paste this output.`);
process.exit(failures === 0 ? 0 : 1);
