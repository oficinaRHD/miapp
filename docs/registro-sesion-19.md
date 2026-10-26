# Registro de sesión 19: M4 paso 6 (cierre de M4)

Fecha: 25/10/2026

## Creado / modificado
Sin dependencias nuevas en el código del proyecto, pero **`share.ts` importa `@capacitor/share`**: está en el plan de M0 y se usó para el respaldo (M2). Comprobar con `npm ls @capacitor/share` (abajo).

| Ruta | Contenido |
|---|---|
| `src/app/nextYear.ts` + `.test.ts` | `nextYearToGenerate`, `nextYearPlan`; 7 pruebas |
| `src/app/detalleEdit.ts` + `.test.ts` | `checkDueDate`, `checkBarcode`, `checkOfficialAmount`; 8 pruebas |
| `src/app/ficha.ts` + `.test.ts` | `buildSheetText`; 3 pruebas |
| `src/services/share.ts` | `shareText(title, text)`: menú de compartir, o copia si no se puede |
| `src/stores/obligaciones.ts` | **Reemplazado**: añade `setObligationDate`, `updateObligation` |
| `src/i18n/detalle.ts` | **Reemplazado**: bloques `share` y `edit` |
| `src/i18n/obligaciones.ts` | **Reemplazado**: bloque `nextYear` |
| `src/views/obligaciones/ObligacionDetalle.svelte` | **Reemplazado**: botón "Compartir ficha" con casilla del RC-05, sección plegable "Editar datos" |
| `src/views/obligaciones/Obligaciones.svelte` | **Reemplazado**: botón y panel "Generar obligaciones de AAAA" |
| `docs/03-vistas-y-flujos.md` | **Reemplazado**: V04 y V05 al día |

## Decisiones
- **Compartir**: el RC-05 es un dato personal; solo se incluye si el usuario marca la casilla (desmarcada por defecto).
- **Editar fecha desde V05**: se elige el origen: "La copié de mi vector" (`vector`) o "Es una fecha mía" (`manual`). Se puede guardar la misma fecha si solo cambia el origen.
- **Código de barras e importe oficial**: se pueden cambiar pero no vaciar (`ObligacionChanges` no admite borrar un campo con `exactOptionalPropertyTypes`).
- **Año siguiente**: se ofrece mientras no haya obligaciones del año fiscal siguiente al de hoy. Crea los 12 meses, los 4 trimestres y la anual, con fechas por patrón. No hay recorte "desde este mes", porque es un año nuevo. Las fechas son una propuesta: el vector manda.

## Lo que NO se cierra en M4, y por qué
- **Avisos al pagar, omitir, reabrir o cambiar fechas**: no hay todavía servicio que programe notificaciones (hoy solo existe el permiso). Es M6. Los puntos donde engancharlo son las funciones de `stores/obligaciones.ts`.
- **Feriados reales**: `01`, sección 7, punto 3, dice que falta el calendario de feriados de Cuba. No inventé fechas. Queda para V14 (M6): un editor de feriados que alimente `businessDays`. Mientras tanto, las pantallas avisan que cuentan lunes a viernes.
- **Comprobante adjunto**: v0.2.

## Qué se verificó y qué no
- Verificado: las 18 pruebas nuevas pasan en Node 22 con un sustituto mínimo de Vitest y tus archivos reales (`schedule.ts`, `tributos.catalog.ts`, `yearDates.ts`, `businessDays.ts`, `money.ts`, `mora.ts`, `descuento.ts`).
- **No verificado**: `Obligaciones.svelte`, `ObligacionDetalle.svelte`, `share.ts` (depende de `@capacitor/share` y del APK), tipos, y `repo.update`/`setDueDate` en uso real.

## Pasos para aplicar (Termux)

```bash
cd ~/miapp && git pull
npm ls @capacitor/share
unzip -o ~/storage/downloads/m4-paso6.zip
npm test
npx svelte-check
npm run build
```
Si `npm ls @capacitor/share` dice `(empty)`, avísame: habría que instalarlo (`npm i @capacitor/share`) y hacer commit de `package.json` y `package-lock.json` juntos.
`npm test`: 18 pruebas nuevas. Total esperado `322 passed` (304 + 18). Si `svelte-check` marca un error, pega el mensaje completo.

```bash
git add .
git commit -m "feat: share payment sheet, edit details, generate next year (M4 close)"
git push
```

## Cómo probar
1. **Año siguiente**: en `#/obligaciones` debe aparecer "Generar obligaciones de 2027". Tócalo: dice cuántas se crearán y el rango (por ejemplo del 22 feb 2027 al 30 abr 2028). Confirma: aviso "Se crearon N obligaciones de 2027." y el botón desaparece. En "Editar fechas del año" ya hay selector 2026 y 2027.
2. **Compartir**: abre una obligación pendiente y toca "Compartir ficha": sale el menú de Android con el texto. Marca "Incluir mi RC-05" y repite: ahora trae el RC-05. En el navegador de escritorio puede copiarse en vez de abrir el menú.
3. **Editar datos**: abre "Editar datos". Cambia la fecha y guarda: "Fecha guardada." y la fecha de arriba cambia. Escribe un código de barras y un importe oficial (por ejemplo `30`) y guarda cada uno; el importe sale en Datos y en la estimación.
4. **Errores**: guarda la misma fecha sin cambiar el origen, o un importe vacío o con letras: sale el mensaje en rojo.
5. Modo avión: todo sigue funcionando.
