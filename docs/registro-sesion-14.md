# Registro de sesión 14: M4 paso 2 (V03 Calendario)

Fecha: 25/10/2026

## Creado / modificado
Sin dependencias nuevas, sin lógica fiscal.

| Ruta | Contenido |
|---|---|
| `src/app/calendario.ts` | Lógica pura: `buildMonthGrid` (semanas lunes a domingo), `statusOf`, `worstStatus`, `filterByTributo`, `tributoCodes`, `obligationsOn`, `groupByMonth`, `defaultSelected` |
| `src/app/calendario.test.ts` | 13 pruebas |
| `src/i18n/calendario.ts` | Textos de V03 y `dayCountText(n)` |
| `src/i18n/calendario.test.ts` | 1 prueba |
| `src/views/calendario/Calendario.svelte` | V03: alternar Mes/Año, filtro por tributo, cuadrícula con puntos, leyenda, lista del día, lista del año |
| `src/App.svelte` | **Reemplazado**: la ruta `calendario` muestra `<Calendario />` |
| `docs/03-vistas-y-flujos.md` | **Reemplazado**: V02 y V03 actualizados (ver abajo) |

`inicio.ts` y `stores/obligaciones.ts` no cambian: V03 reutiliza `urgencyOf` y `listObligations()`.

## Decisiones
- La semana empieza el lunes. Días de meses vecinos: atenuados, sin punto y sin poder tocarse.
- Muestra todas las obligaciones, no solo las pendientes. Un día con varias muestra el punto de la más grave y su número si son más de una. Gravedad: vencida, urgente, pronto, a tiempo, pagada, omitida.
- Colores de pendientes: los mismos umbrales de V02. Pagada gris azulado, omitida gris. El texto de cada tarjeta y la etiqueta de cada celda (`aria-label`) dicen el estado, así el color no es lo único que informa.
- Vista Año: agrupa por mes de **vencimiento**. Una obligación anual con fecha en abril del año siguiente sale en ese abril.
- El filtro ofrece solo tributos con obligaciones generadas y vale para Mes y Año. Al cambiar de mes se selecciona hoy o el día 1.
- Los datos se leen una vez al abrir la vista. No hay navegación a otra vista que cambie datos desde aquí.

## Cambio en `03-vistas-y-flujos.md`
El archivo que pegaste no traía mi cambio de V02 de antes, así que este archivo incluye **V02 y V03**. Reemplaza el del proyecto. Solo cambian esas dos secciones.

## Qué se verificó y qué no
- Verificado: las 14 pruebas nuevas pasan en Node 22 con un sustituto mínimo de Vitest y el `dates.ts` real (incluye octubre 2026 con 5 semanas y febrero 2027 con 4).
- **No verificado**: `Calendario.svelte`, `App.svelte` y tipos (sin Svelte ni Vite en la sesión). Ejecutar `npx svelte-check` y la prueba manual.

## Pendiente
- Siguiente: V04 Obligaciones (lista filtrable), luego V05 Detalle y ficha de pago.
- Barra inferior de navegación (cuando existan las 5 pestañas).
- Feriados reales y generar el año siguiente (heredado de M3).
- Pendientes fiscales de `01`, sección 7.

## Pasos para aplicar (Termux)

```bash
cd ~/miapp && git pull
unzip -o ~/storage/downloads/m4-paso2.zip
ls src/app/calendario* src/views/calendario
npm test
npx svelte-check
npm run build
```
`npm test`: 14 pruebas nuevas. Total esperado `260 passed` (246 + 14). Si `svelte-check` marca un error, pega el mensaje completo.

```bash
git add .
git commit -m "feat: add fiscal calendar view (V03)"
git push
```

## Cómo probar
1. `npm run dev -- --host` y abre `http://localhost:5173/#/calendario` (o toca `calendario` abajo).
2. Debe verse el mes actual con hoy subrayado. Los días con vencimientos tienen un punto de color.
3. Toca un día con punto: debajo salen sus tarjetas. Toca una tarjeta: la ruta cambia a `obligacion`.
4. `‹` y `›` cambian de mes; el día seleccionado pasa a hoy o al día 1.
5. Elige un tributo en el filtro: solo quedan sus puntos.
6. Toca "Año": lista por mes, con `‹` `›` para cambiar de año.
7. Pasa a modo avión: todo sigue funcionando.
