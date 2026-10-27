# Registro de sesión 40: M6 paso 4c (barras del teléfono, menú [☰] y tema)

Fecha: 27/10/2026

## Qué pidió Rolando (pruebas en el APK)
1. La app no respeta las barras superior e inferior del teléfono (todas las vistas).
2. Los botones de navegación estaban desordenados: quería un menú desplegable [☰].
3. Aplicar un tema de colores moderno y agradable.
(Las capturas no llegaron a la sesión; se trabajó con la descripción.)

## Creado / modificado
Sin dependencias nuevas, sin lógica fiscal.

| Ruta | Contenido |
|---|---|
| `index.html` | **Reemplazado**: añade `color-scheme` (conserva `viewport-fit=cover`) |
| `src/main.ts` | **Reemplazado**: importa `./app/shell.css` después de `theme.css` |
| `src/app/shell.css` | Nuevo: tokens de color claro/oscuro, variables de barras del teléfono y estilos base |
| `src/app/nav.ts` y `.test.ts` | `NAV_ITEMS`, `activeNav(path)`, `showMenu` (5 pruebas) |
| `src/i18n/nav.ts` y `.test.ts` | Textos del menú (1 prueba) |
| `src/views/shell/Menu.svelte` | Botón [☰]/[✕] y panel desplegable; se cierra al navegar, con Escape o al tocar fuera |
| `src/App.svelte` | **Reemplazado**: barra superior con nombre y menú; se quitan los enlaces temporales y su `<style>` |
| `docs/03-vistas-y-flujos.md` | **Reemplazado**: decisión de navegación |

## Decisiones
- **Barras del teléfono**: Capacitor 8 (SystemBars, modo `css` por defecto) hace la app de borde a borde. La causa era que nada añadía relleno. Ahora `--sat/--sab/--sal/--sar` = `max(env(safe-area-inset-*), var(--safe-area-inset-*))` y se aplican a la barra superior (arriba), al `main` (abajo) y al contenedor (laterales). Usar `max` evita el doble relleno cuando ambas fuentes dan el mismo valor.
- **Menú**: el desplegable sustituye a la barra inferior de 5 pestañas (aplazada). Se oculta durante el onboarding.
- **Tema**: verde (`#0b6e4f`, el del `theme-color`) con fondo y tarjetas suaves; modo oscuro automático según el teléfono. Para forzarlo, la futura vista Apariencia pondrá `data-theme="light|dark"` en `<html>`.
- Los estilos globales de elementos usan `:where(#app)` (especificidad cero) para que los de cada vista sigan mandando; solo `.card`, `.item`, `.note` y `.error` se unifican con `#app`.
- Barra de estado: queda el estilo por defecto de Android. No se toca `capacitor.config.ts`.

## Pendiente
- Apariencia (elegir claro/oscuro/automático y guardar en `ajustes`).
- Revisar visualmente cada vista con el tema nuevo (pegar capturas o describir lo que se vea mal).
- Si la barra superior sigue tapada, pegar `cat capacitor.config.ts` y `grep -n "EdgeToEdge\|SystemBars" -r android/app/src`.
- Feriados; prueba en teléfono real de M6; `POST_NOTIFICATIONS`; etiqueta `v0.1.0`.

## Qué se verificó y qué no
- Verificado: 6 pruebas nuevas en Node 22 (sustituto de Vitest).
- **No verificado**: el aspecto en pantalla, `Menu.svelte`, `App.svelte` y los tipos. Hay que verlo en el APK.

## Actualizar en el proyecto
- `03-vistas-y-flujos.md`: sustituir por el del zip.
- `05-plan-de-desarrollo.md`, M6: "navegación por menú desplegable en vez de barra inferior; tema claro/oscuro".
- `02-arquitectura-y-stack.md`: añadir `shell.css`, `nav.ts` y `views/shell/Menu.svelte`.

## Pasos para aplicar (Termux)
```bash
cd ~/miapp && git pull
unzip -o ~/storage/downloads/m6-paso4c.zip
npm test
npx svelte-check
npm run build
```
Esperado: 6 pruebas nuevas. Con los pasos 3e, 4a y 4b: `448 passed`.

```bash
git add .
git commit -m "feat: add safe-area insets, dropdown menu and color theme (M6 step 4c)"
git push
```
Instala el APK nuevo (encima del anterior) cuando termine el workflow.

## Cómo probar (APK)
1. La barra superior queda **debajo** de la barra de estado del teléfono y el contenido no se tapa con la barra de navegación de abajo (desplázate hasta el final de una vista larga).
2. Arriba a la derecha hay [☰]. Tócalo: panel con 6 opciones; la actual aparece resaltada.
3. Toca una opción: navega y el panel se cierra. Toca fuera del panel: se cierra.
4. Cambia el teléfono entre modo claro y oscuro: la app cambia de colores.
5. En Ajustes entra a Notificaciones, Respaldo y Acerca de.
