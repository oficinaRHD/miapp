# Registro de sesión 03: hito M2 (datos y respaldo)

Fecha: 22/10/2026

## Qué se creó en esta sesión

Capa de datos, servicio de archivos y un panel temporal de prueba. Una dependencia nueva, solo de desarrollo: `fake-indexeddb`.

| Ruta | Contenido |
|---|---|
| `src/data/version.ts` | `SCHEMA_VERSION = 1`, `BACKUP_APP`, `DB_NAME` |
| `src/data/models.ts` | Tipos guardados (`Perfil`, `Obligacion`, `Movimiento`, `Categoria`, `Adjunto`...). Importa `ISODate`, `Centavos`, `PeriodoTipo`, `OrigenFecha` de `src/domain/types.ts`; define aquí `ISODateTime` |
| `src/data/db.ts` | `class AppDB extends Dexie`, `this.version(1)` con el esquema de `04`. El constructor acepta `(name, options)` solo para pruebas |
| `src/data/util.ts` | `nowISO` (hora local con desfase), `todayISO`, `newId` (UUID), `isISODate`, `isISODateTime`, `isNonNegativeInt`, `backupFileName` |
| `src/data/errors.ts` | `DataError` (códigos `invalid`, `not-found`, `conflict`, `integrity`) y `ValidationError` |
| `src/data/schema.ts` | `parsePerfil`, `parseMovimiento`, `parseObligacion`... Única fuente de las reglas de integridad (`04`, sección 8). Descartan campos desconocidos |
| `src/data/seed.ts` | 11 categorías con id fijo (`cat-ing-ventas`...). `ensureSeed(db)` inserta solo las que faltan |
| `src/data/backupSchema.ts` | Formato del respaldo, `validateBackup`, `parseBackupText`, `serializeBackup`, `stripPersonal`, `BackupError` y migraciones (vacías) |
| `src/data/backup.ts` | `exportBackup`, `importBackup`, `wipeAllData`, `countBackup` |
| `src/data/repositories/` | `perfil`, `ajustes`, `categorias`, `movimientos`, `obligaciones`, `adjuntos`, `feriados`, y `index.ts` con `createRepositories(db)` |
| `src/data/index.ts` | Instancia única `db` y `repos` para la app |
| `src/data/test-helpers.ts` | Base de datos aislada por prueba (fake-indexeddb) |
| `src/services/files.ts` | Filesystem + Share: `shareTextFile`, `pickTextFile`, copias internas (`saveInternalBackup`, `listInternalBackups`, `readInternalBackup`) |
| `src/services/backupService.ts` | `createAndShareBackup`, `restoreBackupFromText`, `restoreBackupFromPicker` |
| `src/dev/devPanel.ts` | Panel **temporal** con el botón "M2". Se borra al empezar M3 |
| `*.test.ts` (4 archivos) | 61 pruebas nuevas |

## Detalles que conviene recordar

- **Nada de lógica fiscal aquí.** Solo validación de formato y reglas de integridad.
- **Dinero**: enteros no negativos (acepta 0). Decimales y negativos se rechazan con `DataError('invalid')`.
- **Respaldo**:
  - Se valida todo antes de tocar la base: `app`, `schemaVersion` (rechaza versiones futuras), campos, fechas reales, ids únicos, `[tributoCodigo+periodoClave]` único, movimientos con categoría existente y del mismo tipo, nóminas con empleado existente.
  - Importar **reemplaza todo** en una sola transacción y vacía `recordatorios` (hay que reprogramar notificaciones en M6).
  - Antes de reemplazar se guarda una copia interna `auto-previo-<fecha>.json` en `Directory.Data/backups/` (se conservan 5). Si esa copia falla, la importación se cancela.
  - Sin datos personales por defecto: `rc05` y `nit` no viajan.
  - `perfil` puede ser `null` (aún sin onboarding).
  - Los adjuntos viajan solo como metadatos (se pierde el `blob`; en v0.1 no hay adjuntos reales).
- **Archivos**: en el APK se escribe en `Directory.Cache/exports/` y se abre la hoja de compartir de Android; en el navegador se descarga el archivo. Para importar se usa `<input type="file">`, que funciona igual en el navegador y en el WebView de Capacitor.
- **Obligaciones**: `addDrafts` es idempotente por sí mismo (no usa `onlyNew`): salta los borradores cuya clave ya existe, así nunca pisa una obligación pagada. `setDueDate` cambia fechas pendientes (vector o manual) y rechaza las pagadas.
- **Categorías**: las del sistema no se borran ni cambian de nombre (sí de color e icono). Borrar una con movimientos exige reasignarlos a otra del mismo tipo.
- **Esquema**: `SCHEMA_VERSION` (`version.ts`) y `this.version(n)` (`db.ts`) deben ir juntos; una prueba comprueba que coinciden.

## Cambios respecto al plan y al modelo

- Los repositorios son funciones que reciben la base (`perfilRepo(db)`, `createRepositories(db)`), no objetos globales, para poder probarlos con una base falsa. `src/data/index.ts` crea la instancia de la app.
  **Actualizar**: `02-arquitectura-y-stack.md`, sección 3 (estructura de `src/data/`: quitar `migrations.ts`, que no se creó; las migraciones de Dexie van en `db.ts` y las del respaldo en `backupSchema.ts`; añadir `models.ts`, `schema.ts`, `backupSchema.ts`, `util.ts`, `errors.ts`, `version.ts`).
