# Registro de sesión 01: hito M0 (proyecto base y CI)

Fecha: 21/10/2026

## Qué se creó en esta sesión

Solo lo necesario para que el APK abra una pantalla y lo compile GitHub Actions. Sin lógica fiscal todavía (eso es M1).

| Ruta en el repositorio | Contenido |
|---|---|
| `.gitignore` | Ignora `node_modules/`, `dist/`, builds de Android, `*.keystore`, `.env` |
| `.github/workflows/build-apk.yml` | CI: `npm ci`, pruebas, build web, `cap sync`, `assembleDebug`, sube el APK; con etiqueta `v*` crea un Release |
| `index.html` | `lang="es"`, viewport y `theme-color`. Sin CSP aún (ver pendientes) |
| `src/main.ts` | Monta `App.svelte` (Svelte 5, `mount`) e importa `app/theme.css` |
| `src/App.svelte` | Pantalla base: nombre, lema, tarjeta "Hito M0", aviso offline, versión `0.0.1` |
| `src/app/theme.css` | Variables de color, modo claro/oscuro automático, botones de 44 px mínimo |
| `src/i18n/es.ts` | Todos los textos de la interfaz (objeto `es`) |

## Cambios respecto al plan

- Script de pruebas: `"test": "vitest run --passWithNoTests"`. Sin la bandera, Vitest falla cuando no hay pruebas y el workflow se rompería en M0.
  **Actualizar**: `05-plan-de-desarrollo.md`, sección "Fase 0 > Ajustes" (la línea de `package.json`).
- Se elimina la plantilla de ejemplo de Vite (`src/app.css`, `src/lib/Counter.svelte`) porque la sustituyen `src/app/theme.css` y `src/App.svelte`.

## Pendiente

- Confirmar en la documentación oficial de Capacitor la versión mayor actual y sus requisitos de Node y JDK (el workflow usa Node 22 y JDK 21, según `02`). Comparar con `node -v` en Termux.
- CSP en `index.html` (exigida por `02`, sección 7): se añade más adelante, porque en modo desarrollo bloquearía el servidor de Vite.
- Quitar el permiso `INTERNET` del manifiesto: se prueba al final del desarrollo.
- `versionName` y `versionCode`: se ajustan al publicar `v0.1.0`.

## Pasos para aplicar (Termux)

Los archivos entregados van en la misma ruta dentro de `~/miapp`.

**1. Preparar el repositorio**
```bash
cd ~/miapp
git pull
node -v
```

**2. Crear el proyecto Vite + Svelte**
```bash
npm create vite@latest . -- --template svelte-ts
```
Si pregunta por archivos existentes: elegir ignorar y continuar. Después, si cambió el `README.md`: `git checkout README.md`.

**3. Instalar dependencias**
```bash
npm install
npm i dexie chart.js
npm i @capacitor/core @capacitor/app @capacitor/local-notifications \
  @capacitor/filesystem @capacitor/share @capacitor/clipboard \
  @capacitor/preferences @capacitor/status-bar @capacitor/splash-screen
npm i -D @capacitor/cli @capacitor/android vitest
npm pkg set scripts.test="vitest run --passWithNoTests"
```
Si `npm install` o el build fallan por `esbuild`/`rollup`, aplicar el "Plan B" de `02-arquitectura-y-stack.md`.

**4. Copiar los archivos entregados**
Pegar cada archivo en su ruta (en Acode: carpeta `~/miapp`). Crear antes las carpetas:
```bash
mkdir -p .github/workflows src/app src/i18n docs
rm -f src/app.css src/lib/Counter.svelte
rmdir src/lib 2>/dev/null
```
Reemplazar `.gitignore`, `index.html`, `src/main.ts`, `src/App.svelte`; crear `src/app/theme.css`, `src/i18n/es.ts`, `.github/workflows/build-apk.yml` y `docs/registro-sesion-01.md`.

**5. Probar la web en el teléfono**
```bash
npm run dev -- --host
```
Abrir `http://localhost:5173` en el navegador. Debe verse "Asistente TCP" y la tarjeta "Hito M0". Detener con Ctrl+C.

**6. Capacitor y Android**
```bash
npm run build
npx cap init "Asistente TCP" com.oficinarhd.asistentetcp --web-dir=dist
npx cap add android
```
Si `cap init` dice que ya existe `capacitor.config.ts`, dejarlo como está y confirmar que `webDir` es `dist`.

**7. Subir a GitHub**
```bash
git add .
git status
git commit -m "chore: add M0 base project and CI workflow"
git push
```
En `git status` deben aparecer `package-lock.json`, `android/` y `.github/`; no debe aparecer `node_modules/` ni `dist/`.

## Cómo probar que el hito está hecho

1. En GitHub, pestaña Actions: el workflow "Build APK" termina en verde.
2. Abrir esa ejecución y descargar el artefacto `asistente-tcp-debug-N` (viene en un `.zip`; extraerlo con el gestor de archivos).
3. Instalar el APK (permitir "orígenes desconocidos" si lo pide).
4. Activar modo avión y abrir la app: se ve la pantalla "Asistente TCP" sin errores.

Si el workflow falla, copiar las últimas 30 líneas del paso rojo y pegarlas en el chat.

## Siguiente sesión

Hito M1: `money.ts`, `dates.ts`, `businessDays.ts`, catálogo de tributos y reglas `ventas`, `isipMensual` y `mora`, con pruebas Vitest.
