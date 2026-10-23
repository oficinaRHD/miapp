// Pure hash-route parsing. No Svelte, no DOM: easy to test.

export type RouteName =
  | 'onboarding'
  | 'inicio'
  | 'calendario'
  | 'obligaciones'
  | 'obligacion'
  | 'registro'
  | 'movimiento-nuevo'
  | 'movimiento'
  | 'calculadora'
  | 'estadisticas'
  | 'declaracion'
  | 'documentos'
  | 'empleados'
  | 'guia'
  | 'ajustes'
  | 'respaldo'
  | 'notificaciones'
  | 'perfil'
  | 'no-encontrada';

export interface Route {
  name: RouteName;
  params: Record<string, string>;
  /** Normalized path, e.g. '/obligaciones/abc'. */
  path: string;
}

type Known = Exclude<RouteName, 'no-encontrada'>;

// Order matters: static segments must come before ':param' patterns.
const TABLE: ReadonlyArray<{ name: Known; pattern: string }> = [
  { name: 'onboarding', pattern: '/onboarding' },
  { name: 'inicio', pattern: '/' },
  { name: 'calendario', pattern: '/calendario' },
  { name: 'obligaciones', pattern: '/obligaciones' },
  { name: 'obligacion', pattern: '/obligaciones/:id' },
  { name: 'registro', pattern: '/registro' },
  { name: 'movimiento-nuevo', pattern: '/registro/nuevo' },
  { name: 'movimiento', pattern: '/registro/:id' },
  { name: 'calculadora', pattern: '/calculadora' },
  { name: 'estadisticas', pattern: '/estadisticas' },
  { name: 'declaracion', pattern: '/declaracion' },
  { name: 'documentos', pattern: '/documentos' },
  { name: 'empleados', pattern: '/empleados' },
  { name: 'guia', pattern: '/guia' },
  { name: 'ajustes', pattern: '/ajustes' },
  { name: 'respaldo', pattern: '/ajustes/respaldo' },
  { name: 'notificaciones', pattern: '/ajustes/notificaciones' },
  { name: 'perfil', pattern: '/ajustes/perfil' },
];

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** '#/a/b/?x=1' -> '/a/b'. Empty input -> '/'. */
export function normalizePath(hash: string): string {
  let p = hash.startsWith('#') ? hash.slice(1) : hash;
  const q = p.indexOf('?');
  if (q >= 0) p = p.slice(0, q);
  if (!p.startsWith('/')) p = '/' + p;
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  return p;
}

function matchPattern(pattern: string, path: string): Record<string, string> | null {
  const a = pattern.split('/');
  const b = path.split('/');
  if (a.length !== b.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < a.length; i++) {
    const seg = a[i] as string;
    const val = b[i] as string;
    if (seg.startsWith(':')) {
      if (val === '') return null;
      params[seg.slice(1)] = safeDecode(val);
    } else if (seg !== val) {
      return null;
    }
  }
  return params;
}

export function parseRoute(hash: string): Route {
  const path = normalizePath(hash);
  for (const entry of TABLE) {
    const params = matchPattern(entry.pattern, path);
    if (params) return { name: entry.name, params, path };
  }
  return { name: 'no-encontrada', params: {}, path };
}

/** Builds a path from a route name, e.g. buildPath('obligacion', { id: 'x' }). */
export function buildPath(name: Known, params: Record<string, string> = {}): string {
  const entry = TABLE.find((e) => e.name === name);
  if (!entry) throw new Error(`Unknown route: ${name}`);
  return entry.pattern
    .split('/')
    .map((seg) => {
      if (!seg.startsWith(':')) return seg;
      const v = params[seg.slice(1)];
      if (v === undefined || v === '') throw new Error(`Missing param: ${seg.slice(1)}`);
      return encodeURIComponent(v);
    })
    .join('/');
}
