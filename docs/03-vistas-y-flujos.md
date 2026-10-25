# Vistas y flujos

17 vistas en total: 12 en el MVP (v0.1), 4 en v0.2 y 1 en v0.3.

## 1. Navegación

Barra inferior con 5 pestañas:

| Pestaña | Vista raíz |
|---|---|
| Inicio | V02 |
| Calendario | V03 |
| Registro | V06 |
| Estadísticas | V09 (en v0.1 la pestaña muestra "Calculadora", V08) |
| Más | V14 (Ajustes y accesos a Documentos, Declaración, Guía, Empleados) |

Rutas con hash:

```
#/onboarding
#/                         V02 Inicio
#/calendario               V03
#/obligaciones             V04
#/obligaciones/:id         V05
#/registro                 V06
#/registro/nuevo           V07
#/registro/:id             V07 (editar)
#/calculadora              V08
#/estadisticas             V09
#/declaracion              V10
#/documentos               V11
#/empleados                V12
#/guia                     V13
#/ajustes                  V14
#/ajustes/respaldo         V15
#/ajustes/notificaciones   V16
#/ajustes/perfil           V17
```

## 2. Lista de vistas

### V01 Onboarding (v0.1)
- **Objetivo**: dejar la app lista en menos de 3 minutos.
- **Pasos**: (1) bienvenida y aviso de que todo queda en el teléfono; (2) perfil: nombre visible, actividad, ¿tiene empleados?; (3) tributos que le aplican, marcados según su vector fiscal; (4) permiso de notificaciones; (5) fechas del año: elegir "Usar patrón" o "Copiar del vector" y confirmar. Se crean las obligaciones del año en curso cuya fecha calculada cae desde el día 1 del mes actual; las de meses anteriores no se crean. Con "Copiar del vector" se escribe la fecha de cada periodo y lo que quede en blanco usa el patrón.
- **Escribe**: Perfil, Ajustes, Obligaciones del año.
- **Vacíos/errores**: si se deniega el permiso de notificaciones, continuar y mostrar un aviso en Inicio (el estado queda en Ajustes, clave `notificacionesPermiso`). No se guarda nada hasta el último paso; si el guardado falla, el perfil no queda completo y se puede reintentar.

### V02 Inicio (v0.1)
- **Objetivo**: responder "¿qué tengo que pagar y qué hago hoy?"
- **Contenido**:
  - Tarjeta "Próximo vencimiento" (tributo, fecha, días restantes, importe estimado).
  - Lista de vencimientos de los próximos 30 días, con color por urgencia (verde, amarillo, rojo).
  - Resumen del mes: ingresos, gastos, impuesto estimado.
  - Alertas: obligaciones vencidas, permiso de notificaciones denegado, "hace X días sin respaldo".
  - Botón rápido "+ Ingreso" y "+ Gasto".
- **Acciones**: tocar una obligación abre V05; botones rápidos abren V07.
- **Reglas de la lista** (implementadas en `src/app/inicio.ts`):
  - Solo cuentan las obligaciones pendientes; pagadas y omitidas no salen.
  - Vencida: fecha anterior a hoy. Si vence hoy, es "urgente".
  - "Próximo vencimiento": la primera pendiente desde hoy, aunque pase de 30 días. "Próximos 30 días" incluye el día 30.
  - Color por días restantes: 0 a 3 rojo, 4 a 7 amarillo, 8 o más verde, vencida rojo. Son umbrales de interfaz, no reglas fiscales; el 7 coincide con el primer aviso de `02`, sección 5.
  - Las vencidas salen en su propia sección "Vencidas" y en la alerta de arriba.
  - Importe de la tarjeta: oficial ("según el vector"), si no estimado (con `~`), si no "Importe por definir". Siempre con el aviso de importes orientativos.
