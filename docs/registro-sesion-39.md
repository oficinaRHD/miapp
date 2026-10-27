# Registro de sesión 39: M6 paso 4b (V14 Acerca de)

Fecha: 27/10/2026

## Creado / modificado
Sin dependencias nuevas, sin lógica fiscal.

| Ruta | Contenido |
|---|---|
| `src/app/version.ts` | `APP_VERSION = '0.1.0'` (debe coincidir con `versionName` de Android) |
| `src/app/acerca.ts` y `.test.ts` | `aboutRows`, `isValidAppVersion` (2 pruebas) |
| `src/i18n/acerca.ts` y `.test.ts` | Textos y aviso de cálculos orientativos (1 prueba) |
| `src/views/ajustes/Acerca.svelte` | Versión de la app, versión de las reglas (`RULES_VERSION` de `domain/tributos.catalog`), aviso |
| `src/app/ajustesMenu.ts` y `.test.ts` | **Reemplazados**: `acerca` apunta a `/ajustes/acerca` |
| `src/App.svelte` | **Reemplazado**: ruta `/ajustes/acerca` |
| `docs/03-vistas-y-flujos.md` | **Reemplazado**: V14 y rutas al día |

## Decisiones
- `package.json` sigue en `0.0.0` (no se publica). La versión visible vive en `version.ts`.
- `android/app/build.gradle` tiene `versionName "1.0"` y `versionCode 1`: hay que cambiarlo a `"0.1.0"` antes de publicar (checklist de `05`). Abajo, el comando.
- Las reglas se muestran como `2026.1` (`RULES_VERSION`).

## Pendiente
- Apariencia (tema claro/oscuro) y Feriados (faltan datos reales, `01` sección 7).
- Barra inferior de navegación; el "+" de V06 debe subir sobre ella.
- Prueba en teléfono real de M6, `POST_NOTIFICATIONS`, etiqueta `v0.1.0`.

## Qué se verificó y qué no
- Verificado: 3 pruebas nuevas en Node 22 (sustituto de Vitest); las de `ajustesMenu` actualizadas pasan.
- **No verificado**: `Acerca.svelte` y tipos (`svelte-check`).

## Actualizar en el proyecto
- `03-vistas-y-flujos.md`: sustituir por el del zip.
- `05-plan-de-desarrollo.md`, checklist de publicación: "actualizar `APP_VERSION` en `src/app/version.ts` y `versionName`/`versionCode`".

## Pasos para aplicar (Termux)
```bash
cd ~/miapp && git pull
unzip -o ~/storage/downloads/m6-paso4b.zip
sed -i 's/versionName "1.0"/versionName "0.1.0"/' android/app/build.gradle
npm test
npx svelte-check
npm run build
```
Esperado: 3 pruebas nuevas (`acerca` 2, `i18n/acerca` 1). Con el paso 4a: `442 passed`.

```bash
git add .
git commit -m "feat: add about view with app and rules versions (M6 step 4b)"
git push
```

## Cómo probar
1. `#/ajustes`: "Acerca de" ya no sale atenuada. Tócala.
2. Debe verse: Versión de la app `0.1.0`, Versión de las reglas `2026.1` y el aviso de cálculos orientativos.
3. "Volver a Ajustes" regresa al menú.
