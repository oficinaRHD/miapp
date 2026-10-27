# Registro de sesión 38: M6 paso 4a (V14 Ajustes, hub)

Fecha: 27/10/2026

## Creado / modificado
Sin dependencias nuevas, sin lógica fiscal.

| Ruta | Contenido |
|---|---|
| `src/app/ajustesMenu.ts` | `AJUSTES_MENU` (perfil, notificaciones, respaldo, feriados, apariencia, acerca), `isAvailable`, `availableEntries` |
| `src/app/ajustesMenu.test.ts` | 3 pruebas |
| `src/i18n/ajustes.ts` y `.test.ts` | Textos (1 prueba): cada entrada tiene título y descripción |
| `src/views/ajustes/Ajustes.svelte` | V14: lista de tarjetas con enlace; las que no tienen vista salen atenuadas con "Próximamente" |
| `src/App.svelte` | **Reemplazado**: ruta `/ajustes` por ruta (path) y enlace en la barra temporal |
| `docs/03-vistas-y-flujos.md` | **Reemplazado**: V14 al día |

## Decisiones
- Feriados, Apariencia y Acerca de aparecen pero no abren nada todavía. Feriados necesita datos que `01` (sección 7) marca como pendientes: no se inventan.
- La vista solo enlaza; no lee datos.

## Pendiente
- Apariencia (tema claro/oscuro): decidir si se guarda en `ajustes` y cómo se aplica (clase en `<html>`).
- Acerca de: necesito saber de dónde sale la versión de la app y `reglasVersion` en el código. Pega `grep -rn "reglasVersion" src | head` y `grep version package.json`.
- Feriados (vista editable) y barra inferior de navegación (`nav.ts`); el botón "+" de V06 debe subir sobre ella.
- Prueba en teléfono real de M6, `POST_NOTIFICATIONS`, etiqueta `v0.1.0`.

## Qué se verificó y qué no
- Verificado: las 4 pruebas nuevas pasan en Node 22 con sustituto de Vitest.
- **No verificado**: `Ajustes.svelte`, tipos y la ruta `/ajustes` con tu router (`svelte-check`, navegador).

## Actualizar en el proyecto
- `03-vistas-y-flujos.md`: sustituir por el del zip.
- `05-plan-de-desarrollo.md`: en M6, V14 hecho a medias (hub); quedan Feriados, Apariencia y Acerca de.

## Pasos para aplicar (Termux)
```bash
cd ~/miapp && git pull
unzip -o ~/storage/downloads/m6-paso4a.zip
npm test
npx svelte-check
npm run build
```
Esperado: `npm test` con 4 pruebas nuevas, total `439 passed` (435 + 4, si aplicaste el paso 3e).

```bash
git add .
git commit -m "feat: add settings hub view V14 (M6 step 4a)"
git push
```

## Cómo probar
1. Abre `#/ajustes`: seis tarjetas; tres con enlace y tres atenuadas con "Próximamente".
2. Toca "Notificaciones", "Respaldo" y "Perfil y tributos": abren su vista.
3. En Inicio, el botón "Ajustes" ahora abre esta vista.
4. Antes del onboarding, `#/ajustes` redirige a `/onboarding` (es lo esperado).