- **Estado de implementación**:
  - Hecho en M4: saludo, alertas de vencidas y de notificaciones denegadas, próximo vencimiento, próximos 30 días, vencidas.
  - Llega en M5: resumen del mes y botones "+ Ingreso" y "+ Gasto" (necesitan movimientos y calculadora).
  - Llega en M6: alerta "hace X días sin respaldo" (necesita guardar la fecha del último respaldo) y el enlace a V16.
  - La barra inferior de navegación se añade cuando existan las vistas de las 5 pestañas.

```
+------------------------------+
| Hola, Rolando        [Ajustes]|
| PRÓXIMO VENCIMIENTO          |
| Ventas y servicios           |
| 20 nov  (en 31 días)  ~ 1,250|
|------------------------------|
| Este mes                     |
| Ingresos   12,500.00         |
| Gastos      3,100.00         |
| Impuesto est.  1,250.00      |
|------------------------------|
| [+ Ingreso]     [+ Gasto]    |
| Próximos 30 días             |
|  . 13 nov  Contrib. SS       |
|  . 20 nov  ISIP mensual      |
+------------------------------+
| Inicio|Calend.|Registro|Est.|Más|
+------------------------------+
```

### V03 Calendario fiscal (v0.1)
- **Objetivo**: ver los vencimientos del mes y del año.
- **Contenido**: vista de mes con puntos de color por día, y lista del día seleccionado. Alternar a vista de lista del año.
- **Acciones**: tocar un vencimiento abre V05; filtro por tributo.
- **Reglas** (implementadas en `src/app/calendario.ts`):
  - La semana empieza el lunes. El mes se muestra en semanas completas; los días de los meses vecinos salen atenuados y no se pueden tocar.
  - Muestra todas las obligaciones (pendientes, pagadas y omitidas), no solo las pendientes.
  - Un día con varias obligaciones muestra el punto de la más urgente y, si son más de una, su número. Orden de gravedad: vencida, urgente, pronto, a tiempo, pagada, omitida.
  - Colores de pendientes: los mismos umbrales de V02. Pagada gris azulado, omitida gris. Hay leyenda de colores.
  - Al abrir un mes se selecciona hoy (si es el mes actual) o el día 1.
  - Vista "Año": lista agrupada por mes de vencimiento, para el año elegido. Una fecha que cae en enero del año siguiente sale en ese año, no en el del periodo.
  - El filtro por tributo ofrece solo los tributos que tienen obligaciones generadas y afecta a las dos vistas.
- **Estado de implementación**: hecho en M4. No hay ficha de importes en esta vista (los importes se ven en V02 y V05).

### V04 Obligaciones (v0.1)
- **Objetivo**: lista completa filtrable.
- **Contenido**: filtros Pendientes, Pagadas, Vencidas; agrupadas por mes; cada fila con tributo, período, fecha límite, importe y estado.
- **Acciones**: tocar abre V05; botón "Editar fechas del año" (copiar del vector).
- **Reglas** (implementadas en `src/app/obligacionesList.ts`):
  - Cuatro filtros excluyentes con contador: Pendientes, Vencidas, Pagadas, Omitidas. Se añade "Omitidas" a los tres del plan para poder ver las que se omitieron.
  - Pendientes: todas las de estado pendiente, **incluidas las vencidas** (salen en rojo). Vencidas: pendientes con fecha anterior a hoy, un subconjunto de Pendientes. Si vence hoy, no es vencida.
  - Por defecto se abre en Pendientes. Agrupadas por mes de la fecha límite, de la más próxima a la más lejana.
  - Cada fila: tributo, período, fecha límite, importe y estado. Importe: lo pagado si está pagada; si no, el oficial; si no, el estimado; si no, "Importe por definir".
