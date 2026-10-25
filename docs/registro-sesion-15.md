# Registro de sesión 15: M4 paso 3 (V04 Obligaciones)

Fecha: 25/10/2026

## Creado / modificado
Sin dependencias nuevas, sin lógica fiscal. Se leyeron `onboarding.ts`, `Onboarding.svelte`, `router.svelte.ts`, `ajustes.ts` y `models.ts` para el paso siguiente.

| Ruta | Contenido |
|---|---|
| `src/app/obligacionesList.ts` | `FILTERS`, `matchesFilter`, `filterObligations`, `filterCounts`, `groupByDueMonth`, `amountOf` |
| `src/app/obligacionesList.test.ts` | 12 pruebas |
| `src/i18n/obligaciones.ts` | Textos de V04 |
| `src/views/obligaciones/Obligaciones.svelte` | V04: chips de filtro con contador, lista agrupada por mes, tarjetas que enlazan a V05 |
| `src/App.svelte` | **Reemplazado**: ruta `obligaciones` y enlace en la barra provisional |
| `docs/03-vistas-y-flujos.md` | **Reemplazado**: V04 actualizado (V02 y V03 ya incluidos) |

## Decisiones
- Cuatro filtros excluyentes: Pendientes, Vencidas, Pagadas, Omitidas. "Omitidas" se añade a los tres del plan: si no, no habría dónde ver las omitidas.
- Pendientes incluye las vencidas (en rojo); Vencidas es un subconjunto. Por defecto abre en Pendientes.
- Grupos por mes de la fecha límite, del más próximo al más lejano. Sin filtro por tributo (V03 ya lo tiene).
- Usa `statusOf` de `calendario.ts` para el color y la etiqueta de cada tarjeta, y `listObligations()`.
- Importe de la fila: pagado, si no oficial, si no estimado, si no "Importe por definir".

## Pendiente
- **Botón "Editar fechas del año"**: falta `src/app/yearDates.ts`, que `Onboarding.svelte` usa (`buildPlan`, `patternDates`, `groupPlan`, `planSummary`, `yearOf`). Pedir `cat src/app/yearDates.ts src/data/repositories/obligaciones.ts` (este último ya lo vimos; basta `yearDates.ts`).
- Cuando se añada el botón: solo cambia fechas de obligaciones pendientes u omitidas (`setDueDate` con origen `vector`); las pagadas están bloqueadas por el repositorio.
- V05 Detalle y ficha de pago (los enlaces de las tarjetas aún llevan a la pantalla provisional).
- Verificar el nombre de ruta `obligaciones` en `src/app/routes.ts`.
- Feriados reales y generar el año siguiente (heredado de M3). Pendientes fiscales de `01`, sección 7.

## Qué se verificó y qué no
- Verificado: las 12 pruebas pasan en Node 22 con un sustituto mínimo de Vitest y el `dates.ts` real.
- **No verificado**: `Obligaciones.svelte`, `App.svelte`, tipos, y que `routes.ts` use el nombre `obligaciones` para `#/obligaciones`.

## Pasos para aplicar (Termux)

```bash
cd ~/miapp && git pull
unzip -o ~/storage/downloads/m4-paso3.zip
grep -n "obligaciones" src/app/routes.ts
npm test
npx svelte-check
npm run build
```
`npm test`: 12 pruebas nuevas. Total esperado `272 passed` (260 + 12). Si `grep` no muestra una ruta con nombre `obligaciones`, pega su salida y lo ajusto.

```bash
git add .
git commit -m "feat: add obligations list view (V04)"
git push
```

## Cómo probar
1. `npm run dev -- --host` y abre `#/obligaciones` (o toca `obligaciones` abajo).
2. Debe abrir en "Pendientes" con el contador de cada filtro y las obligaciones agrupadas por mes.
3. Cambia a Vencidas, Pagadas y Omitidas: cada una muestra su lista o su mensaje de vacío.
4. Toca una tarjeta: la ruta cambia a `obligacion` con su id.
5. Modo avión: todo sigue funcionando.
