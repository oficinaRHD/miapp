# Registro de sesión 30: M6 paso 1b (V15 Respaldo, vista)

Fecha: 26/10/2026

## Creado / modificado
Sin dependencias nuevas, sin lógica fiscal. Se leyeron `backup.ts` (firmas) y `App.svelte` reales.

| Ruta | Contenido |
|---|---|
| `src/views/respaldo/Respaldo.svelte` | V15: último respaldo, exportar, importar (con aviso previo) y borrar todo (escribir `BORRAR`) |
| `src/i18n/respaldo.ts` | Textos de V15 (`esRespaldo`) y `daysAgoText(n)` |
| `src/i18n/respaldo.test.ts` | 2 pruebas |
| `src/App.svelte` | **Reemplazado**: la ruta `/ajustes/respaldo` (por ruta, como la calculadora) muestra `<Respaldo />` |

## Decisiones
- **Exportar**: `createAndShareBackup(db, { includePersonal })`. Solo se anota la fecha del último respaldo si no se canceló la hoja de compartir.
- **Importar**: primero un aviso de que reemplaza todo y una copia interna previa; solo entonces se abre el selector. Tras restaurar se llama a `loadPerfil()` (pendiente heredado de M2 a M5) y se releen los ajustes, porque el respaldo incluye `ajustes`.
- **Fecha del último respaldo tras importar**: se pone la `exportadoEn` del archivo restaurado (es el respaldo más reciente que se conoce). Antes de esto, el respaldo traería la fecha anterior.
- **Borrar**: `wipeAllData(db)`, luego `ensureSeed(db)` (para recuperar las 11 categorías) y `loadPerfil()`. Sin perfil, el guardián lleva a `/onboarding`.
- El recordatorio mensual solo guarda la preferencia; los avisos llegan con el servicio de notificaciones.
- La vista es accesible antes del onboarding (guardián, sesión 5): sirve para restaurar en un teléfono nuevo.

## Supuestos a confirmar
- `wipeAllData(db)` no resiembra categorías; si ya lo hace, `ensureSeed` no estorba (es idempotente).
- `BackupCounts` tiene las claves `movimientos` y `obligaciones`.
- `loadPerfil()` es `async` y se puede esperar.

## Pendiente
- Alerta "hace X días sin respaldo" en Inicio (usa `backupState`) y enlace a V15 desde Ajustes (V14).
- Tras restaurar o borrar, reprogramar o cancelar avisos (servicio de notificaciones, siguiente en M6).
- Probar en el APK la hoja de compartir y el selector de archivos (criterio de M2).
- Feriados reales y pendientes fiscales de `01`, sección 7.

## Qué se verificó y qué no
- Verificado: la lógica de `respaldo.ts` (sesión 29) en Node 22.
- **No verificado**: `Respaldo.svelte`, `App.svelte`, tipos y las 2 pruebas nuevas (npm bloqueado en la sesión).

## Actualizar en el proyecto
- `03-vistas-y-flujos.md`, V15: añadir "Guardar la fecha del último respaldo solo si no se cancela; importar pide confirmación y tras restaurar usa la fecha del archivo; borrar exige escribir BORRAR y vuelve al onboarding".
- `04-modelo-de-datos.md`, sección 2 (Ajustes): claves `ultimoRespaldo`, `respaldoIncluirPersonales`, `respaldoRecordatorio`.
- `05-plan-de-desarrollo.md`, M6: anotar "V15 hecho (sesiones 29 y 30)".

## Pasos para aplicar (Termux)

```bash
cd ~/miapp && git pull
unzip -o ~/storage/downloads/m6-paso1b.zip
npm test
npx svelte-check
npm run build
```
`npm test`: 2 pruebas nuevas. Total esperado `386 passed` (384 + 2). Si `svelte-check` marca un error, pega el mensaje completo.

```bash
git add .
git commit -m "feat: add backup and data view (V15)"
git push
```

## Cómo probar
1. `npm run dev -- --host` y abre `#/ajustes/respaldo` (o toca `respaldo` abajo). Debe decir "Aún no hay respaldo."
2. Toca **Exportar respaldo**: se descarga un `.json` y sale "Respaldo descargado: ..." con los conteos. Ahora "Último respaldo" dice la fecha de hoy (hoy).
3. Marca "Incluir mis datos personales": aparece el aviso. Recarga: la casilla sigue marcada.
4. Toca **Borrar todos los datos...**: el botón rojo está desactivado hasta escribir `BORRAR`. Confirma: sale "Se borraron todos los datos." y al ir a `#/` pasa a onboarding.
5. Vuelve a `#/ajustes/respaldo` (se permite sin onboarding), toca **Importar respaldo...**, lee el aviso y elige el `.json`. Debe salir "Datos restaurados..." y `#/` muestra tu perfil sin pasar por onboarding.
6. Cierra el selector sin elegir archivo: "No se eligió ningún archivo. No se cambió nada."
7. En el APK (instálalo encima): repite 2 y 5; el paso 2 debe abrir la hoja de compartir de Android. Si la cancelas, el último respaldo no cambia.
8. Modo avión: todo sigue funcionando.
