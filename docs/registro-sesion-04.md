# Registro de sesión 04: hito M3, paso 1 (enrutador)

Fecha: 23/10/2026

## Qué se creó en esta sesión

Solo el enrutador por hash y una pantalla temporal que lo muestra. Sin dependencias nuevas, sin lógica fiscal, sin tocar `src/data/` ni `src/domain/`.

| Ruta | Contenido |
|---|---|
| `src/app/routes.ts` | Funciones puras: `parseRoute(hash)`, `normalizePath`, `buildPath(name, params)`. Tipos `Route` y `RouteName` (18 rutas de `03` más `no-encontrada`) |
| `src/app/router.svelte.ts` | Estado reactivo `router.route` (Svelte 5 `$state`), `initRouter()`, `navigate(path, replace?)`, `navigateTo(name, params, replace?)` |
| `src/app/routes.test.ts` | 16 pruebas del enrutador |
| `src/App.svelte` | **Reemplaza** la pantalla del hito M0. Temporal: muestra ruta, parámetros y enlaces de prueba |
| `src/dev/devPanel.ts` | **Borrado**, junto a sus dos líneas en `src/main.ts` |

## Detalles que conviene recordar

- Coincidencia por segmentos, en el orden de la tabla: `/registro/nuevo` va antes de `/registro/:id`.
- Se ignoran la barra final y la parte `?consulta`. Un parámetro mal codificado no lanza error: se devuelve tal cual.
- Ruta desconocida: `no-encontrada`. Hash vacío: `inicio`.
- `navigate(path, true)` usa `history.replaceState`, para redirigir sin ensuciar el botón atrás (se usará en el guardián de onboarding).
- `router.svelte.ts` necesita ese nombre exacto (`.svelte.ts`) para usar `$state`; se importa como `./app/router.svelte`.

## Cambios respecto al plan

- `src/App.svelte` ya no muestra la tarjeta "Hito M0" ni usa `es`. Los textos de esta pantalla temporal están fijos en el archivo; desaparecen en el paso 3.
  **Actualizar**: nada por ahora.
- El enrutador vive en `src/app/routes.ts` (puro, con pruebas) y `src/app/router.svelte.ts` (reactivo), no en un único `router.ts`.
  **Actualizar**: `02-arquitectura-y-stack.md`, sección 3 (reemplazar `router.ts` por `routes.ts` y `router.svelte.ts`).

## Qué se verificó y qué no

- Verificado: las 16 pruebas de `routes.ts` pasan en Node 22 con un sustituto mínimo de Vitest (npm bloqueado en la sesión).
- **No verificado**: `router.svelte.ts` y `App.svelte` (necesitan Svelte y Vite). Se prueban en Termux.

## Pendiente

- Guardián de onboarding (si `perfil.onboardingCompleto` es falso, redirigir a `/onboarding`): paso 2.
- Textos en `src/i18n/es.ts`: se añaden cuando se vea el archivo actual (pegarlo en el chat).
- Misma lista de pendientes fiscales de `01`, sección 7.

## Pasos para aplicar (Termux)

**1. Descargar `m3-paso1.zip` del chat** y preparar:
```bash
cd ~/miapp
git pull
```

**2. Quitar el panel temporal de M2**
```bash
rm -r src/dev
sed -i '/[dD]evPanel/d' src/main.ts
grep -n "evPanel" -r src || echo "sin restos"
```

**3. Descomprimir sobre el proyecto**
```bash
unzip -o ~/storage/downloads/m3-paso1.zip
ls src/app docs
```

**4. Pruebas, tipos y build**
```bash
npm test
npx svelte-check
npm run build
```
`npm test` debe terminar con `Tests 142 passed (142)` (126 anteriores y 16 nuevas).

**5. Subir a GitHub**
```bash
git add .
git status
git commit -m "feat: add hash router and remove M2 dev panel"
git push
```

## Cómo probar que el paso está hecho

1. `npm run dev -- --host` y abrir `http://localhost:5173`. Debe verse "Ruta: inicio".
2. Tocar cada enlace: la ruta y los parámetros cambian (`obligacion` con `{"id":"abc"}`, `no-encontrada` en 404).
3. Botón atrás del navegador: vuelve a la ruta anterior.
4. Ya no aparece el botón **M2**.
5. Actions en verde; el APK abre y muestra la misma pantalla.

## Siguiente paso

Paso 2 de M3: `src/stores/perfil.svelte.ts` (carga del perfil desde `repos.perfil`) y guardián de onboarding. Para ajustar a tu código real, pega en el chat `src/data/repositories/perfil.ts`, `src/data/index.ts` y `src/i18n/es.ts`.
