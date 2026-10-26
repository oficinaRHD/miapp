# Arquitectura y stack

## 1. Stack propuesto

| Capa | Elección | Motivo |
|---|---|---|
| Empaquetado | Capacitor (Android) | Reutiliza el código web; plugins para notificaciones y archivos |
| Build web | Vite + TypeScript | Rápido y funciona en Node dentro de Termux |
| Interfaz | Svelte 5 | Poco código, bundle pequeño, buena opción para 17 vistas |
| Datos locales | Dexie (IndexedDB) | Funciona igual en el navegador del teléfono (pruebas) y dentro de la app |
| Gráficos | Chart.js (solo lo necesario) | Incluido en el bundle, sin CDN |
| Pruebas | Vitest (y `fake-indexeddb`, solo desarrollo) | Motor de reglas, lógica de las vistas y repositorios con una base falsa; no entra en el APK |
| CI | GitHub Actions | Compila el APK en la nube |

**Versiones de Capacitor**: según la documentación consultada, Capacitor 8 exige Node 22 o superior y JDK 21 para compilar Android. Comprobar con `node -v` en Termux antes de empezar y confirmar en la documentación oficial de Capacitor, porque estas exigencias cambian entre versiones mayores.

**Plan B si Vite o Svelte dan problemas en Termux** (binarios nativos de `esbuild` o `rollup` en ARM64): instalar `esbuild` con `pkg install esbuild` y exportar `ESBUILD_BINARY_PATH`; si persiste, cambiar a TypeScript o JavaScript con módulos ES y un pequeño enrutador propio, sin framework. La estructura de carpetas, el dominio y los datos no cambian.

**Por qué Dexie y no SQLite al inicio**: se puede probar todo en el navegador del teléfono con `localhost`, sin plugin nativo. Todo el acceso a datos pasa por repositorios (`src/data/repositories/`); si más adelante hace falta SQLite, solo se reescriben esos archivos.

## 2. Capas

```
Vistas (Svelte)  ->  Stores  ->  Servicios  ->  Repositorios  ->  Dexie
                                     |
                                     v
                                 Dominio (funciones puras, sin UI ni DB)
```

- **Dominio** (`src/domain/`): dinero, fechas, días hábiles, catálogo de tributos, reglas y generación de obligaciones. No importa nada de Svelte, Dexie ni Capacitor. Se prueba con Vitest.
- **Datos** (`src/data/`): esquema, repositorios, semillas, respaldo y validación. Las migraciones de Dexie van en `db.ts` y las del respaldo en `backupSchema.ts`.
- **Servicios** (`src/services/`): notificaciones, archivos, compartir, portapapeles, ciclo de vida de la app. Son la única capa que habla con plugins de Capacitor y con las API del navegador.
- **Stores** (`src/stores/`): acceso a datos y estado reactivo que las vistas consumen. Los repositorios son funciones que reciben la base (`obligacionesRepo(db)`), no objetos globales, para probarlos con una base falsa; `src/data/index.ts` crea la instancia de la app.
- **Lógica de las vistas** (`src/app/`): funciones puras con pruebas (formularios, filtros, totales, rutas). Combinan las reglas del dominio; no llevan reglas fiscales propias.
- **Vistas y componentes**: solo presentación y eventos.

## 3. Estructura de carpetas

