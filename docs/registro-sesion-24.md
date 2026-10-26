# Registro de sesión 24: M5 paso 4a (V08 Calculadora, desglose)

Fecha: 26/10/2026

## Creado / modificado
Sin dependencias nuevas. Se leyeron `Inicio.svelte` y `stores/obligaciones.ts` reales. La lógica fiscal sigue en `src/domain/rules` (`salesTax`, `monthlyIsip` y sus constantes); `calculadora.ts` solo las combina.

| Ruta | Contenido |
|---|---|
| `src/app/calculadora.ts` | `calcMonth`, `evaluateDraft`, `draftFromTotals`, `isEdited`, `percentText`, `CALC_INFO` (tasas y mínimo exento tomados de las reglas) |
| `src/app/calculadora.test.ts` | 9 pruebas |
| `src/i18n/calculadora.ts` | Textos de V08 (`esCalculadora`) |
| `src/views/calculadora/Calculadora.svelte` | V08: selector de mes, dos campos editables, desglose y total |
| `src/App.svelte` | **Reemplazado**: ruta `/calculadora` y enlace `calculadora` |

## Decisiones
- **Dos bases distintas**, según `01`, sección 3:
  - 0114022: 10 % de los ingresos **por ventas y servicios** = ingresos marcados "cuenta para el impuesto de ventas y servicios".
  - 0510122: 5 % del exceso sobre 3,260.00 de los ingresos **totales** del mes = todos los ingresos.
  Ambas cifras salen del registro del mes y se pueden editar para probar otras.
- Validación: cero se acepta (mes sin ingresos); vacío o texto no válido, no; ventas mayores que ingresos totales, no. Con error no se muestra el resultado.
- El desglose muestra base, tasa, mínimo exento y el impuesto de cada tributo, más el total.
- Avisos en pantalla: "Estimación orientativa. Confirma con tu vector fiscal." y que no se consideran las excepciones del vector (agentes de telecomunicaciones y de seguros).
- La ruta se reconoce por `router.route.path === '/calculadora'`, como el registro.

## Pendiente (paso 4b)
- **Total con descuento del 3 %** si paga por canal electrónico: usará `electronicDiscount` de `src/domain/rules/descuento.ts`. No vi su firma (si devuelve el descuento o el importe ya rebajado), así que no la llamé.
- **"Usar como importe estimado"** en la obligación del mes: `updateObligation(id, changes)` usa `ObligacionChanges`, y no sé si admite `importeEstimado`. Hace falta ver `src/data/repositories/obligaciones.ts`.
- Cuál es la obligación del mes: según `01`, el período (p. ej. `2026-09`) vence el ~20 del mes siguiente; la obligación se busca por `[tributoCodigo+periodoClave]` (`0114022` y `0510122` del mismo mes). Si no existe, la pantalla lo dirá.
- Heredado: feriados reales, avisos (M6), pendientes fiscales de `01`, sección 7.

## Duda abierta
`04-modelo-de-datos.md` dice que `cuentaParaVentas` marca el "ingreso sujeto a 0114022 y 0510122". Según `01`, 0510122 usa los ingresos **totales**. Esta sesión sigue `01`. **Actualizar** `04`, sección 2, el comentario de `cuentaParaVentas`: `// ingreso sujeto a 0114022 (ventas y servicios); 0510122 usa todos los ingresos`. Si prefieres que el ISIP use solo los marcados, se cambia en `Calculadora.svelte`/`calculadora.ts` y en este registro.

## Qué se verificó y qué no
- Verificado: las 9 pruebas pasan en Node 22 con un sustituto mínimo de Vitest, tus `ventas.ts` e `isipMensual.ts` (copiados de lo que pegaste) y un `money.ts` simulado (mitad hacia arriba). En Termux corren con el `money.ts` real.
- **No verificado**: `Calculadora.svelte`, `App.svelte` ni los tipos (npm bloqueado en la sesión).

## Actualizar en el proyecto
- `03-vistas-y-flujos.md`, V08: añadir "Dos campos editables (ingresos por ventas y servicios; ingresos totales), desglose de 0114022 y 0510122 con su tasa y el mínimo exento, y total. El descuento del 3 % y 'Usar como importe estimado' llegan en el paso 4b".

## Pasos para aplicar (Termux)

```bash
cd ~/miapp && git pull
unzip -o ~/storage/downloads/m5-paso4a.zip
npm test
npx svelte-check
npm run build
```
`npm test`: 9 pruebas nuevas. Total esperado `364 passed` (355 + 9). Si `svelte-check` marca un error, pega el mensaje completo.

```bash
git add .
git commit -m "feat: add monthly calculator view (V08, breakdown)"
git push
```

## Cómo probar
1. `npm run dev -- --host` y abre `#/calculadora` (o toca `calculadora` abajo).
2. Con ingresos de prueba en el mes actual, los dos campos vienen rellenos. Ejemplo: ventas 1000 y totales 5000 dan 100.00 de 0114022, 87.00 de 0510122 y 187.00 en total.
3. Pon ingresos totales de 3000 (menos que el mínimo exento): 0510122 da 0.00.
4. Escribe ventas mayores que los ingresos totales: sale el error y desaparece el resultado.
5. Cambia un campo: aparece "Usar los del registro" y lo restablece.
6. `‹` lleva a un mes sin ingresos: avisa y el total es 0.00.
7. Modo avión: todo sigue funcionando.
