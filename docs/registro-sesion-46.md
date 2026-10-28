# Registro de sesión 46: M6 paso 5b (los feriados se usan en la mora y en las fechas)

Fecha: 27/10/2026

Este zip **incluye todo lo de los pasos 5a** (`m6-paso5a.zip` y `m6-paso5a2.zip`): si no los aplicaste, no hace falta. Sustituye también a `registro-sesion-45.md` (el 46 lo reemplaza).

## Contexto
Los cálculos del dominio ya aceptaban `holidays` (`lateBusinessDays`, `nextBusinessDay`, `nthBusinessDayOfMonth`, `generateObligations`, `quotePayment`...). Faltaba pasarles la lista que el usuario guarda en V14. Sin lista, todo sigue igual que antes (lunes a viernes).

## Creado / modificado
Sin dependencias nuevas, sin reglas fiscales nuevas.

| Ruta | Contenido |
|---|---|
| `src/stores/holidays.svelte.ts` | Estado reactivo `holidaysStore.value` (un `Holidays`) y `refreshHolidays()` (no lanza) |
| `src/app/nextYear.ts` | **Reemplazado**: `nextYearPlan(tributos, año, holidays?)` |
| `src/app/feriadosWiring.test.ts` | 3 pruebas: un feriado mueve la fecha calculada en `nextYearPlan` y en `patternByKey`; sin feriados es igual que con un conjunto vacío |
| `src/App.svelte` | **Reemplazado**: carga los feriados al arrancar |
| `src/views/ajustes/Feriados.svelte` | **Reemplazado**: tras cada cambio actualiza `holidaysStore` |
| `src/views/respaldo/Respaldo.svelte` | **Reemplazado**: tras restaurar o borrar todo recarga los feriados |
| `scripts/patch-5b.mjs` | **Parche automático** (ver pasos) para los archivos que no tenía completos: `ObligacionDetalle.svelte`, `Onboarding.svelte`, `Obligaciones.svelte`, `EditarFechas.svelte`, `src/app/editDates.ts` (`patternByKey` recibe `holidays?`) y los textos de `i18n/onboarding.ts`, `obligaciones.ts` y `detalle.ts` |

## Qué hace el parche
- `ObligacionDetalle.svelte`: pasa `holidaysStore.value` a `quotePayment`, `suggestedForm`, `setCanal`, `setPagadaEn` y `setDescuento`; el aviso "Aún no hay lista de feriados" solo sale con la lista vacía.
- `Onboarding.svelte`: `buildPlan` y `patternDates` reciben los feriados.
- `Obligaciones.svelte` y `EditarFechas.svelte`: `nextYearPlan` y `patternByKey` reciben los feriados; las notas de feriados solo salen con la lista vacía.
- Cada archivo solo se cambia si encuentra todos sus puntos de anclaje; si no, lo deja intacto y lo dice. Se puede ejecutar dos veces (la segunda dice `ALREADY`).

## Decisiones
- Las obligaciones ya guardadas **no** cambian de fecha al cargar feriados (la fecha del vector manda). Solo afecta a las nuevas y a lo que se calcula al editar fechas.
- La mora que se anota al pagar sale del mismo cálculo que se ve en pantalla, así que ya usa los feriados.
- Nota de `01` sección 4: se mantiene el aviso mientras no haya lista.

## Pendiente
- Prueba en teléfono real de M6 (aviso a 3 minutos con la app cerrada, reinicio, permiso denegado), `POST_NOTIFICATIONS`, etiqueta `v0.1.0`.
- `01`, `04`, `05` (ver abajo).

## Qué se verificó y qué no
- Verificado: el parche en copias de prueba (aplica, no duplica y respeta los anclajes) y la sintaxis del script.
- **No verificado**: las 3 pruebas nuevas (necesitan el dominio real), los tipos (`svelte-check`; en especial que `patternDates` acepte `holidays`) y las vistas.

## Actualizar en el proyecto
- `01-reglas-fiscales-tcp.md`: sección 7, punto 3, y sección 4 (ver registro 45: feriados fijos indicados por el usuario, sin contrastar).
- `03-vistas-y-flujos.md`: sustituir por el del zip.
- `05-plan-de-desarrollo.md`: V14 completa en v0.1; M6 solo falta la prueba en teléfono real y la publicación.
- `04-modelo-de-datos.md`: nota en `Feriado`.

## Pasos para aplicar (Termux)
```bash
cd ~/miapp && git pull
unzip -o ~/storage/downloads/m6-paso5b.zip
node scripts/patch-5b.mjs
git diff --stat
npm test
npx svelte-check
npm run build
```
- Si el script dice `SKIPPED` o `MISSING`, pega su salida completa y no sigas.
- Esperado: `474 passed` (471 + 3). Si `svelte-check` marca un error (por ejemplo en `patternDates`), pega el mensaje.
- `git diff --stat` debe listar los archivos del parche; revísalo con `git diff` si quieres.

```bash
git add .
git commit -m "feat: use saved holidays in late days and date patterns (M6 step 5b)"
git push
```

## Cómo probar (APK)
1. Con la lista vacía: en una obligación pendiente, "Pagar" muestra el aviso "se cuentan lunes a viernes".
2. Añade feriados (Ajustes, Feriados, "Añadir los feriados fijos"): el aviso desaparece.
3. Obligación vencida cuyo atraso cruce un feriado (por ejemplo, vencida el 30 abr 2026 y pago el 4 may 2026): el recuento de días hábiles debe bajar en uno al cargar el 1 may 2026 (afecta al tramo solo si cae en el borde de 30 o 60 días hábiles).
4. Onboarding o "Generar año siguiente": las fechas por patrón de 0810132 y 0820232 saltan un feriado si coincide.
5. Exporta, borra e importa un respaldo: los feriados vuelven y se siguen aplicando.
