# Registro de sesión 32: actualización de `03-vistas-y-flujos.md`

Fecha: 26/10/2026

Solo documentación. Sin código ni pruebas; `npm test` no cambia (391).

## Qué se actualizó en `docs/03-vistas-y-flujos.md`

| Vista | Cambio (sesión de origen) |
|---|---|
| V01 | Guardián: sin onboarding solo `/onboarding` y `/ajustes/respaldo` (5) |
| V02 | Estado: resumen del mes y botones hechos en M5 (26); alerta de respaldo hecha en M6 (31); pendientes de V14 y V16 |
| V06 | Reglas: totales del mes completo sin depender del filtro, lista por día, botón "+" según filtro (23) |
| V07 | Reglas: formato del monto, tipo inicial por `?tipo=`, "guardar y añadir otro", editar y eliminar con deshacer (20, 21) |
| V08 | Reglas: dos bases (ventas y totales), descuento por pago, "Usar como importe estimado" (24, 25) |
| V14 | Estado: pendiente |
| V15 | Reglas y estado: ajustes, umbral de 30 días, importar, borrar (29, 30) |
| V16 | Estado: pendiente, solo existe el permiso |

Sin cambios: V03, V04, V05 (ya estaban al día), V09 a V13, V17, navegación, flujos.

## Pendiente de actualizar en otros archivos (de los registros)
- `04-modelo-de-datos.md`, sección 2: comentario de `cuentaParaVentas` (`// ingreso sujeto a 0114022; 0510122 usa todos los ingresos`, sesión 24); comentarios de `importePagado` y `recargoMora` (sesión 17); y las tres claves de ajustes nuevas (`ultimoRespaldo`, `respaldoIncluirPersonales`, `respaldoRecordatorio`).
- `05-plan-de-desarrollo.md`: M5 hecho (26/10/2026; V07 sesión 21, V06 sesión 23, V08 sesiones 24 y 25, resumen de Inicio sesión 26) y M6 en curso (V15 y alerta de respaldo hechos, sesiones 29 a 31). M4 sigue como hecho; los registros 12 y 14 a 19 lo cubren.
- Si quieres, pega esos dos archivos y los actualizo.

## Pasos para aplicar (Termux)

```bash
cd ~/miapp && git pull
unzip -o ~/storage/downloads/m6-docs-03.zip
git diff --stat docs
git add docs
git commit -m "docs: update views and flows after M5 and V15"
git push
```
Si usas el Project de claude.ai, sustituye ahí `03-vistas-y-flujos.md` y añade el registro 32.

## Cómo probar
Nada que probar en la app. Abre `docs/03-vistas-y-flujos.md` y comprueba que V06, V07, V08 y V15 traen su bloque de reglas.
