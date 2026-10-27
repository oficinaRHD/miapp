# Registro de sesión 37: M6 paso 3e (recordatorios mensuales)

Fecha: 27/10/2026

## Creado / modificado
Sin dependencias nuevas, sin lógica fiscal.

| Ruta | Contenido |
|---|---|
| `src/app/recordatorios.ts` | Lógica pura: `planReminders(nowLocal, flags)`, `reminderId`, `parseReminderSettings`, `setReminder`, constantes (`SETTING_RECORDATORIOS`, `REMINDER_TIME`, `BACKUP_REMINDER_DAY`) |
| `src/app/recordatorios.test.ts` | 11 pruebas (ids, orden, fin de año, febrero bisiesto, hora ya pasada, tipos desactivados, rutas, ajustes) |
| `src/services/notifications.ts` | **Reemplazado**: añade `KIND_REMINDER`, `syncReminders`, `countPendingReminders`; `onNoticeTapped` ahora entrega una ruta (obligación o la del recordatorio) |
| `src/stores/avisos.ts` | **Reemplazado**: `loadReminderSettings`, `saveReminderSettings`; `rescheduleNotices` sincroniza también los recordatorios (el de respaldo sigue `respaldoRecordatorio`) |
| `src/i18n/notificaciones.ts` y `.test.ts` | **Reemplazados**: textos de recordatorios (+2 pruebas) |
| `src/views/notificaciones/Notificaciones.svelte` | **Reemplazado**: tarjeta "Recordatorios del mes" con dos casillas (registro, calculadora), enlace a Respaldo y contador |
| `src/views/respaldo/Respaldo.svelte` | **Reemplazado**: al cambiar la casilla del recordatorio de respaldo reprograma |
| `src/App.svelte` | **Reemplazado**: el toque en un aviso navega a la ruta recibida |
| `docs/03-vistas-y-flujos.md` | **Reemplazado**: V16 al día |

## Decisiones
- Fechas: registro el último día del mes 18:00 (de `02`); calculadora día 1 a las 09:00 y respaldo día 15 a las 10:00 son **elección de la app** (en `02` no hay hora ni día para ellos). Cámbialos en `REMINDER_TIME` y `BACKUP_REMINDER_DAY` si quieres otros.
- Ids negativos (`-(año*1000 + mes*10 + tipo)`): no chocan con los de vencimientos, que ocupan todo el rango positivo. **No verificado en Android**.
- Los recordatorios se distinguen por `extra.kind = 'recordatorio'`; la sincronización de vencimientos no los cancela y viceversa.
- Ventana de 60 días; se omiten los que ya pasaron.
- Cambiar una casilla guarda y reprograma al momento.

## Pendiente
- V14 Ajustes (hub) y barra inferior.
- Prueba en teléfono real; `POST_NOTIFICATIONS` en el manifiesto; etiqueta `v0.1.0`.
- Documentos: `04` (claves `avisosConfig`, `recordatoriosMensuales`, `respaldoRecordatorio`, `ultimoRespaldo`, `respaldoIncluirPersonales`), `05` (M6 casi hecho), `02` (nuevos archivos).

## Qué se verificó y qué no
- Verificado: las 11 pruebas de `recordatorios` pasan en Node 22 con sustituto de Vitest.
- **No verificado**: tipos y vistas (`svelte-check`), ids negativos y llegada real.

## Actualizar en el proyecto
- `03-vistas-y-flujos.md`: sustituir por el del zip.
- `04-modelo-de-datos.md`, Ajustes: clave `recordatoriosMensuales` = `{ registro, calculadora }`.

## Pasos para aplicar (Termux)
```bash
cd ~/miapp && git pull
unzip -o ~/storage/downloads/m6-paso3e.zip
npm test
npx svelte-check
npm run build
```
`npm test`: 13 pruebas nuevas (11 + 2). Total esperado `435 passed`. Si `svelte-check` marca error, pega el mensaje.

```bash
git add .
git commit -m "feat: add monthly reminders to notifications (M6 step 3e)"
git push
```

## Cómo probar
1. `#/ajustes/notificaciones`: sale "Recordatorios del mes" con dos casillas marcadas.
2. En el APK con permiso: "recordatorios en espera" suma hasta 6 (con respaldo activo). Desmarca "Último día del mes": baja el número.
3. En Respaldo desmarca el recordatorio: vuelve a Notificaciones y bajan 2.
4. En el navegador: aparece "solo funcionan en la app instalada" y 0 en espera.
5. Para probar la llegada: cambia la fecha del teléfono al día anterior al último del mes, abre la app y espera a las 18:00 (o usa la prueba de 10 segundos para confirmar el canal).
