# Registro de sesión 41: M6 paso 4d (V14 Apariencia)

Fecha: 27/10/2026

## Creado / modificado
Sin dependencias nuevas, sin lógica fiscal.

| Ruta | Contenido |
|---|---|
| `src/app/apariencia.ts` y `.test.ts` | `Tema` (`auto`, `light`, `dark`), `parseTema`, `dataThemeFor` (4 pruebas) |
| `src/stores/tema.ts` | `loadTema`, `saveTema`, `applyTema` (pone o quita `data-theme` en `<html>`), `initTema` (no lanza) |
| `src/i18n/apariencia.ts` y `.test.ts` | Textos (1 prueba) |
| `src/views/ajustes/Apariencia.svelte` | Tres opciones (Automático, Claro, Oscuro); guarda y aplica al elegir |
| `src/app/ajustesMenu.ts` y `.test.ts` | **Reemplazados**: `apariencia` apunta a `/ajustes/apariencia` |
| `src/App.svelte` | **Reemplazado**: ruta nueva y `initTema()` al arrancar |
| `docs/03-vistas-y-flujos.md` | **Reemplazado**: V14 al día |

## Decisiones
- Ajuste `tema` en la tabla `ajustes`: `'auto'` (por defecto), `'light'` o `'dark'`. Entra en los respaldos como el resto de ajustes.
- Automático quita `data-theme` y manda el modo del teléfono (`shell.css` del paso 4c).
- El tema se aplica al arrancar la app; puede verse un parpadeo breve del tema automático antes de aplicarse el guardado.
- Tras restaurar un respaldo con otro tema, se aplica al reiniciar la app.

## Pendiente
- Feriados (faltan datos reales, `01` sección 7).
- Revisar visualmente cada vista con el tema (capturas).
- Prueba en teléfono real de M6, `POST_NOTIFICATIONS`, etiqueta `v0.1.0`.

## Qué se verificó y qué no
- Verificado: 5 pruebas nuevas en Node 22 (sustituto de Vitest) y las de `ajustesMenu` actualizadas.
- **No verificado**: `Apariencia.svelte`, tipos y aspecto real.

## Actualizar en el proyecto
- `03-vistas-y-flujos.md`: sustituir por el del zip.
- `04-modelo-de-datos.md`, Ajustes: clave `tema` = `'auto' | 'light' | 'dark'`.

## Pasos para aplicar (Termux)
```bash
cd ~/miapp && git pull
unzip -o ~/storage/downloads/m6-paso4d.zip
npm test
npx svelte-check
npm run build
```
Esperado: 5 pruebas nuevas. Con 3e, 4a, 4b y 4c: `453 passed`.

```bash
git add .
git commit -m "feat: add appearance setting with light, dark and auto themes (M6 step 4d)"
git push
```

## Cómo probar
1. Menú [☰], Ajustes: "Apariencia" ya no sale atenuada.
2. Elige "Oscuro": la app se oscurece al instante y sale "Tema guardado."
3. Elige "Claro": se aclara aunque el teléfono esté en modo oscuro.
4. Cierra la app del todo y ábrela: conserva tu elección.
5. "Automático": sigue al teléfono.
