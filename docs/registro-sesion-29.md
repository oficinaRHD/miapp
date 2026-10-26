# Registro de sesión 29: M6 paso 1a (V15 Respaldo, lógica y ajustes)

Fecha: 26/10/2026

## Creado / modificado
Sin dependencias nuevas, sin lógica fiscal. Solo lógica pura y acceso a ajustes; la vista llega en el paso 1b.

| Ruta | Contenido |
|---|---|
| `src/app/respaldo.ts` | Claves de ajustes (`ultimoRespaldo`, `respaldoIncluirPersonales`, `respaldoRecordatorio`), `BACKUP_DUE_DAYS` (30), `WIPE_WORD` (`BORRAR`), `parseLastBackup`, `backupState`, `shouldRecordBackup`, `isWipeConfirmed`, `parseBool` |
| `src/app/respaldo.test.ts` | 11 pruebas |
| `src/stores/respaldo.ts` | `loadLastBackup`, `saveLastBackup`, `loadIncludePersonal`, `saveIncludePersonal`, `loadBackupReminder`, `saveBackupReminder` (usa `ajustesRepo(db)`) |

## Decisiones
- Estado del respaldo: `never` (sin fecha), `ok` (menos de 30 días) y `due` (30 o más). El 30 es un umbral de interfaz, no una regla fiscal; sirve para la alerta de Inicio "hace X días sin respaldo".
- Un respaldo cancelado en la hoja de compartir **no** actualiza la fecha del último respaldo (`shouldRecordBackup`). Compartido o descargado, sí.
- Por defecto el respaldo **no** incluye datos personales (RC-05, NIT), como en `04`, sección 7. El recordatorio mensual viene activado.
- Borrar todos los datos exige escribir `BORRAR` (segunda confirmación de `03`, V15).

## Supuestos a confirmar
- `ajustesRepo(db).get<T>(clave, valorPorDefecto)` y `.set(clave, valor)`, como en `stores/ajustes.ts`.
- `get` acepta `undefined` como valor por defecto. Si `svelte-check` se queja en `loadLastBackup`, pega el mensaje.

## Qué se verificó y qué no
- Verificado: las comprobaciones de `respaldo.ts` corren en Node 22 (cambio de año, futuro, umbral de 30 días, fecha imposible).
- **No verificado**: Vitest (las 11 pruebas siguen esas mismas comprobaciones), tipos de `stores/respaldo.ts`.

## Pendiente
- Paso 1b: `src/views/respaldo/Respaldo.svelte`, `src/i18n/respaldo.ts`, ruta `/ajustes/respaldo` en `App.svelte`. Usará `createAndShareBackup`, `restoreBackupFromPicker`, `wipeAllData` y `loadPerfil()` tras restaurar.
- Alerta "hace X días sin respaldo" en Inicio (usa `backupState`).
- V14, V16, servicio de notificaciones, feriados reales, pendientes fiscales de `01`, sección 7.

## Actualizar en el proyecto
- `04-modelo-de-datos.md`: nada todavía. Las tres claves de ajustes son nuevas; se anotarán al cerrar V15.

## Pasos para aplicar (Termux)

```bash
cd ~/miapp && git pull
unzip -o ~/storage/downloads/m6-paso1a.zip
ls src/app/respaldo* src/stores/respaldo.ts docs
npm test
npx svelte-check
```
`npm test`: 11 pruebas nuevas. Total esperado `384 passed` (373 + 11). Si tu total difiere pero no falla ninguna, está bien.

```bash
git add .
git commit -m "feat: add backup view logic and settings (M6 step 1a)"
git push
```

## Cómo probar
Solo pruebas automáticas: la vista aún no existe.

## Siguiente paso
Paso 1b: pega
```bash
grep -n "export" src/data/backup.ts
cat src/App.svelte
```
