# Vistas y flujos

17 vistas en total: 12 en el MVP (v0.1), 4 en v0.2 y 1 en v0.3.

## 1. Navegación

**Decisión (27/10/2026)**: en v0.1 la navegación es un **menú desplegable [☰]** en la barra superior (`src/app/nav.ts`, `src/views/shell/Menu.svelte`) con Inicio, Calendario, Obligaciones, Registro, Calculadora y Ajustes. Perfil, Notificaciones, Respaldo y Acerca de están dentro de Ajustes (V14). La barra inferior de 5 pestañas queda aplazada; si se retoma, el botón "+" de V06 debe subir sobre ella. La app respeta las barras del teléfono con `--sat`, `--sab`, `--sal` y `--sar` (`src/app/shell.css`).

Diseño original (aplazado): barra inferior con 5 pestañas:

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
#/ajustes/acerca           V14 (Acerca de)
#/ajustes/perfil           V17
```

## 2. Lista de vistas

### V01 Onboarding (v0.1)
- **Objetivo**: dejar la app lista en menos de 3 minutos.
- **Pasos**: (1) bienvenida y aviso de que todo queda en el teléfono; (2) perfil: nombre visible, actividad, ¿tiene empleados?; (3) tributos que le aplican, marcados según su vector fiscal; (4) permiso de notificaciones; (5) fechas del año: elegir "Usar patrón" o "Copiar del vector" y confirmar. Se crean las obligaciones del año en curso cuya fecha calculada cae desde el día 1 del mes actual; las de meses anteriores no se crean. Con "Copiar del vector" se escribe la fecha de cada periodo y lo que quede en blanco usa el patrón.
- **Escribe**: Perfil, Ajustes, Obligaciones del año.
- **Vacíos/errores**: si se deniega el permiso de notificaciones, continuar y mostrar un aviso en Inicio (el estado queda en Ajustes, clave `notificacionesPermiso`). No se guarda nada hasta el último paso; si el guardado falla, el perfil no queda completo y se puede reintentar.
- **Guardián** (`src/app/guard.ts`): sin onboarding completo solo se permiten `/onboarding` y `/ajustes/respaldo` (V15), para restaurar un respaldo en un teléfono nuevo sin rehacer el asistente. Cualquier otra ruta redirige a `/onboarding`. Con onboarding completo, `/onboarding` redirige a Inicio.

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
  - Hecho en M5: resumen "Este mes" (ingresos, gastos e impuesto estimado = 0114022 + 0510122 con las mismas bases que V08, sin descuento; se lee al abrir Inicio y, si falla, las obligaciones se ven igual), botones "+ Ingreso" y "+ Gasto" (abren V07 con el tipo elegido) y enlaces a Registro y Calculadora.
  - Hecho en M6: alerta "sin respaldo" (`src/app/inicioRespaldo.ts`): sale si nunca se hizo un respaldo o el último tiene 30 días o más, y se oculta si el recordatorio mensual de V15 está desactivado. Enlaza a V15.
  - El botón "Ajustes" (`#/ajustes`) abre V14.
  - La navegación es el menú desplegable [☰] (ver sección 1).

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
  - Al guardar se reprograman los avisos (M6). Pendiente: los feriados reales.
- **Generar el año siguiente** (`src/app/nextYear.ts`): si el año siguiente al de hoy aún no tiene obligaciones, aparece el botón "Generar obligaciones de AAAA". Muestra cuántas se crearán y el rango de fechas, y las crea con fechas **calculadas por patrón** (son una propuesta) para los tributos activos del perfil. Es idempotente. Después se ajustan con "Editar fechas del año". El año cuenta por el período, no por la fecha: un diciembre con vencimiento en enero no cuenta como del año siguiente.
- **Estado de implementación**: lista, filtros, edición de fechas y generar el año siguiente, hechos en M4.

### V05 Detalle y ficha de pago (v0.1)
- **Objetivo**: tener a mano todo lo necesario para pagar y registrar que se pagó.
- **Contenido**:
  - Datos: tributo, código, período, fecha límite y origen de la fecha, código de barras, importe estimado e importe oficial editable.
  - **Ficha de pago** con botones para copiar: RC-05 con y sin guiones, código de tributo, código de barras, importe.
  - Si hoy supera la fecha límite: recargo por mora estimado y días hábiles de retraso.
  - Opción "Pago por canal electrónico (-3 %)".
