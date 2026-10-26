# Registro de sesión 26: M5 paso 5 (resumen del mes en Inicio) · cierra M5

Fecha: 26/10/2026

## Creado / modificado
Sin dependencias nuevas, sin lógica fiscal nueva: el impuesto sale de `calcMonth` (sesión 24), que usa las reglas de `src/domain/rules`. Se leyó `i18n/inicio.ts` real.

| Ruta | Contenido |
|---|---|
| `src/app/inicioMes.ts` | `buildMonthSummary(movimientos)`: ingresos, gastos, impuesto estimado y cantidad de movimientos |
| `src/app/inicioMes.test.ts` | 2 pruebas |
| `src/i18n/inicio.ts` | **Reemplazado**: mismas claves de antes más el bloque `month` |
| `src/views/inicio/Inicio.svelte` | **Reemplazado**: sección "Este mes", botones "+ Ingreso" y "+ Gasto", y enlaces a Registro y Calculadora |

## Decisiones
- **Orden en Inicio** (como el esquema de `03`): alertas, vencidas, próximo vencimiento, **este mes**, próximos 30 días.
- **Impuesto estimado** = 0114022 + 0510122 del mes actual, con las mismas bases que V08 (ingresos marcados como ventas y servicios; ingresos totales). No incluye descuento. Un texto debajo lo explica.
- El resumen carga por separado: si falla, sale un error en esa sección y las obligaciones se ven igual.
- Los botones "+ Ingreso" y "+ Gasto" abren V07 con el tipo ya elegido. Se muestran aunque el mes esté vacío.
- No se mantiene al día solo: se lee al abrir Inicio.

## Pendiente
- Marcar M5 como hecho en `05-plan-de-desarrollo.md` cuando pruebes el criterio (abajo).
- Barra inferior de navegación (cuando existan las 5 pestañas) y ajustar el botón "+" de V06.
- M6: alerta "hace X días sin respaldo", V14 a V16, avisos.
- Heredado: feriados reales, pendientes fiscales de `01`, sección 7.

## Qué se verificó y qué no
- Verificado: las 2 pruebas pasan en Node 22 con un sustituto mínimo de Vitest, tus reglas de ventas e ISIP y un `money.ts` simulado.
- **No verificado**: `Inicio.svelte` ni los tipos (npm bloqueado en la sesión).

## Actualizar en el proyecto
- `03-vistas-y-flujos.md`, V02, "Estado de implementación": cambiar "Llega en M5: resumen del mes y botones" por "Hecho en M5: resumen del mes (ingresos, gastos, impuesto estimado de 0114022 y 0510122) y botones '+ Ingreso' y '+ Gasto'; debajo, enlaces a Registro y Calculadora".
- `05-plan-de-desarrollo.md`, M5: añadir "**Estado**: hecho (26/10/2026). V07 sesión 21, V06 sesión 23, V08 sesiones 24 y 25, resumen de Inicio sesión 26" cuando pruebes el criterio.

## Pasos para aplicar (Termux)

```bash
cd ~/miapp && git pull
unzip -o ~/storage/downloads/m5-paso5.zip
npm test
npx svelte-check
npm run build
```
`npm test`: 2 pruebas nuevas. Total esperado `373 passed` (371 + 2). Si `svelte-check` marca un error, pega el mensaje completo.

```bash
git add .
git commit -m "feat: add month summary and quick add buttons to home (close M5)"
git push
```

## Cómo probar (criterio de M5)
1. Abre `#/` (Inicio). Debajo de "Próximo vencimiento" debe verse "Este mes · Octubre 2026" con Ingresos, Gastos e Impuesto estimado.
2. Toca **+ Ingreso** y registra 3 ingresos; toca **+ Gasto** y registra 2 gastos.
3. Vuelve a Inicio: Ingresos y Gastos deben ser tus sumas a mano. Ejemplo: ingresos marcados de 1,000.00 y 4,000.00 sin marcar dan 100.00 + 87.00 = 187.00 de impuesto.
4. Abre "Calculadora": el total debe ser el mismo número que "Impuesto estimado" de Inicio.
5. En un mes sin movimientos todo sale en 0.00 y los botones siguen ahí.
6. Modo avión: todo sigue funcionando.
