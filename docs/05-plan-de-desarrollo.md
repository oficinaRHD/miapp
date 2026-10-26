# Plan de desarrollo

Principio: cada hito termina con un APK que se instala y se prueba en el teléfono. Los datos nunca se pierden entre versiones.

## Fase 0: preparar el proyecto (hito M0)

**Objetivo**: un APK que abre y muestra una pantalla, compilado por GitHub Actions.

Comandos en Termux (en la carpeta del repositorio):

```bash
node -v                      # Capacitor 8 requiere Node 22 o superior (ver 02)
cd ~/miapp
npm create vite@latest . -- --template svelte-ts
# si pregunta por archivos existentes, elegir ignorar y continuar
git checkout README.md       # la plantilla de Vite lo sobrescribe
npm install
npm i dexie chart.js
npm i @capacitor/core @capacitor/app @capacitor/local-notifications \
  @capacitor/filesystem @capacitor/share @capacitor/clipboard \
  @capacitor/preferences @capacitor/status-bar @capacitor/splash-screen
npm i -D @capacitor/cli @capacitor/android vitest
npm pkg set scripts.test="vitest run --passWithNoTests"
# aplicar el ajuste de vite.config.ts (abajo) ANTES de compilar
npm run build
npx cap init "Asistente TCP" com.oficinarhd.asistentetcp --web-dir=dist
npx cap add android
npx cap sync android
```

Importante: `@capacitor/cli` y `vitest` deben quedar en `package.json`. Sin `@capacitor/cli`, `npx cap` falla con "could not determine executable to run". Sin `vitest`, el paso de pruebas del CI falla con `vitest: not found`.

Ajustes:
- En `package.json`: `"test": "vitest run --passWithNoTests"`. Sin la bandera, Vitest falla cuando todavía no hay pruebas.
- En `vite.config.ts`, desactivar la minificación de CSS solo en Termux (no existe el binario nativo de `lightningcss` para su Node):

```ts
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

// Termux has no native lightningcss binary, so CSS minify is skipped there only.
const inTermux = Boolean(process.env.TERMUX_VERSION)

export default defineConfig({
  plugins: [svelte()],
  build: {
    cssMinify: inTermux ? false : 'lightningcss',
  },
})
```

- Copiar `build-apk.yml` a `.github/workflows/build-apk.yml`.
- `.gitignore` debe incluir: `node_modules/`, `dist/`, `android/app/build/`, `android/.gradle/`, `android/build/`, `*.keystore`, `.env`.
- Eliminar los restos de la plantilla de Vite: `src/app.css`, `src/lib/Counter.svelte`, `src/assets/hero.png`, `src/assets/svelte.svg`, `src/assets/vite.svg`, `public/icons.svg`.
- Hacer commit **incluyendo `package-lock.json`** (el workflow usa `npm ci`). Si se añade una dependencia, hacer commit de `package.json` y `package-lock.json` juntos.
- Si `git` falla por el puerto 22 (`Connection reset`), usar SSH por el 443: `git remote set-url origin ssh://git@ssh.github.com:443/USUARIO/REPO.git`.

Si Vite falla por binarios nativos en Termux, ver "Plan B" en `02-arquitectura-y-stack.md`.

**Hecho cuando**: `git push` dispara el workflow, se descarga el artefacto `asistente-tcp-debug-N` (un `.zip` con el APK) desde GitHub (pestaña Actions), se instala en el teléfono y abre sin errores.

## Fase 1: MVP v0.1

### M1: dominio y reglas
- `money.ts`, `dates.ts`, `businessDays.ts` (con lista de feriados vacía por defecto).
- `tributos.catalog.ts` con el catálogo de `01`.
- `schedule.ts` y reglas `ventas.ts`, `isipMensual.ts`, `mora.ts` y `descuento.ts` (3 % por canal electrónico, que la ficha de pago necesita).
- Pruebas con el calendario real de `01` (sección 2) y las fórmulas de la sección 3.

**Hecho cuando**: `npm test` pasa en Termux con casos de ventas (10 %), ISIP mensual con el exento de 3,260, mora en los tres tramos y el calendario 2026-27 completo.

### M2: datos y respaldo
- `db.ts` (versión 1), repositorios, `seed.ts`.
- `backup.ts`: exportar e importar con validación.
- Servicio de archivos (Filesystem + Share).
- Pruebas de datos con `fake-indexeddb` (dependencia de desarrollo; no entra en el APK).

**Hecho cuando**: se crean datos de prueba, se exporta el respaldo, se borran los datos, se importa y todo vuelve; probado en navegador y en el APK.

### M3: onboarding y perfil
- V01 y V17.
- Generación de obligaciones del año (`schedule.ts`) con edición de fechas del vector.

