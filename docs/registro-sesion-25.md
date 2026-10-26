# Registro de sesión 25: M5 paso 4b (V08: descuento y "Usar como importe estimado")

Fecha: 26/10/2026

## Creado / modificado
Sin dependencias nuevas. Se leyeron `descuento.ts` y `repositories/obligaciones.ts` reales. La lógica fiscal sigue en `src/domain/rules`.

| Ruta | Contenido |
|---|---|
| `src/app/calculadora.ts` | **Reemplazado**: añade `withElectronicDiscount` y `CALC_INFO.discountRateBp` (lo toma de `descuento.ts`) |
| `src/app/calculadora.test.ts` | **Reemplazado**: 11 pruebas (9 anteriores y 2 de descuento) |
| `src/app/calculadoraLink.ts` | **Nuevo**: `findEstimateTarget(obligaciones, codigo, mes, importe)` |
| `src/app/calculadoraLink.test.ts` | **Nuevo**: 5 pruebas |
| `src/i18n/calculadora.ts` | **Reemplazado**: bloques `discount` y `use` |
| `src/views/calculadora/Calculadora.svelte` | **Reemplazado**: bloque de descuento y botón por tributo; se quitó un `onMount` sin usar |

## Decisiones
- **Descuento**: se aplica a cada impuesto por separado (cada uno se paga en su obligación), con `electronicDiscount`. Con 0.50 + 0.50 el descuento es 0.02 + 0.02, no 0.03 sobre 1.00. Se muestra siempre como un bloque aparte "Si pagas por canal electrónico", sin interruptor. Sigue pendiente si el 3 % aplica también al recargo por mora (`01` no lo dice).
- **Obligación del mes**: la de `periodoTipo: 'mensual'` cuyo `periodoClave` es el mes de los ingresos (`2026-10`; vence en noviembre). Solo se puede escribir en una **pendiente**.
- **Qué se guarda**: el impuesto **sin** descuento, con `updateObligation(id, { importeEstimado })`. El descuento lo sigue ofreciendo V05 al pagar.
- Casos: sin obligación del mes, o pagada, u omitida: se explica y no hay botón. Si ya tiene importe oficial del vector, se avisa de que V05 muestra el oficial y el estimado se guarda igual. Si el estimado guardado ya es igual, no hay botón.
- Si las cifras están editadas, el botón avisa de que se guardan las cifras de la pantalla.
- Tras guardar se muestra "Guardado como importe estimado de {período}" con un enlace a la obligación.

## Pendiente
- Paso 5: resumen del mes en Inicio (ingresos, gastos, impuesto estimado) y botones "+ Ingreso" y "+ Gasto".
- Cierre de M5: marcar M5 como hecho en `05-plan-de-desarrollo.md` cuando pruebes el criterio del plan (3 ingresos y 2 gastos).
- Heredado: feriados reales, avisos (M6), pendientes fiscales de `01`, sección 7.

## Qué se verificó y qué no
- Verificado: las 11 pruebas de `calculadora` y las 5 de `calculadoraLink` pasan en Node 22 con un sustituto mínimo de Vitest, tus `ventas.ts`, `isipMensual.ts` y `descuento.ts`, y un `money.ts` simulado (mitad hacia arriba).
- **No verificado**: `Calculadora.svelte` ni los tipos (npm bloqueado en la sesión).

## Actualizar en el proyecto
- `03-vistas-y-flujos.md`, V08: sustituir el último punto de "Estado" por "Descuento del 3 % calculado por pago (bloque aparte). 'Usar como importe estimado' guarda el impuesto sin descuento en la obligación pendiente del mes (período = mes de los ingresos)".

## Pasos para aplicar (Termux)

```bash
cd ~/miapp && git pull
unzip -o ~/storage/downloads/m5-paso4b.zip
npm test
npx svelte-check
npm run build
```
`npm test`: 7 pruebas nuevas. Total esperado `371 passed` (364 + 7). Si `svelte-check` marca un error, pega el mensaje completo.

```bash
git add .
git commit -m "feat: add electronic discount and use-as-estimate to calculator (V08)"
git push
```

## Cómo probar
1. Abre `#/calculadora` en el mes actual, con ingresos de prueba. Debajo de cada impuesto debe decir "Se guarda en la obligación de {mes}, sin el descuento." y mostrar **Usar como importe estimado**.
2. Toca el botón de 0114022: sale "Guardado como importe estimado de …" y el botón desaparece ("Ya es el importe estimado…").
3. Toca "Ver obligación": en V05 el importe estimado coincide con la calculadora.
4. Cambia un ingreso en el registro, vuelve a la calculadora: el botón reaparece con la cifra nueva.
5. Comprueba el bloque "Si pagas por canal electrónico": el total con descuento debe ser el de cada impuesto menos 3 % (ejemplo: 100.00 pasa a 97.00).
6. Prueba un mes sin obligación (por ejemplo, el año siguiente sin generar): debe explicar que no hay obligación de ese mes.
7. Modo avión: todo sigue funcionando.