- **Acciones**: Marcar como pagada (fecha, importe real, canal, comprobante opcional); Compartir ficha; Omitir (con motivo); Editar fecha.
- **Estados**: pendiente, pagada, vencida, omitida.
- **Reglas** (implementadas en `src/app/pago.ts`, con `mora.ts`, `descuento.ts` y `businessDays.ts` del dominio):
  - Importe base: el oficial; si no hay, el estimado; si no hay ninguno, no se puede estimar recargo ni descuento.
  - Recargo por mora: se calcula con los días hábiles entre la fecha límite y la fecha de pago (hoy en la estimación; la fecha elegida al pagar). Sin feriados, cuenta lunes a viernes y la pantalla lo avisa. Tramos de `01`, sección 4.
  - Descuento del 3 %: solo con canal electrónico, sobre el importe base. Se desconoce si aplica también al recargo (`01` no lo dice): aquí no se aplica.
  - **`importePagado` es el importe del tributo después del descuento, sin el recargo.** El recargo se anota aparte en `recargoMora` (es otro tributo, 1060122). Así "impuesto pagado" de V09 no mezcla mora.
  - Marcar como pagada: fecha (no futura), importe, canal, descuento y recargo, que se rellenan con la estimación y se pueden corregir; notas opcionales. Al cambiar fecha o canal se recalculan importe y recargo.
  - Omitir pide un motivo opcional. Una obligación pagada u omitida se puede volver a pendiente (se borran los datos del pago).
  - La ficha ofrece copiar: RC-05 con y sin guiones, código de tributo, código de barras e importe (sin separadores, p. ej. `1250.50`).
- **Compartir ficha** (`src/app/ficha.ts`, `src/services/share.ts`): comparte un texto con tributo, período, fecha límite, código de barras e importe. El RC-05 va **solo si se marca** "Incluir mi RC-05" (es un dato personal). Si el sistema no puede compartir, se copia el texto y se avisa.
- **Editar datos** (`src/app/detalleEdit.ts`): fecha límite (con origen "del vector" o "manual"), código de barras e importe oficial, solo en obligaciones pendientes. No se puede vaciar un código de barras ni un importe ya guardados (el repositorio no lo permite).
- **Estado de implementación**: V05 completa en M4. **Pendiente**: comprobante adjunto (v0.2). Al pagar, omitir, reabrir o cambiar la fecha se reprograman los avisos (M6).

### V06 Registro (v0.1)
- **Objetivo**: ver ingresos y gastos.
- **Contenido**: selector de mes, totales arriba, lista de movimientos con categoría, monto y marca de "justificado". Filtro Ingresos/Gastos.
- **Acciones**: tocar abre V07; botón "+" flotante.
- **Vacío**: ilustración y botón "Registrar el primer ingreso".
- **Reglas** (implementadas en `src/app/registro.ts` y `registroMonth.ts`):
  - Los totales (ingresos, gastos, neto) son del mes completo y **no dependen del filtro**; el filtro solo cambia la lista. El neto negativo se muestra con `-` delante.
  - La lista va agrupada por día, del más reciente al más antiguo. Cada fila: descripción (o la categoría si no hay), categoría, cliente o proveedor, monto con `+` o `-` y la marca "Con comprobante" en gastos justificados. El signo y los textos dicen el tipo; el color no es lo único que informa.
  - Abre en el mes actual; `‹` y `›` cambian de mes.
  - El botón "+" abre un gasto nuevo si el filtro es Gastos; en cualquier otro caso, un ingreso.
  - Sin movimientos en el mes: "Registrar el primer ingreso". Con filtro sin resultados: solo el mensaje.
- **Estado de implementación**: hecho en M5. El botón "+" no necesita ajuste mientras la navegación sea el menú desplegable.

### V07 Movimiento (v0.1)
- **Objetivo**: registrar un ingreso o gasto en pocos toques.
- **Campos**: tipo, monto, fecha (por defecto hoy), categoría, descripción, cliente o proveedor, método (efectivo, transferencia, otro), "¿Cuenta para el impuesto de ventas y servicios?" (por defecto sí en ingresos), "¿Tengo comprobante?" (justificado), adjunto (v0.2).
- **Acciones**: Guardar, Guardar y añadir otro, Eliminar (con deshacer).
- **Validaciones**: monto mayor que 0, fecha válida, categoría existente y del mismo tipo.
- **Reglas** (implementadas en `src/app/registro.ts` y `registroRoutes.ts`):
  - Monto escrito: acepta `1250.50`, `1,250.50`, `1.250,50`, `12,5` y `1 250`. Un solo separador seguido de exactamente 3 dígitos se lee como miles. Más de 2 decimales, negativos o letras se rechazan.
  - El tipo inicial viene de `?tipo=gasto` en el enlace (sin parámetro, ingreso). Cambiar de tipo vacía la categoría si era del otro tipo y restablece "cuenta para ventas" (sí en ingreso, no en gasto).
  - Un gasto nunca cuenta para ventas; un ingreso nunca es "justificado" (esa marca es para la regla del 80 % de gastos).
  - "Guardar" vuelve a Registro. "Guardar y añadir otro" (solo al crear) limpia monto, descripción y cliente, y conserva tipo, fecha, categoría y método.
  - Editar reemplaza el registro completo (conserva `id` y `creadoEn`), así vaciar la descripción o el cliente funciona.
  - Eliminar es inmediato, con "Deshacer" en la misma pantalla; si se sale sin deshacer, queda eliminado.
- **Estado de implementación**: hecho en M5. Adjunto: v0.2.

