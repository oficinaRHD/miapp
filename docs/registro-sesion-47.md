# Registro de sesión 47: M6 paso 6a (permiso POST_NOTIFICATIONS)

Fecha: 28/10/2026

## Contexto
Desde Android 13, una app solo puede mostrar el diálogo de permiso de notificaciones si declara `POST_NOTIFICATIONS` en su manifiesto. La [documentación del plugin](https://capacitorjs.com/docs/apis/local-notifications) pide llamar a `checkPermissions()` y `requestPermissions()` (la app ya lo hace) pero no dice si el plugin declara el permiso por su cuenta. No pude leer el manifiesto del plugin (npm y GitHub no están accesibles desde la sesión), así que se declara explícitamente en el manifiesto de la app. Declararlo de más no hace daño.

## Creado / modificado
| Ruta | Contenido |
|---|---|
| `scripts/add-notification-permission.mjs` | Añade `<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />` a `android/app/src/main/AndroidManifest.xml`, junto a los demás permisos. No hace nada si ya está; no toca el archivo si falla |

Sin código de la app, sin pruebas nuevas (`npm test` sigue en `474 passed`), sin dependencias.

## Decisiones
- No se añaden `SCHEDULE_EXACT_ALARM` ni `USE_EXACT_ALARM`: los avisos son inexactos a propósito (ver `02`, sección 5).
- No se añade `RECEIVE_BOOT_COMPLETED`: la documentación no dice si el plugin reprograma tras un reinicio. Se comprueba en el teléfono (abajo). La app ya reprograma todo al abrirla.
- La carpeta `android/` debe estar en git para que el cambio llegue al APK de GitHub Actions (así lo dice `02`).

## Pendiente
- Prueba en teléfono real (criterio de M6); si los avisos no sobreviven a un reinicio, anotarlo en la guía de V16 y decidir si se añade el receptor de arranque.
- `01`, `04` y `05` por actualizar.

## Qué se verificó y qué no
- Verificado: el script en copias de prueba de un manifiesto típico de Capacitor y en uno sin permisos (añade, no duplica, avisa si falta el archivo).
- **No verificado**: el efecto en el APK real (que aparezca el diálogo de permiso en Android 13 o superior).

## Actualizar en el proyecto
- `02-arquitectura-y-stack.md`, sección 5 (Permisos): "`POST_NOTIFICATIONS` declarado a mano en `AndroidManifest.xml` (`scripts/add-notification-permission.mjs`)".

## Pasos para aplicar (Termux)
```bash
cd ~/miapp && git pull
unzip -o ~/storage/downloads/m6-paso6a.zip
node scripts/add-notification-permission.mjs
git diff android
```
Debe salir `PATCHED` (o `ALREADY` si ya estaba) y el `git diff` debe mostrar una sola línea añadida en `AndroidManifest.xml`. Si dice `MISSING`, pega la salida de `ls android/app/src/main`.

```bash
git add .
git commit -m "chore: declare POST_NOTIFICATIONS permission in the Android manifest (M6 step 6a)"
git push
```

## Cómo probar (APK nuevo; si puedes, desinstala y reinstala para ver el diálogo de nuevo)
1. Android 13 o superior: en Notificaciones, "Permitir notificaciones" abre el diálogo del sistema. Acepta: el estado pasa a "Permitidas."
2. "Enviar notificación de prueba", cierra la app: llega en unos 10 segundos.
3. Ajustes de Android, Apps, Asistente TCP, Notificaciones: aparecen los canales "Vencimientos" y "Recordatorios".
4. Niega el permiso en el sistema: la app lo muestra como "Bloqueadas." y Inicio avisa; nada se rompe.
5. Reinicio: programa un aviso para dentro de 5 minutos, reinicia el teléfono sin abrir la app y comprueba si llega. Anota el resultado.
