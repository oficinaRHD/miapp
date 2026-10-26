# Registro de sesión 18: M4 paso 5b (RC-05 con guiones)

Fecha: 25/10/2026

## Modificado
Cambio pequeño sobre la sesión 17. Se reutiliza `formatRc05(rc05, withHyphens)` de `src/app/perfilForm.ts`: no se escribió ningún formato nuevo.

| Ruta | Cambio |
|---|---|
| `src/views/obligaciones/ObligacionDetalle.svelte` | **Reemplazado**: la ficha copia el RC-05 sin guiones y con guiones |
| `src/i18n/detalle.ts` | **Reemplazado**: añade `fields.rc05Hyphens` |
| `docs/03-vistas-y-flujos.md` | **Reemplazado**: V05 sin el pendiente del RC-05 |

## Qué se verificó y qué no
- **No verificado**: no vi el cuerpo de `formatRc05` (solo su firma, línea 185), así que no sé qué agrupación usa. Hay que mirarlo en el teléfono.
- Si `svelte-check` marca algo en `formatRc05`, pega el mensaje.

## Pendiente
- Compartir ficha (necesita `@capacitor/share`), editar fecha, código de barras e importe oficial desde V05, comprobante adjunto (v0.2).
- Cancelar o reprogramar avisos al pagar o reabrir (M6).
- Feriados reales y generar el año siguiente (heredado de M3).
- Con esto M4 queda completo salvo los pendientes de arriba.

## Pasos para aplicar (Termux)

```bash
cd ~/miapp && git pull
unzip -o ~/storage/downloads/m4-paso5b.zip
npm test
npx svelte-check
npm run build
```
`npm test`: sin pruebas nuevas, total `304 passed`.

```bash
git add .
git commit -m "feat: copy RC-05 with hyphens in payment sheet"
git push
```

## Cómo probar
1. Pon un RC-05 de prueba de 16 dígitos en `#/ajustes/perfil` (si no lo tienes).
2. Abre una obligación pendiente: la ficha muestra dos filas, "RC-05 sin guiones" y "RC-05 con guiones".
3. Copia cada una y pégala donde puedas leerla: la primera son 16 dígitos seguidos; la segunda debe llevar guiones. Compara con tu RC-05 impreso.
