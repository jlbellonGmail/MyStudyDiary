# Tareas: editar y eliminar sesiones registradas

- [x] **T1. Crear la lógica pura de validación de sesiones y sus pruebas.** RF-3, RF-4
  - Hecho cuando: `session-logic.js` expone la validación con `hoy` explícito; `tests/session-logic.test.js` cubre fecha anterior, fecha actual, fecha futura, fechas inválidas, tema vacío, límite de tema y minutos no enteros o no positivos; `node --test` pasa.

- [x] **T2. Crear las transformaciones puras para actualizar y eliminar una sesión.** RF-2, RF-6, RF-8
  - Hecho cuando: existen pruebas y funciones puras para actualizar o eliminar por índice sin mutar el array original, conservando `createdAt`, distinguiendo sesiones con la misma fecha y dejando intactas las demás; `node --test` pasa.

- [x] **T3. Integrar la lógica de sesiones y preparar el formulario para el modo edición.** RF-1, RF-3, RF-4
  - Hecho cuando: `session-logic.js` se carga antes de `app.js`, el formulario dispone de un estado de edición cancelable y la interfaz puede alternar entre registrar y editar sin cambiar el formato guardado.

- [x] **T4. Mostrar acciones individuales y abrir o cancelar una edición.** RF-1, RF-8
  - Hecho cuando: cada sesión visible tiene botones accesibles de Editar y Eliminar asociados a su índice en memoria; Editar rellena fecha, tema y minutos de la sesión elegida; Cancelar restaura el formulario de nueva sesión sin modificar los datos.

- [x] **T5. Implementar el guardado de ediciones válidas y el manejo de errores.** RF-2, RF-3, RF-4, RF-8
  - Hecho cuando: una edición válida guarda solo la sesión elegida y actualiza lista, filtros, estadísticas, racha, logros y mapa; las fechas futuras y valores inválidos muestran errores, conservan los valores originales y mantienen abierta la edición para corregirla; un fallo de almacenamiento no cambia el estado visible.

- [x] **T6. Implementar la eliminación individual con confirmación.** RF-5, RF-6, RF-7, RF-8
  - Hecho cuando: Eliminar solicita confirmación, rechazarla conserva la sesión sin cambios y confirmarla elimina únicamente la sesión elegida, persiste el nuevo array y actualiza todas las vistas; un fallo de almacenamiento conserva los datos anteriores.

- [x] **T7. Completar estilos, accesibilidad y adaptación móvil de las acciones.** RF-1, RF-3, RF-4, RF-5, RF-7
  - Hecho cuando: los botones, el estado de edición, el botón de cancelación y los errores son legibles en temas claro y oscuro, tienen nombres accesibles, mantienen un foco razonable y funcionan a 375 px sin desbordamientos.

- [x] **T8. Ejecutar la regresión automatizada de lógica.** RF-2, RF-3, RF-4, RF-6, RF-8
  - Hecho cuando: `node --test` pasa incluyendo las pruebas nuevas y las del mapa, y las pruebas verifican inmutabilidad, duplicados de fecha, índices inválidos, fechas locales y ausencia de cambios en datos no seleccionados.

- [x] **T9. Validar la funcionalidad completa en la interfaz y cerrar la spec.** RF-1, RF-2, RF-3, RF-4, RF-5, RF-6, RF-7, RF-8
  - Hecho cuando: en un contexto aislado de Chrome y abriendo `index.html` con `file://` se prueban edición válida, cada error, corrección sin reabrir, cancelación, confirmación y rechazo de eliminación, filtros, sesiones con la misma fecha, recarga, consola, teclado, tacto y vista de 375 px; se actualiza `MEMORY.md` y se revisa que no haya cambios en el formato guardado.