- **Editar fechas del año** (botón en la misma vista; `src/app/editDates.ts`):
  - Abre una pantalla con las obligaciones **pendientes** del año, agrupadas por tributo. Cada fila muestra la fecha actual, la fecha del patrón y un campo de fecha para escribir la del vector.
  - Solo se guardan las filas que cambian (fecha válida y distinta). Se guardan con origen "vector". Las pagadas y omitidas no se tocan; el repositorio además bloquea las pagadas.
  - El año es el del período (la anual 2026, con fecha en abril de 2027, se edita en 2026). Si hay más de un año con pendientes, se puede cambiar de año.
  - Al guardar vuelve a la lista con un aviso de cuántas fechas se cambiaron y, si alguna falló, cuántas.
  - Pendiente: reprogramar los avisos de las fechas cambiadas (M6, notificaciones) y los feriados reales.
- **Estado de implementación**: lista, filtros y edición de fechas hechos en M4.

### V05 Detalle y ficha de pago (v0.1)
- **Objetivo**: tener a mano todo lo necesario para pagar y registrar que se pagó.
- **Contenido**:
  - Datos: tributo, código, período, fecha límite y origen de la fecha, código de barras, importe estimado e importe oficial editable.
  - **Ficha de pago** con botones para copiar: RC-05 con y sin guiones, código de tributo, código de barras, importe.
  - Si hoy supera la fecha límite: recargo por mora estimado y días hábiles de retraso.
  - Opción "Pago por canal electrónico (-3 %)".
- **Acciones**: Marcar como pagada (fecha, importe real, canal, comprobante opcional); Compartir ficha; Omitir (con motivo); Editar fecha.
- **Estados**: pendiente, pagada, vencida, omitida.

### V06 Registro (v0.1)
- **Objetivo**: ver ingresos y gastos.
- **Contenido**: selector de mes, totales arriba, lista de movimientos con categoría, monto y marca de "justificado". Filtro Ingresos/Gastos.
- **Acciones**: tocar abre V07; botón "+" flotante.
- **Vacío**: ilustración y botón "Registrar el primer ingreso".

### V07 Movimiento (v0.1)
- **Objetivo**: registrar un ingreso o gasto en pocos toques.
- **Campos**: tipo, monto, fecha (por defecto hoy), categoría, descripción, cliente o proveedor, método (efectivo, transferencia, otro), "¿Cuenta para el impuesto de ventas y servicios?" (por defecto sí en ingresos), "¿Tengo comprobante?" (justificado), adjunto (v0.2).
- **Acciones**: Guardar, Guardar y añadir otro, Eliminar (con deshacer).
- **Validaciones**: monto mayor que 0, fecha válida.

### V08 Calculadora del mes (v0.1)
- **Objetivo**: estimar lo que corresponde pagar por un mes.
- **Contenido**: toma los ingresos del mes de V06 (editable) y muestra desglose de 0114022 y 0510122, total estimado, y total con descuento del 3 % si paga electrónicamente. Aviso: "Estimación orientativa. Confirma con tu vector fiscal".
- **Acciones**: "Usar como importe estimado" en la obligación del mes.

### V09 Estadísticas (v0.2)
- **Contenido**: ingresos y gastos por mes (barras), neto, impuesto estimado vs pagado, % de pagos a tiempo, gastos por categoría, acumulado del año frente al límite de 500,000.
- **Acciones**: cambiar año; exportar resumen compartible.

### V10 Declaración jurada anual (v0.2)
- **Contenido**: ingresos del año, mínimo exento 39,120, gastos justificados vs no justificados (regla del 80 %), aportes SS deducibles, base estimada, impuesto (pendiente de escala), bonificación 5 % si paga antes del 28/02.
- **Estado**: bloqueada hasta tener la escala del ISIP anual (ver `01`).

### V11 Documentos (v0.2)
- **Contenido**: lista de documentos guardados en el teléfono (vector fiscal, RC-05, licencia, comprobantes de pago) con etiqueta, fecha y tipo.
- **Acciones**: añadir desde archivos o cámara, ver, compartir, eliminar.

### V12 Empleados y nómina (v0.3)
- **Contenido**: empleados, remuneración mensual, retención de ISIP y contribución especial calculadas, aportes de la empresa (0610322, 0810132).

