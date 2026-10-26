# Registro de sesión 31: M6 paso 2 (alerta de respaldo en Inicio)

Fecha: 26/10/2026

## Creado / modificado
Sin dependencias nuevas, sin lógica fiscal. Se leyó `Inicio.svelte` real.

| Ruta | Contenido |
|---|---|
| `src/app/inicioRespaldo.ts` | `showBackupAlert(state, reminderOn)` |
| `src/app/inicioRespaldo.test.ts` | 3 pruebas |
| `src/i18n/inicioRespaldo.ts` | `inicioRespaldo.text(state)` y `inicioRespaldo.link` (archivo aparte: no toqué `i18n/inicio.ts`, que no tenía a la vista) |
| `src/i18n/inicioRespaldo.test.ts` | 2 pruebas |
| `src/views/inicio/Inicio.svelte` | **Reemplazado**: alerta de respaldo dentro del bloque "Alertas", con enlace a `#/ajustes/respaldo` |

## Decisiones
- La alerta sale si **no hay respaldo** o si el último tiene **30 días o más** (`backupState`, sesión 29). Con un respaldo reciente no sale.
- Si el usuario desactiva "Recordarme cada mes hacer un respaldo" en V15, la alerta se oculta.
- Un usuario nuevo verá "Aún no has hecho ningún respaldo." desde el primer día. Es intencional (sus datos solo viven en el teléfono); si molesta, se puede exigir antes algún movimiento registrado.
- La carga es independiente y silenciosa: si falla la lectura de ajustes, la alerta no se muestra y el resto de Inicio no cambia.
- El pegado de `Inicio.svelte` llegó sin el `<` de la primera línea (`script lang="ts">`). El archivo entregado está completo y correcto.

## Pendiente
- V14 Ajustes (el botón "Ajustes" de Inicio lleva a `#/ajustes`, que aún no existe) con acceso a V15, V16 y V17.
- Servicio de notificaciones completo (canales, ventana de 60 días, reprogramación) y V16.
- Cancelar o reprogramar avisos tras pagar, omitir, reabrir, cambiar fechas, restaurar o borrar.
- Feriados reales y pendientes fiscales de `01`, sección 7.

## Qué se verificó y qué no
- Verificado: la lógica de `showBackupAlert` y los textos en Node 22.
- **No verificado**: `Inicio.svelte`, tipos y las 5 pruebas con Vitest (npm bloqueado en la sesión).

## Actualizar en el proyecto
- `03-vistas-y-flujos.md`, V02, "Estado de implementación": cambiar "Llega en M6: alerta 'hace X días sin respaldo'..." por "Hecho en M6: alerta 'sin respaldo' (nunca o 30 días o más; se oculta si el recordatorio mensual está desactivado) con enlace a V15. Pendiente: enlace a V16".

## Pasos para aplicar (Termux)

```bash
cd ~/miapp && git pull
unzip -o ~/storage/downloads/m6-paso2.zip
npm test
npx svelte-check
npm run build
```
`npm test`: 5 pruebas nuevas. Total esperado `391 passed` (386 + 5). Si `svelte-check` marca un error, pega el mensaje completo.

```bash
git add .
git commit -m "feat: add backup alert to home (V02)"
git push
```

## Cómo probar
1. `npm run dev -- --host`, abre `#/`. Sin respaldo previo, en "Alertas" debe salir "Aún no has hecho ningún respaldo." con el enlace "Hacer un respaldo".
2. Toca el enlace, exporta un respaldo y vuelve a `#/`: la alerta desaparece.
3. En `#/ajustes/respaldo` desmarca "Recordarme cada mes..." y borra el respaldo anotado (borrar todos los datos y restaurar uno viejo, o simplemente prueba con un usuario sin respaldo): con el recordatorio apagado la alerta no sale.
4. Marca de nuevo el recordatorio: la alerta vuelve si no hay respaldo reciente.
5. Modo avión: todo sigue funcionando.
