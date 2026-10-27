# Registro de sesión 35: M6 paso 3c (reprogramar avisos tras cada cambio)

Fecha: 26/10/2026

## Creado / modificado
Sin dependencias nuevas, sin lógica fiscal, sin pruebas nuevas (no hay lógica pura nueva; `npm test` sigue en 411). Se leyó `stores/obligaciones.ts` real.

| Ruta | Contenido |
|---|---|
| `src/stores/obligaciones.ts` | **Reemplazado**: tras `markObligationPaid`, `omitObligation`, `reopenObligation`, `setObligationDate`, `setObligationDueDates` (una vez al final, si cambió alguna) y `addObligationDrafts` (si se añadió alguna) llama a `rescheduleNotices()`. `updateObligation` no lo hace (importe, código de barras y notas no entran en los avisos) |
| `src/stores/avisos.ts` | **Reemplazado**: lee las obligaciones con `obligacionesRepo(db)` en vez de `listObligations`, para evitar un ciclo de importación (`obligaciones.ts` ahora importa `avisos.ts`) |
| `src/views/respaldo/Respaldo.svelte` | **Reemplazado**: tras restaurar y tras borrar todo llama a `rescheduleNotices()` |
| `docs/03-vistas-y-flujos.md` | **Reemplazado**: V02, V04, V05, V15 y V16 al día con los avisos |

## Decisiones
- La reprogramación es "dispara y olvida" (`void`): `rescheduleNotices` nunca lanza, así que un problema de notificaciones no puede romper el guardado de un pago o de una fecha.
- Pagar, omitir o cambiar de pendiente a otro estado **cancela** sus avisos porque el plan solo incluye pendientes; reabrir los vuelve a programar.
- Las llamadas se encolan (sesión 34): varias seguidas no se pisan.
- Todos los cambios de V04 y V05 pasan por `stores/obligaciones.ts`, así que no hubo que tocar las vistas.

## Pendiente
- Paso 3d: preferencias de V16 (días antes y hora, con `saveAvisosSettings`; al guardar, reprogramar) y guía de batería completa.
- Recordatorios mensuales (registrar movimientos, calculadora, respaldo) en el canal `recordatorios`.
- V14 Ajustes (hub). Comprobar `POST_NOTIFICATIONS` en el manifiesto combinado. Feriados reales y pendientes fiscales de `01`, sección 7.

## Qué se verificó y qué no
- **No verificado**: nada en ejecución (npm bloqueado en la sesión). Hay que correr `npx svelte-check`, comprobar que no hay ciclos de importación y probar en el APK.
- Punto a vigilar: que `obligacionesRepo(db).list({ estado: 'pendiente' })` acepte ese filtro (Inicio ya lo usa a través de `listObligations`).

## Actualizar en el proyecto
- `03-vistas-y-flujos.md`: sustituir por el del zip.
- `02-arquitectura-y-stack.md`, sección 5: "Al marcar una obligación como pagada se cancelan sus avisos pendientes" ya está hecho; añadir que `stores/obligaciones.ts` reprograma tras cada cambio.

## Pasos para aplicar (Termux)

```bash
cd ~/miapp && git pull
unzip -o ~/storage/downloads/m6-paso3c.zip
npm test
npx svelte-check
npm run build
```
`npm test`: sin pruebas nuevas, total `411 passed`. Si `svelte-check` marca un error, pega el mensaje completo.

```bash
git add .
git commit -m "feat: reschedule notices after obligation and backup changes (M6 step 3c)"
git push
```
Si usas el Project de claude.ai, sustituye ahí `03-vistas-y-flujos.md` y añade el registro 35.

## Cómo probar (en el APK instalado encima)
1. Abre `#/ajustes/notificaciones` y anota "Avisos programados" (por ejemplo, 8).
2. Marca una obligación pendiente cercana como pagada (V05). Vuelve a V16: el número baja (los avisos de esa obligación se cancelaron).
3. En V05 toca "Volver a pendiente": el número sube otra vez.
4. Cambia la fecha de una obligación desde "Editar datos" (V05) o "Editar fechas del año" (V04) a un día dentro de 60 días: el número cambia sin tocar "Reprogramar".
5. En `#/ajustes/respaldo`, borra todos los datos: V16 debe mostrar 0 avisos en espera.
6. Importa un respaldo con obligaciones pendientes: V16 muestra los avisos de las obligaciones restauradas.
7. Si algo no coincide, toca "Reprogramar avisos ahora" y dime el resultado.
