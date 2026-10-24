# Registro de sesión 10: M3 paso 4a (V17 Perfil, lógica del formulario)

Fecha: 23/10/2026

## Creado / modificado
Sin dependencias nuevas, sin lógica fiscal. Solo lógica pura; la vista llega en el paso 4b.

| Ruta | Contenido |
|---|---|
| `src/app/perfilForm.ts` | `PerfilFormDraft`, `draftFromPerfil`, `setEmpleados`, `toggleTributo`, `resetTributos`, `validateForm`, `canSave`, `toChanges`, `hasChanges`, `businessChanged`, `formatRc05`, `stripSeparators` |
| `src/app/perfilForm.test.ts` | 20 pruebas |

## Decisiones
- RC-05: 16 dígitos; NIT: 11 dígitos (`01` sección 6 y `00`). Se aceptan guiones y espacios al escribir y se guardan sin ellos.
- Recordatorio de 30 días a la ONAT (`01` sección 6): solo se dispara si cambian actividad (código o nombre) o municipio (nombre o código). Nombre visible, RC-05, NIT, empleados y tributos no se consideran cambios de negocio, porque el vector no los lista como cambios a informar. Proyecto de negocio, vehículos, nombre y lugar del negocio y datos de contacto no existen aún en `Perfil`.
- Los tributos de empleados se sugieren según `tieneEmpleados` mientras el usuario no edite la lista a mano (igual que en el onboarding).
- `toChanges` devuelve `undefined` en los opcionales vacíos, para poder borrarlos.

## Pendiente
- **Por verificar**: si `repo.patch` borra un campo cuando recibe `undefined` o lo ignora. No vi `src/data/repositories/perfil.ts`. El paso 4b depende de esto.
- Paso 4b: `src/views/perfil/Perfil.svelte`, `src/i18n/perfil.ts`, conectar la ruta `/ajustes/perfil` en `App.svelte`, limpiar claves `dev*`, `milestone*` y `versionLabel` de `es.ts` (en el `es.ts` que pegaste ya no están).
- Decisión de M2 (propuesta): V17 muestra `rc05` y `nit` vacíos tras restaurar un respaldo sin datos personales y deja volver a escribirlos. No cambia el formato del respaldo.

## Pasos para aplicar (Termux)

```bash
cd ~/miapp && git pull
unzip -o ~/storage/downloads/m3-paso4a.zip
npm test
npx svelte-check
```
`npm test`: las 20 pruebas nuevas de `perfilForm.test.ts` deben pasar. Total esperado: `233 passed` (213 de las sesiones 01 a 09, según sus registros, más 20). Si tu total difiere pero no falla ninguna, está bien.

```bash
git add .
git commit -m "feat: add profile form logic (V17 step 1)"
git push
```

## Cómo probar
Solo pruebas automáticas: la vista aún no existe.

## Siguiente paso
Paso 4b: pega `cat src/data/repositories/perfil.ts` y `cat src/views/onboarding/Onboarding.svelte`.
