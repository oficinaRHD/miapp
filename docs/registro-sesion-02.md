# Registro de sesión 02: hito M1 (dominio y reglas)

Fecha: 22/10/2026

## Qué se creó en esta sesión

Solo funciones puras en `src/domain/`, sin Svelte, Dexie ni Capacitor. Ninguna dependencia nueva.

| Ruta | Contenido |
|---|---|
| `src/domain/types.ts` | `ISODate`, `Centavos`, `PeriodoTipo`, `OrigenFecha` |
| `src/domain/money.ts` | `applyRateBp(base, bp)` (porcentaje en puntos básicos, mitad hacia arriba), `subtractFloor`, `parseCup` (texto a centavos), `formatCup` (`1,250.50 CUP`), `isCentavos` |
| `src/domain/dates.ts` | Fechas `YYYY-MM-DD` sin zona horaria: `parseISODate`, `isValidISODate`, `makeISODate`, `addDays`, `diffDays`, `compareDates`, `dayOfWeek` (0 = domingo), `daysInMonth`, `shiftMonth`, `monthKey`, `monthName`, `monthShort`, `localISODate` |
| `src/domain/businessDays.ts` | `isBusinessDay`, `nextBusinessDay`, `nthBusinessDayOfMonth`, `lateBusinessDays`; feriados como `Set` (`toHolidaySet`), vacío por defecto (`NO_HOLIDAYS`) |
| `src/domain/tributos.catalog.ts` | `RULES_VERSION = '2026.1'`, `TRIBUTOS` (9 de `01`), `findTributo`, `suggestedTributoCodes(tieneEmpleados)` |
| `src/domain/schedule.ts` | `generateObligations({ activeTributos, year, holidays?, vectorDates? })`, `obligationKey`, `onlyNew` |
| `src/domain/rules/ventas.ts` | `salesTax`: 10 % (0114022) |
| `src/domain/rules/isipMensual.ts` | `monthlyIsip`: 5 % × max(0, ingresos − 3,260.00) (0510122) |
| `src/domain/rules/mora.ts` | `lateSurcharge(principal, dias)` y `lateSurchargeByDates(principal, vence, pagado, feriados?)` (1060122) |
| `src/domain/rules/descuento.ts` | `electronicDiscount`: 3 % por canal electrónico |
| `*.test.ts` (9 archivos) | 65 pruebas, junto a cada módulo |

## Detalles que conviene recordar

- **Puntos básicos**: 10 % = 1000, 5 % = 500, 3 % = 300, 2 % = 200, 0.1 % = 10, 40 % = 4000. Redondeo "mitad hacia arriba" (el método oficial sigue pendiente, `01` sección 7, punto 6).
- **Reglas de fecha por defecto** (siempre manda la fecha del vector):
  - 0114022, 0510122, 0520522, 0610322: día 20 del mes siguiente al cierre del período; si no es día hábil pasa al siguiente (explica los 21/09 y 21/12 del vector).
  - 0810132 y 0820232: décimo día hábil del mes siguiente (texto del vector: "primeros diez días hábiles"). Con fines de semana y sin feriados reproduce 5 de las 6 fechas del vector 2026-27; la sexta (enero 2027) necesita el 01/01/2027 como feriado (da 15/01 en vez de 14/01).
  - 0530222: 30 de abril del año siguiente, sin ajuste.
  - 0730122 y 1060122: manuales (no se generan).
- **Períodos**: año fiscal enero-diciembre. Mensual `2026-09`, trimestral `2026-T3` (etiqueta `T3 2026 (jul-sep)`), anual `2026`.
- **Mora**: días hábiles = días hábiles del intervalo (vence, pago]. Sin lista de feriados solo se omiten sábados y domingos (la UI debe avisarlo).
- **Pruebas con datos reales**: el calendario 2026-27 de `01` (sección 2) está en `schedule.test.ts`. El feriado `2027-01-01` es solo un dato de prueba, no un dato de la app.

## Cambios respecto al plan

- `generateObligations` devuelve **borradores** (`ObligationDraft`: sin `id` ni `creadoEn`/`actualizadoEn`), no `Obligacion` completas. El repositorio (M2) añade `id` y marcas de tiempo y usa `onlyNew` para ser idempotente.
  **Actualizar**: `04-modelo-de-datos.md`, sección 5, primera frase ("devuelve la lista de `Obligacion`").
- Los tipos primitivos (`ISODate`, `Centavos`, etc.) viven en `src/domain/types.ts`; en M2, `src/data/` los importa en vez de redefinirlos.
  **Actualizar**: `04-modelo-de-datos.md`, sección 2 (aclarar de dónde vienen).
- Se añadió `rules/descuento.ts` (3 %), que el plan no listaba en M1 pero la ficha de pago (M4) necesita.
  **Actualizar**: `05-plan-de-desarrollo.md`, M1 (añadir `descuento.ts`).
- Nombres de funciones y variables en inglés; los campos que se guardarán (`tributoCodigo`, `periodoClave`, `vence`...) mantienen los nombres de `04`.

## Pendiente

- **Confirmar con la ONAT** el tercer tramo de mora: se asumió que "0.1 % por cada día de mora" cuenta días hábiles y se aplica al total (61 días = 6.1 %), no solo a los días pasados del 60. Anotado en el comentario de `mora.ts`. Actualizar `01`, sección 4, cuando se aclare.
- Sigue pendiente todo lo de `01`, sección 7: escala del ISIP anual, salario mínimo MTSS, **feriados de Cuba**, base de SS del titular, impuesto sobre documentos, redondeo oficial.
- No se maneja la excepción del vector para agentes de telecomunicaciones y de seguros en 0114022.
- No está definido si el 3 % de descuento aplica también al recargo por mora (se aplica a cualquier importe que se le pase).

## Pasos para aplicar (Termux)

**1. Descargar `m1-dominio.zip` del chat** (queda en Descargas) y preparar:
```bash
cd ~/miapp
git pull
pkg install unzip -y
```

**2. Descomprimir sobre el proyecto** (respeta las rutas; ajusta el nombre si el teléfono añadió `(1)`):
```bash
unzip -o ~/storage/downloads/m1-dominio.zip
ls src/domain src/domain/rules docs
```
Deben aparecer 9 módulos, 9 archivos `.test.ts` y `docs/registro-sesion-02.md`.

**3. Ejecutar las pruebas**
```bash
npm test
```
Debe terminar con `Tests 65 passed (65)`.

**4. Comprobar tipos y build**
```bash
npx svelte-check
npm run build
```

**5. Subir a GitHub**
```bash
git add .
git status
git commit -m "feat: add M1 domain (money, dates, business days, catalog, schedule, rules)"
git push
```
El workflow ejecuta `npm test` antes de compilar: debe quedar en verde.

## Cómo probar que el hito está hecho

1. `npm test` en Termux: 65 pruebas en verde.
2. Actions: el workflow "Build APK" termina en verde y el APK abre igual que en M0 (M1 no cambia la interfaz).
3. Si una prueba falla, pegar en el chat el bloque `FAIL` completo.

## Siguiente sesión

Hito M2: `db.ts` (Dexie, versión 1), repositorios, `seed.ts`, `backup.ts` (exportar/importar) y servicio de archivos (Filesystem + Share), usando los tipos de `src/domain/types.ts`.
