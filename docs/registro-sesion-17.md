# Registro de sesión 17: M4 paso 5 (V05 Detalle y ficha de pago)

Fecha: 25/10/2026

## Creado / modificado
Sin dependencias nuevas. La lógica fiscal sigue en `src/domain/rules` (mora, descuento, días hábiles); `pago.ts` solo la combina.

| Ruta | Contenido |
|---|---|
| `src/app/pago.ts` | `principalOf`, `quotePayment`, `suggestedForm`, `setPagadaEn`, `setCanal`, `setDescuento`, `validatePayment`, `toPagoInput`, `plainAmount`, `ratePercent` |
| `src/app/pago.test.ts` | 18 pruebas |
| `src/services/clipboard.ts` | `copyText(text)`: `navigator.clipboard` con respaldo `execCommand` (sin plugin) |
| `src/stores/obligaciones.ts` | **Reemplazado**: añade `getObligation`, `markObligationPaid`, `omitObligation`, `reopenObligation` |
| `src/i18n/detalle.ts` | Textos de V05 |
| `src/views/obligaciones/ObligacionDetalle.svelte` | V05 completa (ver abajo) |
| `src/App.svelte` | **Reemplazado**: ruta `obligacion` y sin el enlace de prueba `abc` |
| `docs/03-vistas-y-flujos.md` | **Reemplazado**: V05 actualizado (V02 a V04 ya incluidos) |

## Qué hace la vista
- Datos: tributo, código, período, fecha límite con su origen, código de barras, importes estimado y oficial.
- Ficha de pago (solo pendientes): copiar RC-05 sin guiones, código de tributo, código de barras e importe. Si falta alguno, lo dice.
- Estimación: días hábiles de retraso, recargo por mora con su tramo y porcentaje, y casilla "Pago por canal electrónico (-3 %)" con descuento y total.
- Marcar como pagada: fecha (no futura), canal, importe, recargo y notas. Importe y recargo se rellenan solos y se recalculan al cambiar fecha o canal; se pueden corregir.
- Omitir con motivo opcional. Volver a pendiente desde pagada u omitida.

## Decisiones (afectan a otros archivos)
- **`importePagado` = importe del tributo después del descuento, sin el recargo. `recargoMora` = recargo aparte** (es el tributo 1060122). Así "impuesto pagado" de V09 no mezcla mora.
  **Actualizar `04-modelo-de-datos.md`**, sección 2, los comentarios de dos campos: `importePagado?: Centavos; // lo pagado del tributo, tras el descuento y sin el recargo` y `recargoMora?: Centavos; // recargo anotado (tributo 1060122), aparte de importePagado`.
- El descuento del 3 % se aplica solo al importe, no al recargo (`01` no dice si aplica a la mora). Queda como pendiente en `01`, sección 7.
- Sin feriados, los días hábiles son lunes a viernes; la pantalla lo avisa. Más de 60 días: se mantiene la suposición de `mora.ts` (0,1 % por cada día hábil) y la pantalla la marca como pendiente de confirmar.
- El descuento solo se ofrece con canal electrónico: elegirlo lo activa, otro canal lo apaga.
- Copiar usa `navigator.clipboard`, sin plugin: el APK y `localhost` son contextos seguros. Si algún día falla en el APK, se cambia por `@capacitor/clipboard` (ya está en el plan de M0).

## Pendiente
- **RC-05 con guiones**: `01` pide copiarlo con y sin guiones pero no da la agrupación. No la inventé. Falta ver `perfilForm.ts` (ver abajo).
- Compartir ficha (necesita `@capacitor/share`), editar fecha, código de barras e importe oficial desde esta pantalla, comprobante adjunto (v0.2).
- Cancelar los avisos pendientes al pagar y reprogramarlos al reabrir (M6).
- Feriados reales y generar el año siguiente (heredado de M3).

## Qué se verificó y qué no
- Verificado: las 18 pruebas de `pago.test.ts` pasan en Node 22 con un sustituto mínimo de Vitest y tus archivos reales `mora.ts`, `descuento.ts`, `businessDays.ts` y `money.ts`. Incluyen 4 días hábiles de retraso (2 %), 43 (5 %) y el descuento del 3 %.
- **No verificado**: `ObligacionDetalle.svelte`, `App.svelte`, tipos, `repo.markPaid`, `markOmitted` y `reopen` en uso real, ni el copiado al portapapeles en el APK.
- Al pegar `mora.ts` la línea 8 salió pegada en una sola (artefacto de la terminal); en tu archivo real debería estar bien.

## Pasos para aplicar (Termux)

```bash
cd ~/miapp && git pull
unzip -o ~/storage/downloads/m4-paso5.zip
npm test
npx svelte-check
npm run build
```
`npm test`: 18 pruebas nuevas. Total esperado `304 passed` (286 + 18). Si `svelte-check` marca un error, pega el mensaje completo.

```bash
git add .
git commit -m "feat: add obligation detail and payment sheet (V05)"
git push
```

## Cómo probar
1. `npm run dev -- --host`, abre `#/obligaciones` y toca una tarjeta vencida.
2. Debe verse la ficha con botones "Copiar" y la estimación con los días de retraso y el recargo. Toca "Copiar" y pega en cualquier campo para comprobar.
3. Marca "Pago por canal electrónico (-3 %)": aparecen el descuento y el total.
4. Toca "Marcar como pagada": la fecha es hoy y el importe y el recargo ya vienen rellenos. Cambia la fecha a una anterior al vencimiento: el recargo se vacía.
5. Confirma: la tarjeta pasa a "Pagada" y a la lista Pagadas. Toca "Volver a pendiente" y regresa a Pendientes.
6. Repite con "Omitir" y un motivo; debe salir en Omitidas.
7. Modo avión: todo sigue funcionando.
