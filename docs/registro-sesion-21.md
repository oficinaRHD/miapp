# Registro de sesión 21: M5 paso 2 (V07 Movimiento)

Fecha: 26/10/2026

## Creado / modificado
Sin dependencias nuevas, sin lógica fiscal. Se leyeron `App.svelte`, `i18n/obligaciones.ts` y `Perfil.svelte` reales para copiar su estilo.

| Ruta | Contenido |
|---|---|
| `src/app/registroRoutes.ts` | `registroRoute(path)` (`list`, `new`, `edit`), `tipoFromHash`, `newMovementPath`, `editMovementPath` |
| `src/app/registroRoutes.test.ts` | 6 pruebas |
| `src/stores/movimientos.ts` | `listCategories`, `getMovement`, `listMovementsByMonth`, `addMovement`, `updateMovement`, `removeMovement`, `restoreMovement` |
| `src/i18n/registro.ts` | Textos de V07 (`esRegistro`) y mensajes de validación |
| `src/views/registro/Movimiento.svelte` | V07: crear y editar |
| `src/views/registro/RegistroTemp.svelte` | Lista **provisional** del mes para poder probar V07. La reemplaza V06 (paso 3) |
| `src/App.svelte` | **Reemplazado**: rutas `/registro`, `/registro/nuevo`, `/registro/:id`; enlace `registro` |

## Decisiones
- **Rutas por ruta, no por nombre**: `App.svelte` usa `registroRoute(router.route.path)`, porque no vi los nombres de ruta de `routes.ts` para el registro. Si luego quieres usar los nombres, se cambia en un solo sitio.
- **Tipo inicial** por `?tipo=gasto` en el enlace (`#/registro/nuevo?tipo=gasto`); sin parámetro, ingreso. El enrutador ignora la consulta, por eso se lee de `location.hash`.
- **Guardar** vuelve a `/registro`. **Guardar y añadir otro** (solo al crear) limpia monto, descripción y cliente, y conserva tipo, fecha, categoría y método.
- **Editar** reemplaza el registro completo (`restore`), no hace `update` con mezcla: así vaciar descripción o cliente funciona. Conserva `id` y `creadoEn`.
- **Eliminar** es inmediato, con **Deshacer** en la misma pantalla. Si sales sin deshacer, queda eliminado.
- Cambiar de tipo vacía la categoría y restablece "cuenta para ventas" (sí en ingreso).
- Ingreso muestra "Cuenta para el impuesto de ventas y servicios"; gasto muestra "Tengo comprobante" (justificado).

## Supuestos a confirmar
- `src/data/index.ts` exporta `db` (`import { db } from '../data'`). Lo deduje de tus registros 3 y 6.
- `localISODate()` y `formatCup()` se llaman sin argumentos extra.
- `MetodoPago` está exportado desde `src/data/models.ts` (ya lo usa `registro.ts`).

## Pendiente
- Paso 3: V06 (lista, selector de mes, totales, filtro). Borrar `RegistroTemp.svelte`.
- Paso 4: V08 Calculadora y "Usar como importe estimado".
- Paso 5: resumen del mes en Inicio.
- Heredado: feriados reales, avisos (M6), pendientes fiscales de `01`, sección 7.

## Qué se verificó y qué no
- Verificado: las 6 pruebas de `registroRoutes` pasan en Node 22 con un sustituto mínimo de Vitest.
- **No verificado**: nada de Svelte ni del store (npm bloqueado en la sesión). Hay que ejecutar `npx svelte-check` y la prueba manual.

## Actualizar en el proyecto
- `03-vistas-y-flujos.md`, V07: añadir "Guardar y añadir otro conserva tipo, fecha, categoría y método; Eliminar es inmediato con Deshacer en la misma pantalla; el tipo inicial viene de `?tipo=`".

## Pasos para aplicar (Termux)

```bash
cd ~/miapp && git pull
unzip -o ~/storage/downloads/m5-paso2.zip
npm test
npx svelte-check
npm run build
```
`npm test`: 6 pruebas nuevas. Total esperado `348 passed` (342 + 6). Si `svelte-check` marca un error, pega el mensaje completo.

```bash
git add .
git commit -m "feat: add movement form view (V07) and movements store"
git push
```

## Cómo probar
1. `npm run dev -- --host` y abre `http://localhost:5173/#/registro`. Debe verse "Registro (provisional)" sin movimientos.
2. Toca **+ Ingreso**. Pulsa **Guardar** vacío: salen los errores de monto y categoría.
3. Escribe `1,250.50`: debajo dice "Se guardará 1,250.50 CUP". Elige categoría y pulsa **Guardar**: vuelve a la lista y aparece el movimiento.
4. Toca **+ Gasto**: la lista de categorías es de gastos y aparece "Tengo comprobante". Prueba **Guardar y añadir otro**: avisa y conserva fecha y categoría.
5. Toca un movimiento de la lista: se abre en modo editar. Cambia el monto, guarda y comprueba la lista. Vacía la descripción, guarda y reábrelo: sigue vacía.
6. En editar, toca **Eliminar**: sale "Movimiento eliminado." Toca **Deshacer**: vuelve a su formulario.
7. En modo avión todo sigue funcionando.
