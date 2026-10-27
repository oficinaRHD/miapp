# Registro de sesión 36: M6 paso 3d (V16 completa: preferencias y guía de batería)

Fecha: 26/10/2026

## Creado / modificado
Sin dependencias nuevas, sin lógica fiscal.

| Ruta | Contenido |
|---|---|
| `src/app/avisosForm.ts` | Lógica pura del formulario: `OFFSET_CHOICES` (7, 3, 1, 0), `draftFromSettings`, `toggleOffset`, `setTime`, `validateDraft`, `toSettings`, `hasChanges`, `parseTime`, `timeText` |
| `src/app/avisosForm.test.ts` | 9 pruebas |
| `src/i18n/notificaciones.ts` | **Reemplazado**: mismos textos de antes más preferencias, errores del formulario, `offsetLabel` y la guía de batería (`battery`) |
| `src/i18n/notificaciones.test.ts` | **Reemplazado**: 6 pruebas (4 anteriores y 2 nuevas) |
| `src/views/notificaciones/Notificaciones.svelte` | **Reemplazado**: añade tarjeta "Cuándo avisar" (casillas 7, 3, 1 días antes y el mismo día; hora con selector; "Guardar y reprogramar") y la guía de batería plegable |
| `docs/03-vistas-y-flujos.md` | **Reemplazado**: V16 al día |

## Decisiones
- El formulario ofrece solo 7, 3, 1 y 0 días antes (los de `03`, V16), con al menos uno obligatorio. `planNotices` ya admitía otros valores de 0 a 30 si algún día hacen falta.
- Guardar las preferencias reprograma los avisos al momento y muestra el resultado ("Preferencias guardadas. Avisos programados: N.").
- El botón Guardar se activa solo si hay cambios y el formulario es válido.
- Guía de batería en texto, plegable. No hay plugin para abrir los ajustes del sistema (no añadí dependencias), así que indica la ruta manual. Los nombres de los menús varían por marca; el texto lo advierte y no promete nombres exactos.
- La hora se interpreta en la zona horaria del teléfono (igual que en el paso 3b).

## Pendiente
- Recordatorios mensuales (registrar movimientos el último día del mes a las 18:00, revisar la calculadora el día 1, respaldo) en el canal `recordatorios`; respetar `respaldoRecordatorio` de V15.
- V14 Ajustes (hub) y barra inferior de navegación.
- Prueba en teléfono real: aviso de prueba, reinicio, app cerrada, permiso denegado (criterio de M6).
- Comprobar `POST_NOTIFICATIONS` en el manifiesto combinado. Etiqueta `v0.1.0`.
- Feriados reales y pendientes fiscales de `01`, sección 7.

## Qué se verificó y qué no
- Verificado: las 9 pruebas de `avisosForm` y las 6 de `notificaciones` pasan en Node 22 con un sustituto mínimo de Vitest.
- **No verificado**: `Notificaciones.svelte` y tipos (npm bloqueado en la sesión).

## Actualizar en el proyecto
- `03-vistas-y-flujos.md`: sustituir por el del zip.
- `04-modelo-de-datos.md`, sección 2 (Ajustes): la clave `avisosConfig` guarda `{ offsets, hour, minute }`.
- `05-plan-de-desarrollo.md`: M6 en curso; V14 y los recordatorios mensuales siguen pendientes.

## Pasos para aplicar (Termux)

```bash
cd ~/miapp && git pull
unzip -o ~/storage/downloads/m6-paso3d.zip
npm test
npx svelte-check
npm run build
```
`npm test`: 11 pruebas nuevas. Total esperado `422 passed` (411 + 11). Si `svelte-check` marca un error, pega el mensaje completo.

```bash
git add .
git commit -m "feat: add notice preferences and battery guide to notifications view (M6 step 3d)"
git push
```
Si usas el Project de claude.ai, sustituye ahí `03-vistas-y-flujos.md` y añade el registro 36.

## Cómo probar (en el navegador y en el APK)
1. Abre `#/ajustes/notificaciones`: debe verse "Cuándo avisar" con las cuatro casillas marcadas y la hora 09:00. El botón Guardar está desactivado.
2. Desmarca "3 días antes": el botón se activa. Desmarca todas: sale "Elige al menos un aviso." y el botón se desactiva.
3. Borra la hora: sale "Escribe una hora válida."
4. Cambia la hora a 18:00 y guarda: "Preferencias guardadas. Avisos programados: N." (en el navegador: "solo funcionan en la app instalada"). Recarga: la hora sigue en 18:00.
5. En el APK: "Avisos programados" cambia según los días elegidos. Con solo "El mismo día" debe haber menos avisos que con los cuatro.
6. Toca "Si no llegan los avisos": se despliegan los 4 pasos y el consejo.
7. Modo avión: todo sigue funcionando.
