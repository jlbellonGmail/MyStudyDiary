# Tareas — Spec 003: Objetivo semanal de estudio

- [x] **T1. Preparar el contrato puro de fechas y semanas locales.** RF-7, RF-8, RF-16, RF-18, RF-19, RF-22
  - Hecho cuando: existen pruebas con `node --test` para lunes-domingo, 1/7–7/7, medianoche, cambios de mes/año y cambio de hora, sin depender de la fecha real del sistema.

- [x] **T2. Implementar validación y resolución de configuración de objetivos.** RF-1, RF-2, RF-3, RF-4, RF-5, RF-15, RF-21
  - Hecho cuando: las pruebas aceptan solo enteros positivos, distinguen ausencia de excepción de “sin objetivo”, resuelven base/excepción y rechazan valores inválidos sin mutar la configuración.

- [x] **T3. Implementar persistencia lógica y congelado histórico.** RF-2, RF-4, RF-5, RF-6, RF-22, RF-23, RF-24
  - Hecho cuando: las pruebas demuestran que una semana histórica conserva base o excepción, un cambio posterior de base no la reescribe, una excepción histórica sigue aplicando y “sin objetivo” conserva su aviso y bloqueo lógico.

- [x] **T4. Implementar el cálculo exacto del progreso semanal.** RF-7, RF-8, RF-11, RF-12, RF-13, RF-18, RF-19, RF-20
  - Hecho cuando: `node --test` verifica suma exacta de fracciones, descarte de fechas/minutos inválidos y futuros, esperado proporcional y estados con comparaciones sin redondear.

- [x] **T5. Implementar formato de duración, porcentaje y arco visual.** RF-9, RF-10, RF-18
  - Hecho cuando: las pruebas verifican fórmula, porcentaje entero con empates hacia arriba, `90.5 → 1 h 31 min`, exceso de horas y arco 0, intermedio y 100 % limitado.

- [x] **T6. Añadir el panel y los controles de objetivo en la estructura visual.** RF-1, RF-3, RF-4, RF-9, RF-14, RF-21, RF-24
  - Hecho cuando: la interfaz contiene controles para base y excepciones, muestra horas destacadas, porcentaje, círculo, estados y aviso sin objetivo con textos equivalentes accesibles.

- [x] **T7. Conectar guardado, reapertura, excepciones y modo histórico.** RF-2, RF-5, RF-6, RF-15, RF-22, RF-23, RF-24
  - Hecho cuando: al guardar y recargar se conserva la configuración, se puede quitar una excepción para heredar base, y las semanas históricas muestran su valor sin permitir edición.

- [x] **T8. Integrar el indicador con sesiones y el calendario local.** RF-7, RF-10, RF-11, RF-12, RF-13, RF-16, RF-17, RF-19, RF-20
  - Hecho cuando: guardar, editar o eliminar una sesión actualiza el indicador, medianoche cambia la semana y el render no altera sesiones ni aplica filtros de consulta al cálculo semanal.

- [x] **T9. Ajustar estilos y compatibilidad de la aplicación.** RF-9, RF-10, RF-14, RF-18, RF-20
  - Hecho cuando: `file://` sigue funcionando, los temas claro/oscuro y viewport de 375 px no rompen el panel, los respaldos de sesiones existentes siguen importándose y las pruebas anteriores permanecen verdes.

- [x] **T10. Ejecutar validación final de lógica e interfaz.** RF-1–RF-24
  - Hecho cuando: `node --test` termina en verde, la revisión en Chrome DevTools usa datos aislados, no muestra errores de consola, verifica cambio de semana, histórico, estados, arco y aviso, y la spec queda cubierta sin modificar sesiones reales.
