# Registro de sesión 07: M3 paso 3a (V01 Onboarding, pasos 1-3)

## Creado / modificado
- `src/app/onboarding.ts`: lógica pura del asistente (pasos, borrador, validación, tributos sugeridos vía `suggestedTributoCodes`, `toPerfilInput`, `draftFromPerfil`).
- `src/app/onboarding.test.ts`: 27 pruebas.
- `src/i18n/onboarding.ts`: textos de la vista.
- `src/views/onboarding/Onboarding.svelte`: bienvenida, perfil y tributos.
- `src/App.svelte`: reemplaza el botón de perfil de prueba por `<Onboarding />`.

## Decisiones
- Al terminar el paso 3 se guarda el perfil con `onboardingCompleto: false`; un botón provisional lo pone en `true` hasta que existan los pasos 4-5.
- Los tributos de empleados se sugieren según `tieneEmpleados` solo mientras el usuario no edite la lista a mano.
- Se listan los 8 tributos del vector; el recargo por mora (`inVector: false`) no se ofrece.

## Pendientes
- Pasos 4 (notificaciones) y 5 (fechas del año).
- Quitar el botón provisional y `devProfileName`, `devOnboardingTitle`, `devOnboardingBody`, `devCreateProfile` de `es.ts` si ya no se usan.
- M6: tras restaurar un respaldo, volver a cargar el perfil en el store (`loadPerfil()`).
