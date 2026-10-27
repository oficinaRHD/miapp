# Registro de sesión 34: M6 paso 3b (programar avisos y V16 mínima)

Fecha: 26/10/2026

## Creado / modificado
Sin dependencias nuevas (usa `@capacitor/local-notifications` y `@capacitor/app`, ya instalados desde M0). Sin lógica fiscal. Se leyeron `notifications.ts` y las firmas de `stores/obligaciones.ts`.

| Ruta | Contenido |
|---|---|
| `src/services/notifications.ts` | **Reemplazado**: mantiene `checkNotificationPermission` y `requestNotificationPermission`; añade `isNotificationsSupported`, `syncDeadlineNotices(plan)`, `countPendingNotices`, `sendTestNotice`, `onNoticeTapped`, canales `vencimientos` (importancia 4) y `recordatorios` (3) |
| `src/services/appLifecycle.ts` | **Nuevo**: `onAppResume(cb)` (en el navegador usa `visibilitychange`) |
| `src/stores/avisos.ts` | **Nuevo**: `loadAvisosSettings`, `saveAvisosSettings`, `rescheduleNotices()` (nunca lanza; las llamadas se encolan) |
| `src/i18n/notificaciones.ts` | Textos de V16, `resultText`, `testText` |
| `src/i18n/notificaciones.test.ts` | 4 pruebas |
| `src/views/notificaciones/Notificaciones.svelte` | V16 primera versión: permiso, avisos en espera, "Reprogramar avisos ahora", "Enviar notificación de prueba", nota de batería |
| `src/App.svelte` | **Reemplazado**: ruta `/ajustes/notificaciones`; reprograma al terminar el onboarding o al abrir la app y al volver al primer plano; tocar un aviso abre `#/obligaciones/:id` |

## Cómo funciona
- `rescheduleNotices()`: lee las obligaciones pendientes y los ajustes, calcula el plan (`planNotices`, sesión 33) y lo sincroniza: cancela los avisos propios pendientes y programa el plan.
- Solo programa si hay permiso y la app está instalada (no en el navegador).
- Sin tabla `recordatorios`: se consulta `getPending()` y se cancela por `extra.kind` (un pendiente sin `extra` también se considera propio). Los avisos llevan `extra: { kind: 'vencimiento', obligacionId, offset }`.
- Avisos **inexactos** a propósito (`02`, sección 5): sin permiso de alarmas exactas; pueden llegar unos minutos tarde. Se usa `allowWhileIdle`.
- La hora de cada aviso se interpreta en la zona horaria del teléfono.
- Aviso de prueba: id reservado `2147483647`, que `noticeId` nunca produce.

## Decisiones y cosas a confirmar
- **`isExactNotification: false`**: la documentación de la versión 8 del plugin dice que desde la 8.3.0 el valor por defecto es exacto y puede abrir la pantalla "Alarmas y recordatorios". Se desactiva en cada aviso; las versiones anteriores lo ignoran. Confirma tu versión: `npm ls @capacitor/local-notifications`.
- Tras reiniciar el teléfono, la documentación no dice si los avisos se conservan. Es parte de la prueba de M6 (abajo); si no se conservan, bastará abrir la app.
- Al restaurar un respaldo, borrar los datos, pagar, omitir, reabrir o cambiar fechas, los avisos **aún no se reprograman solos** hasta la próxima vez que se abra la app. Se engancha en el paso 3c (falta ver el código de `stores/obligaciones.ts`).
- `V16` guarda el permiso real en Ajustes (`notificacionesPermiso`) cada vez que se abre.

## Pendiente
- Paso 3c: reprogramar tras pagar, omitir, reabrir, cambiar fechas, restaurar y borrar (V15); y preferencias de V16 (días antes, hora) con la guía de batería completa.
- Recordatorios mensuales (registrar movimientos, calculadora, respaldo) en el canal `recordatorios`.
- Comprobar en el APK que `POST_NOTIFICATIONS` quede en el manifiesto combinado (Android 13+).
- V14 Ajustes (hub). Feriados reales y pendientes fiscales de `01`, sección 7.

## Qué se verificó y qué no
- Verificado: las 4 pruebas de textos pasan en Node 22 con un sustituto mínimo de Vitest.
- **No verificado**: nada del plugin ni de Svelte (npm bloqueado en la sesión). La API usada (`schedule`, `getPending`, `cancel`, `createChannel`, `addListener`) sigue la documentación de la versión 8. Hay que ejecutar `npx svelte-check` y probar en el APK.

## Actualizar en el proyecto
- `02-arquitectura-y-stack.md`, sección 3: `services/notifications.ts` y `services/appLifecycle.ts` ya existen; `stores/` añade `avisos.ts`; `app/` añade `avisos.ts`. Sección 5: los avisos son inexactos y se cancelan por `extra.kind` (no hay tabla `recordatorios` en uso).
- `03-vistas-y-flujos.md`, V16: "Primera versión hecha: permiso, reprogramar y notificación de prueba. Pendiente: preferencias y guía de batería".
- `04-modelo-de-datos.md`, sección 2 (Ajustes): clave `avisosConfig`; la tabla `recordatorios` no se usa de momento.

## Pasos para aplicar (Termux)

```bash
cd ~/miapp && git pull
npm ls @capacitor/local-notifications @capacitor/app
unzip -o ~/storage/downloads/m6-paso3b.zip
npm test
npx svelte-check
npm run build
```
`npm test`: 4 pruebas nuevas. Total esperado `411 passed` (407 + 4). Si `npm ls` muestra `(empty)` en alguno, avísame antes de seguir. Si `svelte-check` marca un error, pega el mensaje completo (lo más probable es un tipo del plugin).

```bash
git add .
git commit -m "feat: schedule deadline notices and add notifications view (M6 step 3b)"
git push
```

## Cómo probar (en el APK; en el navegador solo se ve la pantalla)
1. Espera el workflow en verde, instala el APK encima y abre `#/ajustes/notificaciones` (toca `notificaciones` abajo).
2. Si dice "Sin permiso todavía", toca **Permitir notificaciones** y acepta el diálogo de Android.
3. Toca **Enviar notificación de prueba**, cierra la app y espera unos 10 segundos: debe llegar "Notificación de prueba: los avisos funcionan."
4. Abre la app: **Avisos programados** debe mostrar un número mayor que 0 (si tienes obligaciones pendientes en los próximos 60 días). Toca **Reprogramar avisos ahora**: "Avisos programados: N."
5. Edita la fecha de una obligación a mañana (V04 > "Editar fechas del año") y toca **Reprogramar avisos ahora**: el número cambia.
6. Reinicia el teléfono sin abrir la app y mira el siguiente aviso de prueba (envía uno con 10 s, reinicia antes de que llegue es difícil; mejor comprueba que el contador de avisos en espera sigue igual al abrir la app tras reiniciar).
7. Bloquea el permiso desde Ajustes de Android y abre V16: debe decir "Bloqueadas..." y Inicio debe mostrar la alerta de permiso.
