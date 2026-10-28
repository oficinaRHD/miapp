# Registro de sesión 48: M6 paso 6b (preparar la beta v0.1.0)

Fecha: 28/10/2026

## Qué se pidió
Dejar todo listo para publicar una **beta**: probar las notificaciones en el teléfono (con la app cerrada, tras un reinicio y con el permiso denegado), comprobar que todo compila en verde y cumplir el checklist de `05` (instalar encima conservando datos, modo avión, exportar e importar respaldo).

## Creado
Sin cambios en la app: nada de `src/`, `npm test` sigue en `474 passed`. Sin dependencias.

| Ruta | Contenido |
|---|---|
| `docs/prueba-beta.md` | Hoja de pruebas con casillas para hacer en el teléfono (A instalar encima, B modo avión, C respaldo, D notificaciones, E aspecto, F feriados) y plantilla de resultado |
| `docs/notas-version.md` | Texto de la publicación en GitHub Releases (qué incluye, avisos, instalar, actualizar, comentarios). Lo usa el workflow si existe |
| `scripts/pre-release.mjs` | Comprobación previa: versiones (`APP_VERSION` frente a `versionName`), etiqueta, `POST_NOTIFICATIONS`, workflow, git sin cambios pendientes y, sin `--quick`, `npm test`, `svelte-check` y `npm run build` |
| `scripts/patch-release-workflow.mjs` | Parchea `.github/workflows/build-apk.yml`: una etiqueta con guion (`v0.1.0-beta.1`) se publica como **pre-lanzamiento** con `docs/notas-version.md`; y, si existe el secreto `DEBUG_KEYSTORE_BASE64`, firma con una llave fija |
| `.github/workflows/make-keystore.yml` | Ayuda de un solo uso (manual) para crear esa llave; solo si el repositorio es **privado** |

## Decisión importante: la firma del APK
Cada compilación de GitHub Actions usa una llave de depuración **nueva**. Android no instala encima un APK firmado con otra llave ("App no instalada"), así que sin firma estable el usuario tendría que desinstalar, y al hacerlo **pierde sus datos**. Por eso la prueba A2 es clave:
- Si A2 **funciona** (instala encima sin error), puede que la firma ya sea estable en tu caso; sigue como está.
- Si A2 **falla**, hay que hacer la "Firma estable" de abajo antes de dar la beta a nadie más. Mientras tanto, la nota de versión ya indica exportar el respaldo antes de actualizar.

### Firma estable (solo si falla A2)
Se hace una vez.
1. Solo con repositorio privado: GitHub, Actions, "Make debug keystore", "Run workflow". Al terminar, descarga el artefacto `debug-keystore` (un `.txt` con la llave en base64). Si el repositorio es **público**, no uses este flujo: pídeme otro método.
2. Abre el `.txt`, copia **todo** su contenido.
3. GitHub, Settings, Secrets and variables, Actions, "New repository secret": nombre `DEBUG_KEYSTORE_BASE64`, valor lo copiado. Guarda.
4. Borra el artefacto y la ejecución de "Make debug keystore", y borra el `.txt` descargado.
5. Guarda una copia segura de esa llave fuera de GitHub: si la pierdes, las instalaciones futuras no podrán actualizar encima.
6. La próxima compilación ya firma con esa llave. **Solo desde ese APK** en adelante se podrá actualizar encima: la primera vez hay que desinstalar el anterior (exporta antes el respaldo).

## Qué se verificó y qué no
- Verificado: ambos scripts en copias de prueba (el parche conserva un YAML válido, es idempotente y no toca nada si no encuentra el bloque; `pre-release` detecta versiones distintas, etiqueta incorrecta y cambios sin subir); sintaxis de los `.mjs`.
- **No verificado**: ejecución real en tu repositorio, que `gh release create --prerelease --notes-file` funcione como espero en la versión de `gh` del runner, y el efecto de la firma fija en el APK.

## Pasos para aplicar (Termux)
```bash
cd ~/miapp && git pull
unzip -o ~/storage/downloads/m6-paso6b.zip
node scripts/add-notification-permission.mjs
node scripts/patch-release-workflow.mjs
git diff --stat
node scripts/pre-release.mjs v0.1.0-beta.1 --quick
```
- Los dos primeros scripts deben decir `PATCHED` o `ALREADY`. Si dicen `MISSING` o `ERROR`, pega su salida.
- `pre-release --quick` mostrará `FAIL` por cambios sin subir; es normal en este punto.

Después, la comprobación completa (tarda unos minutos):
```bash
node scripts/pre-release.mjs v0.1.0-beta.1
```
Debe terminar en `READY`. Si algo falla, pega la salida.

```bash
git add .
git commit -m "chore: prepare v0.1.0 beta release (M6 step 6b)"
git push
```
Los cambios en `.md` y `docs/` no disparan compilación, pero `scripts/` y `.github/` sí: el push compila un APK. Mira que termine en verde:
GitHub, pestaña Actions, "Build APK", el último de `main`. Descarga el artefacto `asistente-tcp-debug-N` (un zip con el APK).

## Orden de trabajo hasta la publicación
1. Aplicar este paso y la comprobación completa (arriba).
2. Esperar el APK verde de Actions e instalarlo encima del anterior: prueba A.
3. Hacer el resto de `docs/prueba-beta.md` (B a F) y pegarme el resultado.
4. Corregir lo que falle.
5. Publicar:
```bash
node scripts/pre-release.mjs v0.1.0-beta.1
git tag v0.1.0-beta.1
git push origin v0.1.0-beta.1
```
El workflow crea el **pre-lanzamiento** `v0.1.0-beta.1` con el APK y el texto de `docs/notas-version.md`. Descarga el APK de la página de la publicación y compruébalo una vez antes de compartirlo.

## Actualizar en el proyecto
- `05-plan-de-desarrollo.md`: M6 con el estado "código completo; falta la prueba en teléfono y la publicación"; añadir al checklist `node scripts/pre-release.mjs <etiqueta>`.
- `02-arquitectura-y-stack.md`, sección 11: etiquetas con guion = pre-lanzamiento; firma de depuración estable con el secreto `DEBUG_KEYSTORE_BASE64`.
- `01`, `04`: ver registros 45 y 46.
