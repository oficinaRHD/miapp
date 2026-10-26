# Registro de sesión 20: M5 paso 1 (lógica pura del registro)

Fecha: 26/10/2026

## Creado / modificado
Sin dependencias nuevas, sin lógica fiscal. Solo lógica pura; las vistas V07, V06 y V08 llegan en los pasos siguientes. Se leyeron `movimientos.ts`, `categorias.ts`, `ventas.ts`, `isipMensual.ts` y `seed.ts` reales.

| Ruta | Contenido |
|---|---|
| `src/app/registro.ts` | Texto a centavos (`amountFromText`, `amountToText`); borrador del formulario (`newDraft`, `draftFromMovimiento`, `setTipo`, `validateDraft`, `canSave`, `toMovimientoInput`, `hasChanges`); lista y totales (`monthTotals`, `filterByTipo`, `sortForList`, `groupByDay`, `monthKeyOf`, `isMonthKey`, `categoryName`) |
| `src/app/registro.test.ts` | 20 pruebas |

## Decisiones
- **Importe escrito**: acepta `1250.50`, `1,250.50`, `1.250,50`, `12,5`, `1 250`. Un solo separador seguido de exactamente 3 dígitos se lee como miles (`1.234` = 1,234.00). Más de 2 decimales, negativos o letras: rechazado.
- **Validación (V07)**: monto mayor que 0, fecha real, categoría existente y del mismo tipo. Errores: `amount`, `date`, `category`, `category-type`.
- **Cambiar de tipo** (ingreso/gasto) vacía la categoría si era del otro tipo y restablece "cuenta para ventas" (sí en ingreso, no en gasto).
- **Banderas por tipo**: un gasto nunca cuenta para ventas; un ingreso nunca es "justificado" (esa marca es para la regla del 80 % de gastos).
- **Totales del mes**: `ventas` suma solo los ingresos con `cuentaParaVentas`; es la base para 0114022 y 0510122 en V08. `neto` puede ser negativo.
- **Orden de la lista**: día más reciente primero y, dentro del día, el más reciente primero.
- **Fuera del dominio fiscal**: `registro.ts` no calcula impuestos; V08 usará `salesTax` y `monthlyIsip` de `src/domain/rules`.

## Pendiente (pasos siguientes)
- Paso 2: store `src/stores/movimientos.ts` (listar mes, crear, editar, eliminar con deshacer) y V07.
- Paso 3: V06 con selector de mes, totales y filtro.
- Paso 4: V08 con "Usar como importe estimado" (necesita elegir la obligación del mes de 0114022 y 0510122; ver duda abajo).
- Paso 5: resumen del mes en Inicio.
- Heredado: feriados reales, avisos (M6), pendientes fiscales de `01`, sección 7.

## Duda para el paso 4
"Usar como importe estimado" escribe en `importeEstimado` de una obligación. El impuesto de 0114022 y el de 0510122 son dos obligaciones distintas con importes distintos, así que V08 guardará cada uno en la suya (período = mes siguiente al del ingreso, según `01`: vence el 20 del mes siguiente). Si el período no existe en el calendario, la app lo dirá en vez de crearlo.

## Qué se verificó y qué no
- Verificado: las 20 pruebas pasan en Node 22 con un sustituto mínimo de Vitest y un `isValidISODate` simulado.
- **No verificado**: tipos con `svelte-check` (ni `exactOptionalPropertyTypes`, que `toMovimientoInput` respeta omitiendo los opcionales vacíos) ni el `dates.ts` real. Se comprueban en Termux.

## Pasos para aplicar (Termux)

```bash
cd ~/miapp && git pull
unzip -o ~/storage/downloads/m5-paso1.zip
ls src/app/registro* docs
npm test
npx svelte-check
```
`npm test`: 20 pruebas nuevas. Total esperado `342 passed` (322 + 20). Si tu total difiere pero no falla ninguna, está bien. Si `svelte-check` marca un error, pega el mensaje completo.

```bash
git add .
git commit -m "feat: add movement form and month totals logic (M5 step 1)"
git push
```

## Cómo probar
Solo pruebas automáticas: las vistas aún no existen.

## Siguiente paso
Paso 2: store de movimientos y V07. Para ajustarlo a tu código real, pega:
```bash
cat src/App.svelte src/i18n/obligaciones.ts
cat src/views/perfil/Perfil.svelte
```