- `ISODateTime` se define en `src/data/models.ts` (no existe en `domain/types.ts`).
  **Actualizar**: `04-modelo-de-datos.md`, sección 2 (aclarar de dónde vienen los tipos primitivos).
- `addDrafts` no usa `onlyNew` de `schedule.ts` (ver arriba).
  **Actualizar**: `04-modelo-de-datos.md`, sección 5 (la idempotencia la garantiza el repositorio y el índice único).
- Formato del respaldo: `perfil` puede ser `null`; los adjuntos se exportan como metadatos.
  **Actualizar**: `04-modelo-de-datos.md`, sección 7.
- Pruebas de datos con `fake-indexeddb` (solo desarrollo).
  **Actualizar**: `02-arquitectura-y-stack.md`, sección 1 (fila Pruebas) y `05-plan-de-desarrollo.md` (M2).
- No hay repositorios de `recordatorios`, `empleados` ni `nominas`: se crean en M6 y v0.3. Las tablas existen y `empleados` y `nominas` ya viajan en el respaldo.

## Dependencia nueva: fake-indexeddb (solo desarrollo)

- Versión vista: 6.2.5. JavaScript puro, sin dependencias, Node >= 18, sin scripts de instalación (el `prepare` con `husky` es del repositorio del paquete, no se ejecuta al instalarlo).
- Tamaño: unos 258 kB de instalación según Snyk, pero ese dato es de la 6.0.0. No pude medir la 6.2.5 (npm bloqueado en el entorno de la sesión). Para confirmarlo en Termux: `npm view fake-indexeddb version dist.unpackedSize`.
- Termux: sin binarios nativos, no hay riesgo en ARM64.
- Capacitor: no afecta. Solo lo usa Vitest en Node; no entra en el bundle ni en el APK.

## Qué se verificó y qué no

- Verificado en la sesión: los 28 archivos `.ts` pasan `tsc` en modo estricto (con `noUnusedLocals`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `erasableSyntaxOnly`), usando tipos simulados de Dexie y Capacitor. Las 28 pruebas de `util.test.ts` y `backupSchema.test.ts` (validación del respaldo) se ejecutaron y pasan.
- **No verificado**: las 33 pruebas que usan Dexie con fake-indexeddb (`repositories.test.ts` y `backup.test.ts`), el panel y los servicios de archivos. En el entorno de la sesión npm estaba bloqueado y no se pudo instalar Dexie, Vitest ni Capacitor. Hay que ejecutarlas en Termux (paso 4).

## Pendiente

- Al restaurar un respaldo sin datos personales, el perfil se reemplaza completo y se pierden `rc05` y `nit` locales. Decidir en M3 si conviene conservarlos.
- Probar que la hoja de compartir de Android acepta el archivo de `Directory.Cache` y que el selector de archivos abre en el APK (criterio de M2).
- Reprogramar notificaciones tras importar (M6).
- Respaldo en ZIP con adjuntos (v0.2).

## Pasos para aplicar (Termux)

**1. Descargar `m2-datos.zip` del chat** y preparar:
```bash
cd ~/miapp
git pull
```

**2. Comprobar `fake-indexeddb` antes de instalarla** (tamaño real) e instalarla:
```bash
npm view fake-indexeddb version dist.unpackedSize
npm i -D fake-indexeddb
npm ls fake-indexeddb
```

**3. Descomprimir sobre el proyecto**:
```bash
unzip -o ~/storage/downloads/m2-datos.zip
ls src/data src/data/repositories src/services src/dev docs
```

**4. Activar el panel temporal.** En `src/main.ts` añade estas dos líneas (la primera arriba con los otros `import`, la segunda al final):
```ts
import { mountDevPanel } from './dev/devPanel';
```
```ts
mountDevPanel();
```

**5. Pruebas, tipos y build**
```bash
npm test
npx svelte-check
npm run build
```
`npm test` debe terminar con `Tests 126 passed (126)` (65 de M1 y 61 de M2). Si falla alguna, pega el bloque `FAIL` completo.

**6. Subir a GitHub** (incluye `package.json` y `package-lock.json`):
```bash
git add .
git status
git commit -m "feat: add M2 data layer (Dexie schema, repositories, seed, backup, file service)"
git push
```

## Cómo probar que el hito está hecho

**En el navegador** (`npm run dev -- --host`, abre `http://localhost:5173`):
1. Pulsa el botón **M2** (abajo a la derecha) y luego **1. Crear datos de prueba**. Anota la `huella` y los conteos (5 movimientos, 3 obligaciones, 11 categorías).
2. **2. Exportar respaldo**: se descarga un `.json`.
3. **3. Borrar todo**: los conteos pasan a 0.
4. **4. Importar respaldo**: elige el `.json`. Los conteos y la `huella` deben ser los mismos del paso 1.

**En el APK** (descarga el artefacto del workflow e instálalo encima):
1. Repite los 4 pasos. En el paso 2 debe abrirse la hoja de compartir de Android (guárdalo en Archivos o envíalo a ti por WhatsApp); en el paso 4 debe abrirse el selector de archivos.
2. Tras importar, el panel muestra `respaldo previo: auto-previo-....json`.
3. Cierra la app del todo, ábrela y pulsa **0. Ver estado**: los datos siguen ahí.

La `huella` ignora `rc05` y `nit`, porque un respaldo normal no los incluye.

## Siguiente sesión

Hito M3: onboarding y perfil (V01 y V17) con la generación de obligaciones del año (`schedule.ts` + `addDrafts`) y edición de fechas del vector. Al empezar, borrar `src/dev/devPanel.ts` y sus dos líneas en `main.ts`.
