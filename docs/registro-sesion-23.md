# Registro de sesión 23: M5 paso 3 (V06 Registro)

Fecha: 26/10/2026

## Creado / modificado
Sin dependencias nuevas, sin lógica fiscal. Se leyeron `Calendario.svelte` e `i18n/calendario.ts` reales: de ahí salen `localISODate(new Date())`, `parseISODate`, `shiftMonth`, `monthName` y `formatDate` (de `src/app/format.ts`).

| Ruta | Contenido |
|---|---|
| `src/app/registroMonth.ts` | `monthKeyFrom(year, month)`, `emptyKind`, `formatNet`, `tipoForNew` |
| `src/app/registroMonth.test.ts` | 5 pruebas |
| `src/i18n/registroLista.ts` | Textos de V06 (`esRegistroLista`) |
| `src/views/registro/Registro.svelte` | V06: selector de mes, totales, filtro, lista por día, botón "+" |
| `src/App.svelte` | **Reemplazado**: la ruta `/registro` muestra `<Registro />` |
| `src/views/registro/RegistroTemp.svelte` | **Se borra** (ver pasos) |

## Decisiones
- **Totales**: ingresos, gastos y neto del mes completo; el filtro solo cambia la lista, no los totales. El neto negativo se muestra con `-` delante (`formatNet`), sin pasar números negativos a `formatCup`.
- **Lista**: agrupada por día (más reciente primero). Cada fila: descripción (o la categoría si no hay), categoría y cliente o proveedor, monto con `+` o `-`, y la marca "Con comprobante" en gastos justificados. Borde verde en ingresos y rojo en gastos; el signo y los textos dicen el tipo, así el color no es lo único que informa.
- **Mes**: abre en el mes actual; `‹` y `›` cambian de mes. Si llega una respuesta de un mes anterior mientras se cambia, se ignora.
- **Botón "+"**: abre un gasto nuevo si el filtro es Gastos; en cualquier otro caso, un ingreso.
- **Vacío**: sin movimientos en el mes, "Registrar el primer ingreso"; con filtro sin resultados, solo el mensaje.
- El botón "+" es fijo en la esquina inferior derecha; cuando exista la barra inferior de navegación habrá que subirlo.

## Pendiente
- Paso 4: V08 Calculadora y "Usar como importe estimado".
- Paso 5: resumen del mes en Inicio (ingresos, gastos, impuesto estimado) y botones "+ Ingreso" y "+ Gasto".
- Selector de mes con "saltar a hoy" y ajuste del botón "+" a la barra inferior (cuando exista).
- Heredado: feriados reales, avisos (M6), pendientes fiscales de `01`, sección 7.

## Qué se verificó y qué no
- Verificado: las 5 pruebas de `registroMonth` pasan en Node 22 con un sustituto mínimo de Vitest.
- **No verificado**: `Registro.svelte` ni `App.svelte` (npm bloqueado en la sesión). Hay que ejecutar `npx svelte-check` y la prueba manual.

## Actualizar en el proyecto
- `03-vistas-y-flujos.md`, V06: añadir "Los totales son del mes completo y no dependen del filtro; la lista va agrupada por día; el botón '+' abre gasto si el filtro es Gastos".

## Pasos para aplicar (Termux)

```bash
cd ~/miapp && git pull
unzip -o ~/storage/downloads/m5-paso3.zip
rm src/views/registro/RegistroTemp.svelte
npm test
npx svelte-check
npm run build
```
`npm test`: 5 pruebas nuevas. Total esperado `355 passed` (348 + 2 de today + 5). Si `svelte-check` marca un error, pega el mensaje completo.

```bash
git add .
git commit -m "feat: add movements list view (V06)"
git push
```

## Cómo probar
1. `npm run dev -- --host`, abre `#/registro`: ves el mes actual con Ingresos, Gastos y Neto.
2. Con movimientos de prueba (3 ingresos y 2 gastos), los totales deben coincidir con tu suma a mano.
3. Toca **Ingresos** y **Gastos**: la lista cambia, los totales no.
4. Toca `‹`: un mes sin movimientos muestra "Aún no hay movimientos este mes." y el botón del primer ingreso.
5. Toca un movimiento: abre V07 para editarlo; al guardar vuelve a la lista actualizada.
6. Toca el botón **+** con el filtro en Gastos: abre un gasto nuevo.
7. Modo avión: todo sigue funcionando.
