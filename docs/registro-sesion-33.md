# Registro de sesión 33: M6 paso 3a (avisos, lógica pura)

Fecha: 26/10/2026

## Creado / modificado
Sin dependencias nuevas, sin lógica fiscal. Solo decide **qué avisos deben existir**; programarlos en Android es el paso 3b.

| Ruta | Contenido |
|---|---|
| `src/app/avisos.ts` | `planNotices(obligaciones, nowLocal, settings?)`, `noticeId(obligacionId, offset)`, `parseAvisosSettings`, `whenText`, constantes `DEFAULT_AVISOS`, `WINDOW_DAYS` (60), `MAX_OFFSET_DAYS` (30), `SETTING_AVISOS` (`avisosConfig`) |
| `src/app/avisos.test.ts` | 16 pruebas |

## Reglas (de `02`, sección 5)
- Avisos a **7, 3 y 1 día antes** y **el mismo día**, a las **09:00** (hora y días configurables; V16 los editará).
- Solo obligaciones **pendientes** y aún no vencidas.
- Ventana de **60 días**: cuenta la fecha del aviso, no la del vencimiento. Un aviso cuya hora ya pasó no se programa.
- Título: nombre corto del tributo. Cuerpo: `Octubre 2026: vence en 7 días.` (también `vence mañana`, `vence hoy`).
- Resultado ordenado por hora y luego por id.

## Decisiones
- **Id del aviso** = 26 bits del hash (FNV-1a) del id de la obligación × 32 + días antes (0 a 30). Entero de 31 bits, determinista. Una colisión entre obligaciones es muy improbable (alrededor de 1 en 100,000 con 40 obligaciones); por eso el servicio también cancelará por `extra.obligacionId`.
- Los días antes se limitan a 0 a 30. Los ajustes inválidos vuelven a los valores por defecto.
- Fechas con ayudante local (`Date.UTC` sobre `YYYY-MM-DD`), sin zonas horarias, como en `inicio.ts`.
- **No se avisa de las ya vencidas** (`02` no lo pide). Si se quiere, se añade luego un aviso diario de vencidas.
- Recordatorios mensuales (registrar movimientos, calculadora, respaldo): paso aparte.

## Pendiente
- Paso 3b: `src/services/notifications.ts` (canal `vencimientos`, cancelar los pendientes propios y programar el plan) y `src/stores/avisos.ts` (leer ajustes, listar pendientes y reprogramar). **No vi `notifications.ts`**; hay que pegarlo.
- Engancharlo: al abrir la app, al volver al primer plano, y tras pagar, omitir, reabrir, cambiar fechas, restaurar o borrar (puntos: `stores/obligaciones.ts` y V15).
- Tocar una notificación abre V05 (`#/obligaciones/:id`).
- V16 y prueba en teléfono real (reinicio, app cerrada, permiso denegado).
- Feriados reales y pendientes fiscales de `01`, sección 7.

## Qué se verificó y qué no
- Verificado: las 16 pruebas pasan en Node 22 con un sustituto mínimo de Vitest y un catálogo simulado (solo para `findTributo`).
- **No verificado**: Vitest real, `svelte-check`, y el catálogo real (la prueba compara el título con `findTributo('0114022')?.shortName`).

## Actualizar en el proyecto
- `02-arquitectura-y-stack.md`, sección 3: añadir `avisos.ts` en `src/app/`.
- `04-modelo-de-datos.md`, sección 2 (Ajustes): clave `avisosConfig`.

## Pasos para aplicar (Termux)

```bash
cd ~/miapp && git pull
unzip -o ~/storage/downloads/m6-paso3a.zip
npm test
npx svelte-check
```
`npm test`: 16 pruebas nuevas. Total esperado `407 passed` (391 + 16). Si tu total difiere pero no falla ninguna, está bien.

```bash
git add .
git commit -m "feat: add deadline notice planning logic (M6 step 3a)"
git push
```

## Cómo probar
Solo pruebas automáticas: aún no se programa nada en el teléfono.

## Siguiente paso
Paso 3b: pega
```bash
cat src/services/notifications.ts
grep -n "export" src/stores/obligaciones.ts
```
