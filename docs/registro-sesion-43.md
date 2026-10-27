# Registro de sesión 43: M6 paso 4e (correcciones visuales tras probar 4c y 4d)

Fecha: 27/10/2026

## Qué se vio en las capturas del APK
1. Abajo, la barra de navegación del teléfono es transparente y deja ver el contenido y el botón "+" debajo de sus iconos.
2. Con el tema claro, la barra de estado (hora, batería) se ve casi blanca sobre fondo claro: los iconos eran claros porque el teléfono estaba en modo oscuro.
3. Las tarjetas perdieron el filo de color (rojo, ámbar, verde) y las etiquetas "Vencida" y "A tiempo" perdieron su color. Causa: el `border` global de `shell.css` (paso 4c) pisaba el `border-left` de cada vista.
4. Tema oscuro muy plano: fondo, tarjetas y bordes casi del mismo tono.
5. Botones "Ingreso" y "Gasto" con texto oscuro sobre verde (poco contraste): el botón global era verde relleno y la vista pone `color: inherit`.

## Creado / modificado
Sin dependencias nuevas (`SystemBars` viene en `@capacitor/core` 8), sin lógica fiscal.

| Ruta | Contenido |
|---|---|
| `src/app/shell.css` | **Reemplazado**: paleta más contrastada (claro y oscuro), nuevos tokens `--ok`, `--warn`, `--surface-2`; las tarjetas conservan el filo de color; etiquetas y filos de estado con color; botones "tonales" y botón seleccionado en verde; `.btn` y notas legibles; el botón flotante sube sobre la barra del teléfono (nombre de clase supuesto: `fab`) |
| `src/App.svelte` | **Reemplazado**: franja opaca fija bajo la barra de navegación (`.bottom-cover`, altura `--sab`) |
| `src/app/apariencia.ts` y `.test.ts` | **Reemplazados**: `isDarkTheme`, `barsStyleFor` (+2 pruebas) |
| `src/services/systemBars.ts` | Nuevo: `setSystemBarsDark` (iconos claros u oscuros en las barras; no hace nada en el navegador) |
| `src/stores/tema.ts` | **Reemplazado**: al aplicar el tema ajusta las barras y sigue los cambios de modo del teléfono en automático |

## Decisiones
- Los iconos de la barra de estado ahora siguen el tema de la **app**, no el del teléfono (`SystemBars.setStyle`, `Dark` = iconos claros).
- Los colores de estado salen de las clases que ya usan las vistas (`vencida`, `urgente`, `pronto`, `tranquila`). Si Obligaciones o Calendario usan otros nombres, no se colorean: hace falta ver sus capturas.
- Botón predeterminado: tonal (fondo verde suave, texto normal). Se rellena de verde si es `aria-pressed="true"` o tiene clase `active`, `selected` u `on`.

## Pendiente
- Confirmar el nombre de la clase del botón "+" (Registro). Si no sube sobre la barra, pega: `grep -rn "position: fixed" src/views`.
- Si los filtros "Todos / Ingresos / Gastos" o "Ingreso / Gasto" no marcan el seleccionado, pega cómo marcan la selección (`grep -n "aria-pressed\|class:" src/views/registro/*.svelte`).
- Revisar Calendario, Obligaciones, Ficha y Calculadora con el tema nuevo.
- Feriados fuera de v0.1 (ver respuesta de la sesión): pasar V14 "Feriados" a v0.2 en `03` y `05`, y quitar la tarjeta de `ajustesMenu.ts` si se confirma.

## Qué se verificó y qué no
- Verificado: 6 pruebas de `apariencia` pasan en Node 22 (2 nuevas).
- **No verificado**: el aspecto real, los tipos de `SystemBars` (`svelte-check`) y el botón "+".

## Actualizar en el proyecto
- `02-arquitectura-y-stack.md`, sección 3: añadir `services/systemBars.ts`; sección 10: iconos de las barras según el tema.

## Pasos para aplicar (Termux)
```bash
cd ~/miapp && git pull
unzip -o ~/storage/downloads/m6-paso4e.zip
npm test
npx svelte-check
npm run build
```
Esperado: 2 pruebas nuevas, total `455 passed` (453 + 2). Si `svelte-check` marca error en `SystemBars`, pega el mensaje.

```bash
git add .
git commit -m "fix: restore card status colors, improve theme contrast and system bars (M6 step 4e)"
git push
```

## Cómo probar (APK nuevo, encima del anterior)
1. Tema claro: la hora y la batería se ven oscuras. Tema oscuro: se ven claras.
2. Inicio: las tarjetas vuelven a tener el filo rojo (vencida), ámbar o verde, y la etiqueta "Vencida" sale roja, "A tiempo" verde.
3. Abajo: los iconos de la barra del teléfono quedan sobre una franja lisa; nada se ve a través.
4. Tema oscuro: tarjetas y bordes se distinguen del fondo.
5. Registro, "+": el botón queda por encima de la barra del teléfono.
6. Nuevo movimiento: "Ingreso" y "Gasto" tienen texto legible; el elegido se ve relleno.