**Hecho cuando**: un usuario nuevo completa el onboarding y ve su calendario anual generado.

**Estado**: hecho (24/10/2026). V01 en las sesiones 07 a 09 y V17 en las sesiones 10 y 11 (`perfilForm.ts` y `Perfil.svelte`).

### M4: inicio, calendario y obligaciones
- V02, V03, V04, V05.
- Ficha de pago con botones de copiar.
- Marcar pagada con descuento del 3 % y recargo por mora.

**Hecho cuando**: se puede marcar una obligación como pagada fuera de fecha y la app muestra el recargo esperado según `01`.

**Estado**: implementado (25/10/2026), sesiones 12 a 19: V02 (12 y 13), V03 (14), V04 (15 y 16), V05 (17 a 19).

### M5: registro y calculadora
- V06, V07, V08.
- "Usar como importe estimado" enlazado a la obligación del mes.

**Hecho cuando**: registrar 3 ingresos y 2 gastos cambia el resumen de Inicio y la calculadora coincide con un cálculo manual.

**Estado**: implementado (26/10/2026), sesiones 20 a 26: lógica del registro (20), V07 (21 y 22), V06 (23), V08 (24 y 25), resumen de Inicio (26). Falta probar el criterio en el teléfono.

### M6: notificaciones, ajustes y publicación
- V14, V15, V16; servicio de notificaciones completo (canales, ventana de 60 días, reprogramación).
- Prueba en teléfono real: aviso de prueba, reinicio del teléfono, app cerrada, permiso denegado.
- Etiqueta `v0.1.0` y APK en GitHub Releases.

**Hecho cuando**: llegan avisos de un vencimiento programado a 3 minutos con la app cerrada, y sobreviven a un reinicio.

**Checklist de cada publicación**
1. `npm test` en verde.
2. Instalar el APK **encima** de la versión anterior y comprobar que los datos siguen.
3. Probar en modo avión.
4. Exportar e importar un respaldo.
5. Actualizar `versionName` y `versionCode`.

## Fase 2: v0.2

- V09 Estadísticas, V13 Guía, V11 Documentos con adjuntos.
- V10 Declaración jurada (requiere la escala del ISIP anual).
- Alerta del límite de 500,000 y recordatorios formales de `01` (sección 6).
- Respaldo en ZIP con adjuntos.
- Bloqueo con PIN.

## Fase 3: v0.3

- V12 Empleados y nómina, con 0520522, 0610322, 0810132 y 0820232.
- Exportar `.ics` y, si hay plugin compatible, integración con el calendario del teléfono.
- Biometría.
- APK de release firmado y, si se desea, Google Play (AAB, cuota única de 25 USD).

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Vite o sus binarios nativos no funcionan en Termux (p. ej. `lightningcss`) | `cssMinify: false` solo en Termux (ver Fase 0), Plan B en `02`; compilar siempre en CI |
| Android cierra la app y se pierden avisos | Guía de batería en V16, prueba en teléfono real, aviso en Inicio |
| Las reglas fiscales cambian | Catálogo versionado (`reglasVersion`), fechas editables, el vector manda |
| Datos faltantes (escala anual, mínimo MTSS, feriados) | Marcados como "por configurar"; no se inventan valores |
| Pérdida de datos al desinstalar o borrar datos | Respaldo manual, recordatorio mensual, migraciones desde la versión 1 |
| Datos personales expuestos en respaldos | Excluidos por defecto; aviso al activarlos |
| Plugins de la comunidad sin soporte de la versión mayor de Capacitor | Preferir `.ics` y plugins oficiales |
| Dependencia en `package.json` pero no en `package-lock.json` (el CI falla en `npm ci` o con `command not found`) | Commit siempre de ambos archivos; comprobar con `npm ls <paquete>` |
| Sin conexión o puerto 22 bloqueado al hacer `git push` | Commit local sin red; SSH por el 443 (`ssh.github.com`) |

## Cómo empezar la primera sesión

Mensaje sugerido para iniciar el hito M0 en el proyecto:

> Vamos a empezar el hito M0 de `05-plan-de-desarrollo.md`. Dame los comandos de Termux uno por bloque, y cuando termine uno te pego la salida. Al final necesito el workflow funcionando y un APK instalado en mi teléfono.

## Distribución

- Etapa 1: APK de depuración desde GitHub Actions o GitHub Releases, instalado a mano.
- Etapa 2: APK de release firmado y compartido directamente.
- Etapa 3 (opcional): Google Play.
- Por ser una app sin red, no hay servidor que mantener: cada actualización es un APK nuevo que se instala encima.
