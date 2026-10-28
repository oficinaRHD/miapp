# Registro de sesión 45: M6 paso 5a (V14 Feriados) con los feriados fijos

Fecha: 27/10/2026

Este zip **sustituye al del paso 5a** (`m6-paso5a.zip`) e incluye todo lo de ese paso más los feriados fijos. Si ya aplicaste el 5a, aplica este encima. Sustituye también `registro-sesion-44.md` (este lo reemplaza).

## Contexto
Rolando indicó los feriados oficiales fijos de Cuba: 1 de enero, 1 de mayo, 26 de julio y 10 de octubre. Como `01` (sección 7, punto 3) no los trae, se guardan como dato indicado por el usuario, **sin contrastar con una publicación oficial**, y la lista sigue siendo editable. Pueden faltar otros días no laborables: la app no añade ninguno sin fuente.

## Creado / modificado
Sin dependencias nuevas, sin lógica fiscal nueva.

| Ruta | Contenido |
|---|---|
| `src/domain/feriadosFijos.ts` y `.test.ts` | `FERIADOS_FIJOS` (los cuatro) y `feriadosFijosDe(año)` (3 pruebas) |
| `src/app/feriadosForm.ts` y `.test.ts` | Lo del paso 5a más `mergeFeriados` (9 pruebas en total) |
| `src/stores/feriados.ts` | `listFeriados`, `saveFeriados`, `loadHolidays` |
| `src/i18n/feriados.ts` y `.test.ts` | Textos, ahora con la tarjeta "Feriados fijos" (4 pruebas) |
| `src/views/ajustes/Feriados.svelte` | Tarjeta "Feriados fijos" (año y botón "Añadir los feriados fijos"), formulario y lista por año con "Deshacer" |
| `src/app/ajustesMenu.ts` y `.test.ts` | `feriados` apunta a `/ajustes/feriados` |
| `src/App.svelte` | Ruta `/ajustes/feriados` |
| `docs/03-vistas-y-flujos.md` | V14 al día |

## Decisiones
- El botón añade solo las fechas que faltan y conserva el nombre que el usuario ya haya puesto. Es una acción del usuario: la lista sigue empezando vacía.
- El año por defecto es el actual; el usuario puede escribir otro (por ejemplo, el siguiente).
- Los feriados no se mueven si caen en fin de semana: ya no cuentan de todos modos como día hábil.

## Pendiente
- **Actualizar `01-reglas-fiscales-tcp.md`, sección 7, punto 3** (la fuente de verdad): "3. Calendario de feriados de Cuba. Fijos indicados por el usuario el 27/10/2026, pendientes de contrastar con fuente oficial: 1 de enero, 1 de mayo, 26 de julio y 10 de octubre. Puede haber otros días no laborables sin confirmar." Y en la sección 4, tras la tabla: "La app usa la lista de feriados que carga el usuario; sin ella cuenta de lunes a viernes."
- Paso 5b: conectar `loadHolidays()` a la mora, `pago.ts` y las fechas por patrón. Necesito:
  `grep -n "olidays\|toHolidaySet\|feriados" src/app/pago.ts src/app/yearDates.ts src/domain/schedule.ts src/domain/rules/mora.ts src/views/obligaciones/*.svelte src/views/onboarding/Onboarding.svelte`
- Prueba en teléfono real de M6, `POST_NOTIFICATIONS`, etiqueta `v0.1.0`.

## Qué se verificó y qué no
- Verificado: 16 pruebas en Node 22 (3 + 9 + 4; las de `ajustesMenu` siguen en 3).
- **No verificado**: `Feriados.svelte`, tipos (`svelte-check`) y aspecto.

## Actualizar en el proyecto
- `01-reglas-fiscales-tcp.md`: lo descrito arriba.
- `03-vistas-y-flujos.md`: sustituir por el del zip.
- `05-plan-de-desarrollo.md`: V14 completa en v0.1.
- `04-modelo-de-datos.md`: nota en `Feriado`: la carga el usuario, con botón para los fijos.

## Pasos para aplicar (Termux)
```bash
cd ~/miapp && git pull
unzip -o ~/storage/downloads/m6-paso5a2.zip
npm test
npx svelte-check
npm run build
```
Esperado: `471 passed` (455 del paso 4e + 16), tanto si aplicaste el 5a como si no.

```bash
git add .
git commit -m "feat: add holidays view with fixed Cuban holidays (M6 step 5a)"
git push
```

## Cómo probar
1. Menú [☰], Ajustes, Feriados: tarjeta "Feriados fijos" con el año actual.
2. Pulsa "Añadir los feriados fijos": "Se añadieron 4 feriados." y salen 1 ene, 1 may, 26 jul y 10 oct de 2026.
3. Púlsalo otra vez: "Ya estaban todos en la lista."
4. Cambia el año a 2027 y púlsalo: aparecen también bajo 2027.
5. Quita uno y usa "Deshacer".
