# Registro de sesión 05: hito M3, paso 2a (guardián de onboarding)

Fecha: 23/10/2026

## Qué se creó

Solo la lógica pura del guardián. El store del perfil queda para el paso 2b, porque necesita ver el código real de `src/data/repositories/perfil.ts`, `src/data/index.ts` y `src/i18n/es.ts` (no se pegaron en el chat).

| Ruta | Contenido |
|---|---|
| `src/app/guard.ts` | `resolveRedirect(route, onboardingDone)`: devuelve la ruta a la que redirigir, o `null` |
| `src/app/guard.test.ts` | 6 pruebas |

## Decisiones

- Sin onboarding completo solo se permiten `/onboarding` y `/ajustes/respaldo` (para restaurar un respaldo en un teléfono nuevo sin rehacer el asistente). Todo lo demás, incluida una ruta desconocida, redirige a `/onboarding`.
- Con onboarding completo, `/onboarding` redirige a `/`.
  **Actualizar**: `03-vistas-y-flujos.md`, V01 (anotar que V15 es accesible antes de terminar el onboarding).

## Verificado y pendiente

- Verificado: 6 pruebas pasan en Node 22 con un sustituto mínimo de Vitest.
- Pendiente (paso 2b): store `src/stores/perfil.svelte.ts`, y conectar el guardián en `App.svelte` con `navigate(path, true)`.
- Pendiente de M2: al restaurar un respaldo sin datos personales se pierden `rc05` y `nit` locales; decidir en M3.

## Pasos para aplicar (Termux)

```bash
cd ~/miapp && git pull
unzip -o ~/storage/downloads/m3-paso2a.zip
npm test
npx svelte-check
```
`npm test` debe dar `Tests 148 passed (148)` (142 + 6).

```bash
git add .
git commit -m "feat: add onboarding guard"
git push
```

## Cómo probar

Solo pruebas automáticas: el guardián aún no está conectado a la interfaz.

## Siguiente paso

Paso 2b: pega la salida de
```bash
cat src/data/repositories/perfil.ts src/data/index.ts src/i18n/es.ts
```
