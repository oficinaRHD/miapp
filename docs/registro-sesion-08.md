# Registro de sesión 08: M3 paso 3b (V01 Onboarding, paso 4: notificaciones)

## Creado / modificado
- `src/app/notificationPermission.ts` (+ `.test.ts`, 6 pruebas): tipo `NotificationPermissionState` (`granted` | `denied` | `unknown`), `mapPermission`, `isPermissionState`, clave `SETTING_NOTIFICATION_PERMISSION = 'notificacionesPermiso'`.
- `src/services/notifications.ts`: **nuevo**, solo permiso (`checkNotificationPermission`, `requestNotificationPermission`) con `@capacitor/local-notifications`. M6 lo ampliará con programación y canales. Sin dependencias nuevas.
- `src/stores/ajustes.ts`: **nuevo**, `loadNotificationPermission`, `saveNotificationPermission` (usa `ajustesRepo(db)`).
- `src/app/onboarding.ts` (+ `.test.ts`, ahora 31 pruebas): añade el paso `notificaciones` y el campo `notificationPermission` del borrador.
- `src/i18n/onboarding.ts` y `src/views/onboarding/Onboarding.svelte`: paso 4.

## Decisiones
- El permiso se guarda en `ajustes` con la clave `notificacionesPermiso`, no en el perfil.
- Denegar o no decidir no bloquea el paso (`03`, V01). El aviso en Inicio llega en M4 y leerá esta clave.
- El estado se guarda junto con el perfil al pulsar Continuar en el último paso.
- `prompt` y `prompt-with-rationale` se guardan como `unknown`.
- V16 debe volver a consultar el permiso real, no fiarse solo de lo guardado.

## Pendientes
- Paso 5 (fechas del año): "Usar patrón" o "Copiar del vector", `generateObligations` + `obligaciones.addDrafts`, y poner `onboardingCompleto: true` al terminar.
- Quitar el botón provisional y las claves `dev*` de `es.ts`.
- M6: tras restaurar un respaldo, volver a llamar a `loadPerfil()`.
- Comprobar en el APK que `POST_NOTIFICATIONS` está en el manifiesto (Android 13+).
