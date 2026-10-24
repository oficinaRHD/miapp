# Registro de sesión 11: M3 paso 4b (V17 Perfil, vista) · cierra M3

Fecha: 23/10/2026

## Creado / modificado
Sin dependencias nuevas, sin lógica fiscal, sin pruebas nuevas (la lógica ya está probada en `perfilForm.test.ts`; `npm test` sigue igual).

| Ruta | Contenido |
|---|---|
| `src/views/perfil/Perfil.svelte` | V17: datos básicos, identificación fiscal (RC-05, NIT), empleados, tributos activos. Recibe `perfil` como propiedad. Guardar solo si hay cambios |
| `src/i18n/perfil.ts` | Textos de V17 y `error(e)` para los errores de validación |
| `src/stores/perfil.svelte.ts` | **Reemplazado**: añade `updatePerfil(changes)` (llama a `patchPerfil`; un cast documentado) |
| `src/App.svelte` | **Reemplazado**: ruta `perfil` muestra `<Perfil />`; enlace de prueba añadido |

## Detalles que conviene recordar
- `repo.patch` borra un campo opcional si recibe `undefined` (lo hace `{ ...prev, ...changes }`). Por eso `toChanges` devuelve `undefined` en los vacíos.
- `exactOptionalPropertyTypes` parece activo (por cómo está escrito `onboarding.ts`), así que `Partial<PerfilInput>` no acepta `undefined`: `updatePerfil` hace un único `as unknown as Partial<PerfilInput>`. `parsePerfil` sigue siendo el validador real. Si tu `tsconfig` no lo activa, el cast sobra pero no estorba.
- El aviso de 30 días a la ONAT aparece tras guardar un cambio de actividad o municipio (`businessChanged`), y se queda hasta salir de la vista.
- V17 añade municipio y código de municipio (ya existen en `Perfil`; `03` no los listaba). 
- Cambiar tributos activos no crea ni borra obligaciones ya generadas (la vista lo avisa).
- En el `es.ts` que pegaste ya no estaban las claves `dev*`, `milestone*` ni `versionLabel`: no hay nada que limpiar.

## Decisión de M2 (resuelta)
Al restaurar un respaldo sin datos personales se pierden `rc05` y `nit` locales. No se conservan: V17 los muestra vacíos y se pueden volver a escribir. El formato del respaldo no cambia.

## Actualizar en el proyecto
- `03-vistas-y-flujos.md`, V17: añadir municipio, código de municipio y el aviso de que cambiar tributos no modifica obligaciones creadas.
- `05-plan-de-desarrollo.md`: marcar M3 como hecho cuando pruebes los pasos de abajo.

## Qué se verificó y qué no
- **No verificado**: nada en ejecución (sin Svelte, Vite ni Dexie en la sesión). Hay que ejecutar `npx svelte-check` y la prueba manual.
- Punto a vigilar: que `parsePerfil` acepte `rc05: undefined` al borrar (paso 4 de la prueba).

## Pendiente
- Feriados reales en `buildPlan` y generar el año siguiente (M4 o M6).
- M6: tras restaurar un respaldo, volver a llamar a `loadPerfil()`.
- Pendientes fiscales de `01`, sección 7.
- Siguiente hito: M4 (V02, V03, V04, V05).

## Pasos para aplicar (Termux)

```bash
cd ~/miapp && git pull
unzip -o ~/storage/downloads/m3-paso4b.zip
npm test
npx svelte-check
npm run build
```
`npm test`: sin cambios respecto al paso 4a (233). Si `svelte-check` marca un error, pega el mensaje completo.

```bash
git add .
git commit -m "feat: add profile view (V17) and close M3"
git push
```

## Cómo probar
1. `npm run dev -- --host`, abrir `http://localhost:5173` y tocar el enlace **perfil**. Debe verse el formulario con tus datos y el botón **Guardar cambios** desactivado.
2. Cambia el nombre y guarda: aparece "Cambios guardados." y el botón se desactiva. Recarga: el nombre sigue.
3. Escribe un RC-05 `1234-5678-9012-3456` y guarda. Recarga: aparece `1234567890123456` (sin guiones).
4. Borra el RC-05 y guarda. Recarga: el campo queda vacío.
5. Escribe `123` en RC-05 y guarda: error "El RC-05 debe tener 16 dígitos" y no se guarda nada.
6. Cambia el código de actividad y guarda: aparece "Informa a la ONAT".
7. Marca **Tengo empleados** sin tocar tributos: la lista cambia a la sugerencia. Toca un tributo a mano y vuelve a cambiar empleados: la lista ya no cambia sola.
8. Actions en verde; el APK abre y el formulario funciona igual.
