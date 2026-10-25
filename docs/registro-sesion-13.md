# Registro de sesión 13: M4 paso 1b (V02 Inicio, vista)

Fecha: 25/10/2026

## Creado / modificado
Sin dependencias nuevas, sin lógica fiscal. Se leyeron los archivos reales `App.svelte`, `dates.ts`, `tributos.catalog.ts`, `money.ts`, `es.ts` y `perfil.svelte.ts` antes de escribir.

| Ruta | Contenido |
|---|---|
| `src/views/inicio/Inicio.svelte` | V02: saludo, alertas (vencidas, notificaciones denegadas), "Vencidas", "Próximo vencimiento", "Próximos 30 días", aviso de importes orientativos. Recibe `perfil` como propiedad |
| `src/i18n/inicio.ts` | Textos de V02, `daysText(dias)` y `overdueText(n)` |
| `src/i18n/inicio.test.ts` | 2 pruebas |
| `src/app/format.ts` | `formatDate('2026-11-20')` devuelve `20 nov 2026` |
| `src/app/format.test.ts` | 2 pruebas |
| `src/app/inicio.ts` | **Reemplazado**: `daysUntil` usa `diffDays(today, vence)` de `dates.ts` (se quita el ayudante local) |
| `src/App.svelte` | **Reemplazado**: la ruta `inicio` muestra `<Inicio />`; el título "Asistente TCP" solo sale en las demás pantallas; el estilo de enlaces se limita a `nav a` |

## Detalles que conviene recordar
- Cada tarjeta es un enlace a `#/obligaciones/<id>` (V05, aún no existe: mostrará la pantalla provisional con la ruta).
- Importe de la tarjeta: `importeOficial` ("según el vector"), si no `importeEstimado` ("estimado", con `~`), si no "Importe por definir". Siempre con el aviso orientativo al final.
- Colores fijos que sirven en modo claro y oscuro: rojo (vencida y urgente), ámbar (pronto), verde (a tiempo).
- La alerta de notificaciones sale solo si el permiso guardado es `denied`. `loadNotificationPermission` viene de `src/stores/ajustes.ts` (no lo vi; si el tipo de retorno difiere, `svelte-check` lo dirá). El enlace va a `#/ajustes/notificaciones` (V16, M6).
- La hora de hoy se toma una vez al abrir la vista (`localISODate(new Date())`); no se refresca si la app queda abierta pasada la medianoche.

## Cambios respecto al plan
- Quedan fuera de este paso, por depender de otros hitos: resumen del mes y botones "+ Ingreso" y "+ Gasto" (M5), alerta "hace X días sin respaldo" (M6, necesita guardar la fecha del último respaldo) y la barra inferior de navegación.
  **Actualizar**: `03-vistas-y-flujos.md`, V02 (anotar que esas piezas llegan en M5 y M6).

## Qué se verificó y qué no
- Verificado: las 13 pruebas de `inicio.test.ts`, `format.test.ts` e `i18n/inicio.test.ts` pasan en Node 22 con un sustituto mínimo de Vitest y el `dates.ts` real.
- **No verificado**: `Inicio.svelte`, `App.svelte` y tipos (sin Svelte ni Vite en la sesión). Hay que ejecutar `npx svelte-check` y la prueba manual.

## Pendiente
- Paso siguiente: V03 Calendario (vista de mes con puntos por día).
- Limpiar de `es.ts` las claves que ya no use la pantalla provisional cuando se retire.
- Feriados reales y generar el año siguiente (heredado de M3).
- Pendientes fiscales de `01`, sección 7.

## Pasos para aplicar (Termux)

```bash
cd ~/miapp && git pull
unzip -o ~/storage/downloads/m4-paso1b.zip
ls src/views/inicio src/app/format* src/i18n/inicio*
npm test
npx svelte-check
npm run build
```
`npm test`: 4 pruebas nuevas. Total esperado `246 passed` (242 + 4). Si `svelte-check` marca un error, pega el mensaje completo.

```bash
git add .
git commit -m "feat: add home view (V02 step 2)"
git push
```

## Cómo probar
1. `npm run dev -- --host` y abrir `http://localhost:5173`. Con onboarding hecho, la ruta `#/` muestra "Hola, <tu nombre>".
2. Debe verse "Próximo vencimiento" con una tarjeta, y "Próximos 30 días" con las del siguiente mes. El borde izquierdo cambia de color según los días que faltan.
3. Si hay obligaciones con fecha anterior a hoy, aparecen en "Vencidas" y en la alerta de arriba. Para forzarlo, en el onboarding escribe una fecha del vector pasada.
4. Toca una tarjeta: la ruta cambia a `obligacion` con su id.
5. Toca el enlace `perfil` y vuelve a `inicio`: el título "Asistente TCP" solo aparece fuera de Inicio.
6. Actions en verde; el APK abre en Inicio y funciona en modo avión.
