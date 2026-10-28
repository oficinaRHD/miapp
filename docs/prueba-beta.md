# Hoja de pruebas de la beta v0.1.0 (para hacer en el teléfono)

Marca cada casilla. Si algo falla, anota qué pasó y pégamelo (ver "Resultado" al final).
Tarda unos 40 minutos; la parte D tiene esperas.

## A. Instalar encima y conservar los datos
- [ ] A1. Con la versión anterior instalada y con datos (perfil, un movimiento, un feriado), instala el APK nuevo **sin desinstalar**.
- [ ] A2. Se instala sin error. Si dice "App no instalada" o "conflicto con un paquete", **anótalo**: significa que la firma cambia en cada compilación (ver registro 48, "Firma estable").
- [ ] A3. Al abrir, el perfil, los movimientos, las obligaciones y los feriados siguen.
- [ ] A4. Ajustes, Acerca de: versión de la app `0.1.0` y de las reglas `2026.1`.

## B. Modo avión
- [ ] B1. Activa el modo avión. Abre la app y recorre Inicio, Calendario, Obligaciones, Registro y Ajustes.
- [ ] B2. Registra un ingreso y un gasto de prueba: se guardan.
- [ ] B3. Calculadora: muestra el impuesto estimado con el aviso de orientativo.
- [ ] B4. Nada pide internet ni falla.

## C. Respaldo
- [ ] C1. Ajustes, Respaldo, "Exportar" y guárdalo o compártelo (a Archivos, WhatsApp, correo). Inicio ya no avisa de "ningún respaldo".
- [ ] C2. Borra todos los datos (escribe `BORRAR`). La app vuelve al inicio del asistente.
- [ ] C3. En Respaldo, "Importar" y elige el archivo. Vuelven perfil, movimientos, obligaciones y feriados.
- [ ] C4. Cambia el tema a "Oscuro", exporta, importa: se mantiene tras reiniciar la app.

## D. Notificaciones (el criterio de cierre de M6)
Ajustes, Notificaciones.
- [ ] D1. Permiso: toca "Permitir notificaciones". Sale el diálogo de Android; al aceptar dice "Permitidas."
- [ ] D2. Prueba: "Enviar notificación de prueba", cierra la app (botón Inicio) y espera 10 segundos. Llega.
- [ ] D3. Prueba con la app **cerrada del todo** (deslizarla desde Recientes): repite D2. Anota si llega o no.
- [ ] D4. **Vencimiento a 3 minutos**:
  1. Obligaciones, abre una pendiente y cambia su fecha límite a **hoy**.
  2. Notificaciones: deja solo marcado "El mismo día" y pon la hora **3 minutos después de ahora**. "Guardar y reprogramar": debe decir "Avisos programados: 1" o más.
  3. Sal de la app y bloquea el teléfono. A la hora, llega "… vence hoy".
  4. Tócala: abre esa obligación.
  5. Al terminar, deja la hora en 09:00 y marca otra vez los cuatro avisos.
- [ ] D5. **Reinicio**: programa otro aviso para dentro de 10 minutos (como D4), **reinicia el teléfono sin abrir la app** y espera. Anota si llega.
- [ ] D6. **Permiso denegado**: en Ajustes de Android, Apps, Asistente TCP, Notificaciones, desactívalas. Abre la app: Notificaciones dice "Bloqueadas…", Inicio muestra el aviso y "Reprogramar" explica que falta el permiso. Nada se rompe. Vuelve a activarlas.
- [ ] D7. Marcar una obligación como pagada quita su aviso (el contador de "avisos en espera" baja).
- [ ] D8. Recordatorios del mes: en Notificaciones aparecen en espera (hasta 6 con el de respaldo activado). Desmarcar uno baja el número.

## E. Aspecto
- [ ] E1. Arriba, el título no queda tapado por la barra de estado; abajo, nada se ve tras los iconos de navegación.
- [ ] E2. Hora y batería se leen en tema claro y en oscuro.
- [ ] E3. Menú [☰]: abre, navega y se cierra.
- [ ] E4. Las tarjetas de Inicio tienen el filo rojo, ámbar o verde, y su etiqueta ("Vencida", "A tiempo") de color.
- [ ] E5. Tema oscuro: se distinguen tarjetas, botones y bordes en Inicio, Calendario, Obligaciones, Ficha, Calculadora y Registro.
- [ ] E6. Registro: el botón "+" queda sobre la barra del teléfono; "Ingreso" y "Gasto" se leen y el elegido se ve.

## F. Feriados y mora
- [ ] F1. Ajustes, Feriados: "Añadir los feriados fijos" añade 4; repetirlo dice "Ya estaban todos".
- [ ] F2. Pago de una obligación vencida: el atraso cuenta un día hábil menos si un feriado cae en medio.
- [ ] F3. Con la lista vacía sale el aviso de "lunes a viernes"; con feriados, no.

## Resultado (cópialo y pégalo aquí)
```
Teléfono y Android:
A: ok / falla (qué)
B: ok / falla
C: ok / falla
D2: ok / falla   D3: llega / no llega   D4: llega / no llega
D5 (reinicio): llega / no llega
D6: ok / falla   D7: ok / falla   D8: ok / falla
E: ok / falla (cuál)
F: ok / falla
Otros fallos:
```
