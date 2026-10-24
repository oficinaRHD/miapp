# Registro de sesión 09: M3 paso 3c (V01 Onboarding, paso 5: fechas del año)

## Creado / modificado
- `src/app/yearDates.ts` (+ `.test.ts`, 22 pruebas): `buildPlan`, `groupPlan`, `planSummary`, `patternDates`, `cleanVectorDates`, `yearOf`, `monthStart`. Usa `generateObligations` del dominio; no calcula fechas por su cuenta.
- `src/app/onboarding.ts` (+ `.test.ts`, ahora 37 pruebas): paso `fechas`, campos `fechasModo` y `fechasVector`, `setYearMode`, `setVectorDate`. `ONBOARDING_TOTAL_STEPS` ahora es `ONBOARDING_STEPS.length` (5).
- `src/stores/obligaciones.ts`: **nuevo**, `addObligationDrafts` (usa `obligacionesRepo(db).addDrafts`).
- `src/i18n/onboarding.ts` y `src/views/onboarding/Onboarding.svelte`: paso 5. Se elimina el flujo provisional ("Perfil guardado" y "Terminar (provisional)").

## Decisiones
- **Opción A**: solo se crean las obligaciones del año en curso cuya fecha calculada es igual o posterior al día 1 del mes actual. Las anteriores no se crean.
- El conjunto de filas lo decide la fecha calculada. Escribir una fecha del vector nunca añade ni quita filas; la reemplaza (`venceOrigen: 'vector'`).
- Guardado al terminar, en este orden: permiso de notificaciones, obligaciones, perfil con `onboardingCompleto: true`. Si algo falla, el perfil no queda completo y se puede reintentar (`addDrafts` es idempotente).
- Hasta el último paso no se guarda nada.
- Los feriados no se consideran todavía (`NO_HOLIDAYS`); la pantalla lo avisa.
- Las fechas se muestran en formato `YYYY-MM-DD`. El formato legible llega con M4.

## Actualizar en el proyecto
- `03-vistas-y-flujos.md`, V01 paso 5: las obligaciones se generan desde el mes actual.
- `04-modelo-de-datos.md`, sección 5: la generación inicial omite periodos con fecha anterior al mes de alta.

## Pendientes
- Generar el año siguiente (cuando se acerque el cierre del año): M4 o M6.
- Feriados reales en `buildPlan` (pasar `holidays` desde el repositorio de feriados).
- V17 (Perfil): editar datos y tributos activos después del onboarding.
- Quitar las claves de `es.ts` que ya no se usan (`devProfileName`, `devOnboardingTitle`, `devOnboardingBody`, `devCreateProfile`, `milestoneTitle`, `milestoneBody`, `versionLabel`).
- M6: tras restaurar un respaldo, volver a llamar a `loadPerfil()`.
