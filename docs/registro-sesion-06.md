# Registro de sesión 06: hito M3, paso 2b (store del perfil y guardián conectado)

Fecha: 23/10/2026

## Qué se creó o cambió

Sin dependencias nuevas, sin lógica fiscal. Se leyeron los archivos reales `perfil.ts`, `index.ts` y `es.ts` antes de escribir.

| Ruta | Contenido |
|---|---|
| `src/stores/perfil.svelte.ts` | `perfilStore` (`perfil`, `loaded`, `error`), `isOnboardingDone()`, `errorMessage()`, `loadPerfil()`, `savePerfil(input)`, `patchPerfil(changes)`. Usa `perfilRepo(db)` directamente |
| `src/app/bootstrap.ts` | `startApp()`: `ensureSeed(db)` y luego `loadPerfil()`; si el seed falla, deja el error en el store |
| `src/i18n/es.ts` | **Reemplazado**: mismas claves de antes más las de la pantalla provisional (`loading`, `loadError`, `routeLabel`, `devCreateProfile`...) |
| `src/App.svelte` | **Reemplazado**: arranca la app, muestra cargando/error, aplica `resolveRedirect` en un `$effect` con `navigate(to, true)` y, en `/onboarding`, un botón provisional "Crear perfil de prueba" |

## Detalles que conviene recordar

- El guardián espera a `perfilStore.loaded` y no actúa si hay error, para no redirigir con datos sin cargar.
- El botón provisional guarda un perfil con `suggestedTributoCodes(false)` y `onboardingCompleto: true`. Desaparece en el paso 3 (V01 real).
- Las claves `milestoneTitle`, `milestoneBody` y `versionLabel` de `es.ts` ya no se usan; se limpian en el paso 3.
- No hay pruebas nuevas: el store usa runas de Svelte y la lógica de decisión ya está probada en `guard.test.ts`. `npm test` sigue en 148.

## Cambios respecto al plan

- El store usa `perfilRepo(db)` en vez de `repos.perfil`, para no depender de cómo `createRepositories` nombra la clave.
  **Actualizar**: nada.

## Qué se verificó y qué no

- Verificado: nada en ejecución (sin Svelte, Vite ni Dexie en la sesión). Los nombres y firmas coinciden con los tres archivos recibidos.
- **No verificado**: tipos y comportamiento. Hay que ejecutar `npx svelte-check` y la prueba en el navegador.

## Pendiente

- Paso 3: V01 real (cinco pasos) y V17, y borrar el botón provisional.
- Tras restaurar un respaldo desde V15 hay que volver a llamar a `loadPerfil()` (el store no se entera solo). Se cablea cuando exista V15 (M6).
- Decidir si al restaurar un respaldo sin datos personales se conservan `rc05` y `nit` locales (pendiente de M2).

## Pasos para aplicar (Termux)

```bash
cd ~/miapp && git pull
unzip -o ~/storage/downloads/m3-paso2b.zip
npm test
npx svelte-check
npm run build
```
`npm test`: `148 passed`. Si `svelte-check` marca un error, pega el mensaje completo.

```bash
git add .
git commit -m "feat: add profile store and connect onboarding guard"
git push
```

## Cómo probar

1. `npm run dev -- --host` y abrir `http://localhost:5173` con datos limpios (si ya probaste M2, borra los datos del sitio en el navegador).
2. Debe pasar a `#/onboarding` solo, mostrando "Perfil: sin crear".
3. Tocar **Crear perfil de prueba**: pasa a `#/` y muestra "Perfil: Perfil de prueba".
4. Recargar la página: sigue en inicio, sin pasar por onboarding.
5. Tocar el enlace `onboarding`: vuelve a `#/` (con onboarding hecho no se puede entrar).
6. Para repetir: borrar datos del sitio `localhost:5173` en el navegador.

## Siguiente paso

Paso 3: V01 Onboarding real, con sus 5 pasos de `03` (bienvenida, perfil, tributos, notificaciones, fechas del año). Se empieza por los pasos 1 a 3 (sin permiso de notificaciones ni fechas).
