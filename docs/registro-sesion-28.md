# Registro de sesión 28: actualización de `02-arquitectura-y-stack.md`

Fecha: 26/10/2026

Solo documentación. Sin código ni pruebas; `npm test` no cambia.

## Qué se actualizó en `docs/02-arquitectura-y-stack.md`

| Sección | Cambio |
|---|---|
| 1 (Pruebas) | Añade `fake-indexeddb` (solo desarrollo, no entra en el APK) |
| 2 (Capas) | Datos sin `migrations.ts` (van en `db.ts` y `backupSchema.ts`); servicios incluyen compartir; nueva capa `src/app/` con la lógica pura de las vistas; los repositorios son funciones que reciben la base |
| 3 (Estructura) | `router.ts` pasa a `routes.ts` y `router.svelte.ts`; se listan los archivos reales de `src/app/`, `src/data/`, `src/services/` y `src/stores/`; `rules/descuento.ts`; `domain/types.ts`; `i18n/` con un archivo por vista |
| 4 (Plugins) | Portapapeles: hoy `navigator.clipboard` con respaldo (sesión 17) |
| 8 (Respaldo) | Copia interna previa `auto-previo-<fecha>.json`, 5 copias, cancela si falla |
| 9 (Pruebas) | Script `vitest run --passWithNoTests`; `fake-indexeddb` |
| 10 | Textos en `src/i18n/`, no solo `es.ts` |

## Decisiones y dudas
- La lista de `src/app/` sale de los registros de sesión y de lo que pegaste; **no vi el árbol real**. Compáralo con `ls src/app src/stores src/services src/components`. Si algún archivo no existe o falta uno, dímelo.
- `nav.ts` y `services/notifications.ts`, `appLifecycle.ts` siguen como pendientes (M6). `theme.css` y `components/` no los pude confirmar: dejé `theme.css` como estaba y anoté que cada vista lleva hoy sus propios componentes.
- Con esto quedan al día los cuatro documentos citados en los registros 3, 4, 5, 17, 24 y 26 (02, 03, 04 y 05).

## Pasos para aplicar (Termux)

```bash
cd ~/miapp && git pull
unzip -o ~/storage/downloads/docs-02.zip
ls src/app src/stores src/services src/components
git diff --stat docs
git add docs
git commit -m "docs: update architecture structure after M5"
git push
```
Si usas el Project de claude.ai, sustituye ahí también `02-arquitectura-y-stack.md` y añade el registro 28.

## Cómo probar
Nada que probar en la app. Compara el árbol de la sección 3 con la salida de `ls`.