### V13 Guía y normativa (v0.2)
- **Contenido**: explicación en lenguaje sencillo de cada tributo, recargos por mora, obligaciones formales, glosario (RC-05, vector fiscal, días hábiles), y de dónde salen las reglas.
- **Acciones**: búsqueda simple.

### V14 Ajustes (v0.1)
- Hub con accesos a Perfil, Notificaciones, Respaldo, Feriados, Apariencia (claro/oscuro), Acerca de (versión de la app y de las reglas).

### V15 Respaldo y datos (v0.1)
- Exportar respaldo y compartirlo, importar desde archivo, fecha del último respaldo, recordatorio mensual, opción "incluir datos personales", borrar todos los datos (doble confirmación).

### V16 Notificaciones (v0.1)
- Permiso: estado y botón para pedirlo o abrir ajustes del sistema.
- Preferencias: desfases (7, 3, 1, 0 días), hora, recordatorio de registro mensual.
- Guía de batería para que Android no cierre la app.
- Botón "Enviar notificación de prueba".

### V17 Perfil y tributos activos (v0.1)
- Campos: nombre visible, código y nombre de actividad, municipio y código de municipio, fecha de inscripción fiscal, RC-05 (16 dígitos) y NIT (11 dígitos), ambos opcionales y solo locales; ¿tiene empleados?; lista de tributos activos.
- RC-05 y NIT se aceptan con guiones o espacios y se guardan sin ellos. Un campo opcional vacío se borra del perfil.
- Los tributos de empleados se sugieren según "tiene empleados" mientras el usuario no edite la lista a mano; hay un botón para restablecer la sugerencia.
- Cambiar los tributos activos no crea ni borra obligaciones ya generadas; la vista lo avisa.
- Al guardar un cambio de actividad (código o nombre) o de municipio (nombre o código), mostrar el recordatorio de los 30 días para informar a la ONAT. Nombre visible, RC-05, NIT, empleados y tributos no lo disparan.
- Tras restaurar un respaldo sin datos personales, RC-05 y NIT quedan vacíos y se pueden volver a escribir.
- **Escribe**: Perfil. Solo guarda si hay cambios y la validación pasa.

## 3. Resumen por versión

| Versión | Vistas |
|---|---|
| v0.1 (12) | V01, V02, V03, V04, V05, V06, V07, V08, V14, V15, V16, V17 |
| v0.2 (4) | V09, V10, V11, V13 |
| v0.3 (1) | V12 |

## 4. Flujos clave

**F1 Primer uso**: abrir app, V01 (cinco pasos), llegar a V02 con el calendario ya generado desde el mes actual.

**F2 Registrar un ingreso**: V02, botón "+ Ingreso", V07, Guardar, vuelve a V02 con el resumen actualizado.

**F3 Pagar una obligación**: aviso del sistema o V02, V05, copiar datos de la ficha, pagar fuera de la app, volver, "Marcar como pagada" (fecha, importe, canal), se cancelan los avisos pendientes y la obligación pasa a pagada. Si fue tarde, se anota el recargo por mora.

**F4 Cierre de mes**: aviso de fin de mes, V06 para completar movimientos, V08 para estimar, "Usar como importe estimado", se actualiza V05 de las obligaciones del mes siguiente.

**F5 Respaldo**: V15, Exportar, compartir el archivo a WhatsApp, correo o almacenamiento, queda registrada la fecha del último respaldo.

**F6 Restaurar**: V15, Importar, elegir archivo, validación, respaldo automático previo, confirmación, reemplazo y reprogramación de notificaciones.

## 5. Componentes reutilizables

Tarjeta, Chip de estado, Fila de obligación, Fila de movimiento, Campo de monto (teclado numérico, formato CUP), Campo de fecha, Selector de mes, Estado vacío, Diálogo de confirmación, Toast con deshacer, Botón de copiar con confirmación, Aviso de "estimación orientativa".