```
asistente-tcp/
├─ .github/workflows/build-apk.yml
├─ android/                      (generada por Capacitor, se versiona sin carpetas build)
├─ docs/                         (estos archivos .md)
├─ public/                       (iconos, imágenes estáticas)
├─ src/
│  ├─ main.ts
│  ├─ App.svelte                 (arranque, guardián y rutas; temporal hasta tener la barra inferior)
│  ├─ app/                       (lógica de las vistas, pura y con pruebas)
│  │  ├─ routes.ts               (rutas con hash: #/calendario; funciones puras)
│  │  ├─ router.svelte.ts        (estado reactivo del enrutador; el nombre .svelte.ts es obligatorio)
│  │  ├─ guard.ts                (guardián de onboarding)
│  │  ├─ bootstrap.ts            (arranque: semillas y perfil)
│  │  ├─ inicio.ts, inicioMes.ts (V02)
│  │  ├─ calendario.ts           (V03)
│  │  ├─ obligacionesList.ts, editDates.ts, nextYear.ts (V04)
│  │  ├─ pago.ts, ficha.ts, detalleEdit.ts (V05)
│  │  ├─ registro.ts, registroMonth.ts, registroRoutes.ts, today.ts (V06 y V07)
│  │  ├─ calculadora.ts, calculadoraLink.ts (V08)
│  │  ├─ onboarding.ts, yearDates.ts, perfilForm.ts (V01 y V17)
│  │  ├─ format.ts, notificationPermission.ts
│  │  ├─ nav.ts                  (barra inferior; pendiente)
│  │  └─ theme.css               (variables de color, tipografía, modo oscuro)
│  ├─ domain/
│  │  ├─ types.ts                (Centavos, ISODate, PeriodoTipo, OrigenFecha)
│  │  ├─ money.ts                (centavos, formato CUP, redondeo)
│  │  ├─ dates.ts                (YYYY-MM-DD, sumar días, meses)
│  │  ├─ businessDays.ts         (días hábiles con feriados)
│  │  ├─ tributos.catalog.ts     (catálogo de 01-reglas)
│  │  ├─ schedule.ts             (genera obligaciones de un año)
│  │  ├─ rules/
│  │  │  ├─ ventas.ts            (0114022)
│  │  │  ├─ isipMensual.ts       (0510122)
│  │  │  ├─ descuento.ts         (3 % por canal electrónico)
│  │  │  ├─ isipAnual.ts         (0530222, v0.2)
│  │  │  ├─ retenciones.ts       (0520522, v0.3)
│  │  │  ├─ fuerzaTrabajo.ts     (0610322, v0.3)
│  │  │  ├─ seguridadSocial.ts   (0810132 y 0820232, v0.3)
│  │  │  └─ mora.ts              (1060122)
│  │  └─ *.test.ts
│  ├─ data/
│  │  ├─ version.ts              (SCHEMA_VERSION, nombre de la base)
│  │  ├─ models.ts               (tipos guardados; define ISODateTime)
│  │  ├─ db.ts                   (esquema Dexie y versiones, con sus migraciones)
│  │  ├─ schema.ts               (parsers y reglas de integridad)
│  │  ├─ errors.ts, util.ts
│  │  ├─ seed.ts                 (categorías iniciales; el catálogo de tributos vive en domain)
│  │  ├─ backupSchema.ts         (formato, validación y migraciones del respaldo)
│  │  ├─ backup.ts               (exportar e importar JSON)
│  │  ├─ index.ts                (instancia única db y repos)
│  │  ├─ test-helpers.ts         (base aislada por prueba)
│  │  └─ repositories/           (perfil, ajustes, categorias, movimientos, obligaciones, adjuntos, feriados; recordatorios en M6, empleados y nominas en v0.3)
│  ├─ services/
│  │  ├─ files.ts                (Filesystem + Share, copias internas)
│  │  ├─ backupService.ts        (crear, compartir y restaurar respaldos)
│  │  ├─ clipboard.ts            (navigator.clipboard con respaldo; sin plugin)
│  │  ├─ share.ts                (compartir ficha de pago)
│  │  ├─ notifications.ts        (M6)
│  │  ├─ calendarExport.ts       (.ics, v0.3)
│  │  └─ appLifecycle.ts         (M6)
│  ├─ stores/                    (perfil.svelte.ts, obligaciones.ts, movimientos.ts, ajustes.ts)
│  ├─ views/                     (una carpeta por vista, ver 03)
│  ├─ components/                (Tarjeta, Chip, MontoInput, FechaInput, EstadoVacio...; hoy cada vista lleva los suyos)
│  └─ i18n/                      (textos en español, un archivo por vista: es.ts, inicio.ts, calendario.ts...)
├─ capacitor.config.ts
├─ index.html
├─ package.json
├─ tsconfig.json
└─ vite.config.ts
```

## 4. Plugins de Capacitor

| Plugin | Uso | Versión |
|---|---|---|
| `@capacitor/local-notifications` | Avisos de vencimientos y recordatorios | v0.1 |
| `@capacitor/app` | Botón atrás, detectar cuándo vuelve la app al primer plano para reprogramar | v0.1 |
| `@capacitor/filesystem` | Guardar respaldos y adjuntos | v0.1 |
| `@capacitor/share` | Enviar respaldos y fichas de pago por WhatsApp, correo, etc. | v0.1 |
| `@capacitor/clipboard` | Copiar RC-05, código de tributo, código de barras, importe. Hoy se usa `navigator.clipboard` con respaldo (`services/clipboard.ts`); se cambia a este plugin si falla en el APK | v0.1 |
| `@capacitor/status-bar`, `@capacitor/splash-screen` | Aspecto | v0.1 |
| `@capacitor/preferences` | Solo banderas mínimas de arranque (onboarding hecho) | v0.1 |
| Plugin de biometría de la comunidad | Bloqueo con huella | v0.3 |
| Plugin de calendario de la comunidad | Crear eventos en el calendario del teléfono | v0.3 (opcional) |