### V08 Calculadora del mes (v0.1)
- **Objetivo**: estimar lo que corresponde pagar por un mes.
- **Contenido**: toma los ingresos del mes de V06 (editable) y muestra desglose de 0114022 y 0510122, total estimado, y total con descuento del 3 % si paga electrónicamente. Aviso: "Estimación orientativa. Confirma con tu vector fiscal".
- **Acciones**: "Usar como importe estimado" en la obligación del mes.
- **Reglas** (implementadas en `src/app/calculadora.ts` y `calculadoraLink.ts`, con `ventas.ts`, `isipMensual.ts` y `descuento.ts` del dominio):
  - Dos campos editables con dos bases distintas, según `01`, sección 3: 0114022 usa los ingresos **por ventas y servicios** (los marcados "cuenta para el impuesto de ventas y servicios"); 0510122 usa los ingresos **totales** del mes. Ambas salen del registro del mes y se pueden editar para probar otras cifras ("Usar los del registro" las restablece).
  - Validación: cero se acepta; vacío o texto no válido, no; ventas mayores que ingresos totales, no. Con error no se muestra el resultado.
  - Desglose: base, tasa, mínimo exento (3,260.00 para 0510122), impuesto de cada tributo y total. No se manejan las excepciones del vector (agentes de telecomunicaciones y de seguros).
  - Descuento del 3 %: bloque aparte "Si pagas por canal electrónico", calculado por cada impuesto (cada uno se paga en su obligación), no sobre el total.
  - "Usar como importe estimado": guarda el impuesto **sin** descuento en `importeEstimado` de la obligación **pendiente** mensual cuyo período es el mes de los ingresos (vence el mes siguiente). Si no existe, está pagada u omitida, o ya tiene ese mismo estimado, lo explica y no ofrece el botón. Si hay importe oficial, avisa de que V05 muestra el oficial.
  - Siempre con el aviso "Estimación orientativa. Confirma con tu vector fiscal".
- **Estado de implementación**: hecho en M5.

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
- **Regla** (`src/app/ajustesMenu.ts`): la lista y su orden salen de `AJUSTES_MENU`; una entrada sin ruta se muestra atenuada con "Próximamente".
- **Estado de implementación**: hub hecho en M6 con enlaces a Perfil, Notificaciones y Respaldo. Acerca de hecho (`#/ajustes/acerca`: versión de la app, versión de las reglas y el aviso de cálculos orientativos). Pendiente: Feriados (lista editable; faltan los feriados reales, `01` sección 7) y Apariencia (tema claro/oscuro).

### V15 Respaldo y datos (v0.1)
- Exportar respaldo y compartirlo, importar desde archivo, fecha del último respaldo, recordatorio mensual, opción "incluir datos personales", borrar todos los datos (doble confirmación).
- **Reglas** (implementadas en `src/app/respaldo.ts`, `src/stores/respaldo.ts` y `src/services/backupService.ts`):
  - Ajustes: `ultimoRespaldo`, `respaldoIncluirPersonales` (por defecto no) y `respaldoRecordatorio` (por defecto sí). El recordatorio solo guarda la preferencia hasta que exista el servicio de notificaciones.
  - Estado del último respaldo: sin respaldo, reciente (menos de 30 días) o pendiente (30 días o más). El 30 es un umbral de interfaz, no una regla fiscal.
  - Exportar: la fecha del último respaldo se anota solo si no se cancela la hoja de compartir. Al activar "incluir datos personales" se avisa de que quien tenga el archivo podrá leer el RC-05 y el NIT.
  - Importar: primero un aviso de que reemplaza todos los datos; antes se guarda una copia interna automática y, si falla, no se importa nada. Tras restaurar se vuelve a cargar el perfil y los ajustes, y la fecha del último respaldo pasa a ser la del archivo restaurado. Un respaldo sin datos personales deja RC-05 y NIT vacíos.
  - Borrar todo: hay que escribir `BORRAR`. Después se recrean las categorías iniciales y, sin perfil, el guardián lleva al onboarding.
  - La vista es accesible antes de terminar el onboarding (ver V01).
- **Estado de implementación**: hecho en M6 (alerta en Inicio incluida). Tras restaurar o borrar se reprograman los avisos.

### V16 Notificaciones (v0.1)
- Permiso: estado y botón para pedirlo.
- Preferencias: desfases (7, 3, 1, 0 días) y hora de los avisos de vencimiento.
- Recordatorios del mes (canal `recordatorios`, no son fiscales): último día del mes a las 18:00 para registrar movimientos (`02`, sección 5); día 1 a las 09:00 para revisar la calculadora; día 15 a las 10:00 para hacer un respaldo, que se activa o desactiva en V15 (`respaldoRecordatorio`). Las horas del día 1 y del día 15 son de la app, no de `02`. Se programan los próximos 60 días; al tocarlos abren Registro, Calculadora o Respaldo.
- Guía de batería plegable para que Android no cierre la app.
- Botón "Enviar notificación de prueba".
- **Estado de implementación**: hecho en M6 (permiso, preferencias, recordatorios mensuales, avisos en espera, reprogramar, prueba y guía de batería). Pendiente: prueba en teléfono real.

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
