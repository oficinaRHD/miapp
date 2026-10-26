# Registro de sesión 27: actualización de documentos (03, 04 y 05)

Fecha: 26/10/2026

Solo documentación. Sin código, sin pruebas nuevas, sin cambios en `npm test`.

## Qué se actualizó

| Archivo | Cambios |
|---|---|
| `docs/03-vistas-y-flujos.md` | V01: V15 accesible antes de terminar el onboarding (sesión 5). V02: resumen del mes y botones, hechos en M5. V06, V07 y V08: reglas reales implementadas (sesiones 20 a 25). F4: el importe estimado va a las obligaciones del mes de los ingresos, que vencen el mes siguiente |
| `docs/04-modelo-de-datos.md` | Sección 2: origen de los tipos primitivos (sesiones 2 y 3); comentarios de `importePagado` y `recargoMora` (sesión 17); comentario de `cuentaParaVentas`: 0510122 usa todos los ingresos (sesión 24). Sección 5: idempotencia por `addDrafts` (sesión 3). Sección 6: base de cada impuesto. Sección 7: `perfil` puede ser `null` y los adjuntos viajan como metadatos (sesión 3) |
| `docs/05-plan-de-desarrollo.md` | M1: `descuento.ts` (sesión 2). M2: `fake-indexeddb` (sesión 3). M4 y M5: estado de implementación |

## Decisiones
- M5 queda como **implementado, falta probar el criterio** en el teléfono: 3 ingresos y 2 gastos cambian Inicio y la calculadora coincide con un cálculo manual. Cuando lo pruebes, cambia ese texto por "hecho".
- M4 se marca como implementado (25/10/2026): las sesiones 12 a 19 no registran una prueba final.

## Pendiente: `02-arquitectura-y-stack.md`
Sigue sin actualizarse (no lo pegaste). Lo que falta según los registros 3, 4 y 25:
- Sección 3 (estructura de `src/data/`): quitar `migrations.ts`; añadir `models.ts`, `schema.ts`, `backupSchema.ts`, `util.ts`, `errors.ts`, `version.ts`.
- Sección 3: `router.ts` pasa a `routes.ts` y `router.svelte.ts`.
- Sección 1 (fila Pruebas): añadir `fake-indexeddb`.
Si quieres que lo actualice, pega `cat docs/02-arquitectura-y-stack.md`.

## Pasos para aplicar (Termux)

```bash
cd ~/miapp && git pull
unzip -o ~/storage/downloads/docs-m5.zip
git diff --stat docs
git add docs
git commit -m "docs: update views, data model and plan after M5"
git push
```
`git diff --stat docs` debe mostrar 03, 04 y 05 con cambios. Si usas el Project de claude.ai, sustituye ahí también esos tres archivos.

## Cómo probar
No hay nada que probar en la app. Abre `docs/03-vistas-y-flujos.md` y comprueba que V06, V07 y V08 tienen una sección "Reglas".
