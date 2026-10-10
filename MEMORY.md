# MEMORY.md — Diario de Estudio

## Estado actual

- Aplicación estática en HTML/CSS/JavaScript puro; funciona con `file://`, sin dependencias.
- Incluye sesiones, rachas, estadísticas, filtros, tema, respaldos JSON y mapa de actividad de 12 semanas.
- Heatmap: `heatmap-logic.js` contiene lógica pura local y se comparte vía CommonJS y `window.StudyHeatmap`; `app.js` pinta 84 fechas, ignora filtros, presenta niveles/leyenda, detalle seleccionable y accesibilidad de teclado/tacto.
- El mapa se actualiza al renderizar y al llegar a la próxima medianoche local. Mantiene selección válida; elimina detalle si la fecha deja de ser válida.
- Datos existentes siguen en `localStorage` con claves `diario-de-estudio-sesiones` y `diario-de-estudio-tema`; no se cambió el formato.
- La interfaz y las referencias pertinentes de `README.md` usan “Días seguidos estudiando” y “Mejor marca de días seguidos estudiando”; la lógica y los identificadores internos permanecen sin cambios.
- Tareas de `specs/001-heat-map/tasks.md`: T1–T10 completadas. Aceptación verificada con `node --test` (7/7) y la comprobación específica de terminología.
- La spec `specs/002-editar-eliminar-sesiones/spec.md` está aprobada. Permite editar fecha, tema y minutos de una sesión individual y eliminarla con confirmación.
- La spec 002 quedó implementada: `session-logic.js` valida y transforma sesiones sin mutarlas; `app.js` ofrece edición individual, errores corregibles, confirmación de eliminación y actualización de vistas; no se añadió un identificador persistido.

## Decisiones y errores a evitar

- Sin backend, módulos ES, dependencias ni build; `index.html` debe abrirse directamente.
- Fechas siempre locales: no usar `toISOString()`, `new Date("AAAA-MM-DD")` ni sumar milisegundos como días. Avanzar fechas con `setDate`.
- La racha cuenta días únicos consecutivos que terminan hoy o ayer; no persistir métricas derivadas.
- Los niveles del mapa usan minutos decimales sin redondear antes de comparar; los días futuros son celdas sin botón.
- El temporizador calcula el siguiente día con componentes locales; no asumir que una jornada dura 24 horas.

## Verificación

- Tests: `node --test`. Verificar cambios de interfaz con Chrome DevTools: consola, teclado/tacto, vista móvil y datos sintéticos en contexto aislado.
- No borrar ni sobrescribir sesiones reales al probar; no cargar el historial sintético automáticamente.
- En la spec 002, los valores inválidos muestran errores, no sobrescriben los valores originales y permiten corregir la edición sin volver a abrirla.
- La verificación final de la spec 002 pasó con `node --test` (22/22). La interfaz se probó en contexto aislado de Chrome, con `file://`, confirmación/rechazo de eliminación, edición inválida/válida, consola limpia y viewport móvil de 375 px sin overflow.
- Spec 003 T1 completada: `objective-logic.js` expone contrato puro de fechas locales y semanas lunes-domingo; incluye validación estricta, días transcurridos y clasificación pasada/actual/futura. `tests/objective-logic.test.js` cubre medianoche, límites de mes/año y DST con hoy explícito. Suite verificada en verde (28/28).
- Spec 003 T2 completada: `objective-logic.js` valida objetivos enteros positivos, resuelve revisiones base, excepciones positivas y marcador `sin objetivo`, y devuelve nuevas configuraciones sin mutar entradas; las semanas pasadas se rechazan. Suite verificada en verde (32/32).
- Evitar mutar configuraciones de objetivos: las operaciones clonan revisiones, excepciones e históricos antes de añadir o quitar valores.
- Spec 003 T3 completada: `freezeHistoricalWeeks` materializa objetivos efectivos de semanas pasadas, incluyendo `sin objetivo`, conserva excepciones y evita que revisiones posteriores de la base reescriban históricos. Suite verificada en verde (35/35).
- Spec 003 T4 completada: `calculateWeekProgress` suma minutos válidos sin redondear, ignora fechas inválidas/futuras y minutos no utilizables, usa hoy para la semana actual y domingo para históricas, y aplica el esperado proporcional con precedencia de estados. Suite verificada en verde (39/39).
- Spec 003 T5 completada: `objective-logic.js` expone formato de duración redondeado solo para presentación, porcentaje entero con empates hacia arriba y progreso visual/arco limitado a 100%; conserva horas reales por encima de la meta. Suite verificada en verde (42/42).
- Spec 003 T6 completada: `index.html` incorpora el panel visual de objetivo base, excepciones, indicador textual/circular y aviso inicial sin objetivo; `styles.css` añade presentación accesible, temas y adaptación móvil. Se añadieron contratos estáticos de interfaz; suite verificada en verde (45/45). La persistencia y los eventos quedan para T7/T8.
- Spec 003 T7 completada: `app.js` persiste objetivos en `diario-de-estudio-objetivos`, congela históricos al cargar/renderizar, conecta base y excepciones (incluido “sin objetivo” y quitar para heredar), y ofrece consulta histórica de solo lectura. No se modificó el formato ni la clave de sesiones; suite verificada en verde (46/46).
- La configuración dañada o inexistente de objetivos se trata como vacía, sin tocar sesiones. Las opciones históricas se generan desde históricos/excepciones guardados y bloquean todos los controles de excepción.
- Spec 003 T8 completada: el render del objetivo recibe todas las sesiones, por lo que ignora filtros de consulta y se recalcula tras guardar, editar, eliminar o importar sesiones. El temporizador local de medianoche re-renderiza el panel y el resto de vistas; no se cambió el formato de sesiones. Suite verificada en verde (48/48).
- La comprobación de fechas de T8 conserva el temporizador basado en componentes locales y el avance con `setDate`; no se añadió `toISOString()`, fechas UTC ni cálculos de días por milisegundos.
- Spec 003 T9 completada: el panel de objetivo declara límites mínimos para evitar desbordamientos en viewport estrecho, conserva los estilos de tema y mantiene la compatibilidad `file://`/respaldos de sesiones sin ampliar su formato. Se añadieron contratos estáticos de responsive y compatibilidad; suite verificada en verde (50/50). La validación final de interfaz queda para T10.
- Spec 003 T10 completada: `node --test` pasó 50/50. La interfaz se validó en Chrome DevTools con `file://` y contexto aislado, cubriendo aviso inicial, objetivo base, estados por detrás/al día/cumplido, fórmula, porcentajes y arco 0/intermedio/100/exceso, sesiones futuras e inválidas, filtros ignorados, excepciones positivas/sin objetivo/quitar, histórico no editable, persistencia, tema, accesibilidad y respaldo compatible. Se verificó viewport emulado de 375 px sin overflow y consola limpia tras recarga; no se tocaron sesiones reales.
- Corrección RF-10 de Spec 003: `formatGoalProgress` limita también el porcentaje textual y accesible a 100 %, mientras conserva las horas reales de exceso; prueba de 90,5 minutos sobre una meta de 1 hora y verificación aislada en Chrome (incluido viewport móvil) en verde.