Los plugins de la comunidad pueden tardar en soportar la última versión mayor de Capacitor: comprobar compatibilidad antes de adoptarlos.

## 5. Notificaciones

**Canales de Android**
- `vencimientos` (importancia alta): avisos de pagos.
- `recordatorios` (importancia normal): registrar ingresos, cierre de mes, declaración jurada.

**Estrategia de programación**
- Para cada obligación pendiente: avisos a **7, 3 y 1 día antes** y **el mismo día**, a las 09:00 hora local (configurable).
- Identificadores deterministas a partir de `obligacionId` y el desfase, para poder cancelar y reemplazar sin duplicados.
- Se programa solo una **ventana de 60 días** hacia adelante y se recalcula: al abrir la app, al volver al primer plano, al marcar una obligación pagada, al cambiar fechas y al cambiar ajustes.
- Al marcar una obligación como pagada se cancelan sus avisos pendientes.
- Tocar una notificación abre la ficha de esa obligación (vista V05).
- Recordatorios mensuales: registrar movimientos (último día del mes, 18:00) y revisar la calculadora (día 1).

**Permisos y límites de Android**
- Android 13 o superior exige permiso de notificaciones en tiempo de ejecución: pedirlo en el onboarding, con una explicación clara, y mostrar un aviso permanente si se deniega.
- No usar alarmas exactas: los avisos pueden retrasarse unos minutos, algo aceptable aquí, y se evita un permiso sensible.
- Algunos fabricantes cierran apps en segundo plano y pierden avisos: la vista de Notificaciones incluye una guía para quitar la optimización de batería de la app.
- Verificar en un teléfono real que los avisos programados sobreviven a un reinicio.

## 6. Calendario

- **v0.1**: calendario dentro de la app (vista V03), sin permisos.
- **v0.3**: exportar vencimientos como archivo `.ics` y compartirlo (sin permisos de calendario). Integración directa con el calendario del teléfono solo si el plugin es compatible y el usuario la pide, porque implica permisos de lectura y escritura.

## 7. Seguridad y privacidad

- Todo se guarda **solo en el teléfono**. Sin cuentas, sin servidores, sin analítica.
- No hacer llamadas de red. Al final del desarrollo, probar si se puede quitar el permiso `INTERNET` del manifiesto.
- Política de contenido (CSP) en `index.html` limitada a recursos propios.
- Identificadores personales (RC-05, NIT) son opcionales, se guardan localmente y **no se incluyen en el respaldo salvo que el usuario lo elija**.
- `android:allowBackup="false"` por defecto; el respaldo propio de la app es la vía soportada. Revisar esta decisión si se quiere restauración automática al cambiar de teléfono.
- v0.2: bloqueo con PIN. v0.3: biometría.

## 8. Respaldo

- Exportar un archivo `.json` con versión de esquema, guardarlo con Filesystem y ofrecer compartirlo.
- Importar valida la versión y ejecuta migraciones; antes de reemplazar los datos guarda una copia interna `auto-previo-<fecha>.json` en `Directory.Data/backups/` (se conservan 5); si esa copia falla, la importación se cancela.
- Recordatorio mensual de respaldo, activable en ajustes.
- Formato en `04-modelo-de-datos.md`.

## 9. Pruebas

- **Dominio**: Vitest con casos tomados de `01-reglas-fiscales-tcp.md` (calendario real, escalas, mora). Script `"test": "vitest run --passWithNoTests"`. Las pruebas de datos usan `fake-indexeddb`; la lógica de `src/app/` también se prueba con Vitest.
- **Manual en el teléfono**: desarrollo con `localhost` en el navegador; APK de CI para probar notificaciones, archivos y reinicio.
- **Lista de revisión por hito**: instalar el APK nuevo **sobre** el anterior y comprobar que los datos siguen ahí.

## 10. Calidad y rendimiento (objetivos)

- Arranque en frío en menos de 2 segundos en un teléfono de gama media.
- APK de depuración por debajo de 20 MB.
- Funciona en modo avión de principio a fin.
- Textos de interfaz solo en `src/i18n/` (un archivo por vista); importes siempre con formato `1,234.50 CUP`.
- Accesibilidad básica: botones de al menos 44 px, contraste suficiente, modo oscuro.

## 11. Compilación y versiones

- CI: ver `build-apk.yml`. Cada `push` a `main` genera un APK de depuración descargable; una etiqueta `v*` crea además una publicación en GitHub Releases.
- Versionado semántico (`0.1.0`, `0.1.1`...). Ajustar `versionName` y `versionCode` en `android/app/build.gradle` en cada publicación.
- APK de release firmado: en v0.3. La llave (`keystore`) **nunca** se sube al repositorio; irá en secretos de GitHub y con copia segura aparte.
