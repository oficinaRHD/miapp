# Registro de sesión 12: M4 paso 1a (V02 Inicio, lógica)

Fecha: 25/10/2026

## Creado / modificado
Sin dependencias nuevas, sin lógica fiscal. Solo lógica pura y una función de lectura; la vista llega en el paso 1b.

| Ruta | Contenido |
|---|---|
| `src/app/inicio.ts` | `buildInicioSummary(obligaciones, hoy)` devuelve `overdue`, `next` y `upcoming`; `daysUntil`, `urgencyOf`; constantes `UPCOMING_DAYS` (30), `URGENT_DAYS` (3), `SOON_DAYS` (7) |
| `src/app/inicio.test.ts` | 9 pruebas |
| `src/stores/obligaciones.ts` | **Reemplazado**: igual que antes más `listObligations(filter?)` (usa `repo.list`) |

## Decisiones
- Solo cuentan las obligaciones `pendiente`. Pagadas y omitidas no salen en Inicio.
- Vencida: fecha anterior a hoy. Vence hoy cuenta como "urgente", no vencida.
- Colores (UI, no son reglas fiscales): vencida y urgente (0-3 días) rojo, pronto (4-7) amarillo, tranquila (8 o más) verde. El 7 coincide con el primer aviso de `02`, sección 5.
- "Próximo vencimiento" es la primera pendiente desde hoy, aunque pase de 30 días. La lista "Próximos 30 días" incluye el día 30.
- Los días se calculan con un ayudante local (`Date.UTC` sobre `YYYY-MM-DD`), sin zonas horarias. No uso `diffDays` de `dates.ts` porque no recuerdo su signo; si quieres, se sustituye luego.
- `hoy` se inyecta (para pruebas). La vista usará `localISODate()` de `src/domain/dates.ts`.

## Pendiente
- Paso 1b: vista `Inicio.svelte`, textos `src/i18n/inicio.ts`, formato legible de fechas e importes, ruta `inicio` en `App.svelte`.
- Resumen del mes (ingresos, gastos, impuesto): necesita movimientos y la calculadora; llega en M5. En 1b se muestra vacío o se omite.
- Alertas de permiso denegado y de respaldo: se leerán de Ajustes (`notificacionesPermiso`) en 1b.
- Feriados reales y generar el año siguiente (heredado de M3).
- Pendientes fiscales de `01`, sección 7.

## Qué se verificó y qué no
- Verificado: las 9 pruebas pasan en Node 22 con un sustituto mínimo de Vitest. **No verificado**: tipos (`svelte-check`) y el store. Ejecutar ambos en Termux.
- El archivo `src/stores/obligaciones.ts` lo reconstruí del contenido que pegaste; reemplaza al actual.

## Pasos para aplicar (Termux)

```bash
cd ~/miapp && git pull
unzip -o ~/storage/downloads/m4-paso1a.zip
ls src/app/inicio* src/stores
npm test
npx svelte-check
```
`npm test`: 9 pruebas nuevas. Total esperado `242 passed` (233 + 9). Si tu total difiere pero no falla ninguna, está bien.

```bash
git add .
git commit -m "feat: add home summary logic (V02 step 1)"
git push
```

## Cómo probar
Solo pruebas automáticas: la vista aún no existe.

## Siguiente paso
Paso 1b: pega en el chat
```bash
cat src/App.svelte src/domain/dates.ts src/domain/tributos.catalog.ts
cat src/domain/money.ts src/i18n/es.ts src/stores/perfil.svelte.ts
```
