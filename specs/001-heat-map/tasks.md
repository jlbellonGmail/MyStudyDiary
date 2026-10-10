# Tareas de implementación: mapa de actividad de estudio

Los RF-01–RF-09 son las etiquetas de trazabilidad definidas en `plan.md`. Ejecutar `node --test` después de cada cambio de lógica; no avanzar si falla. No instalar dependencias. Cada tarea debe dejar `index.html` abrible directamente con `file://` y conservar los datos existentes.

## Tareas

### T1 [x] — Añadir lógica pura y pruebas unitarias

- **Archivos:** crear `heatmap-logic.js` y `tests/heatmap-logic.test.js`.
- **Cambio:** implementar y probar funciones de fechas locales, ventana de 84 días, niveles de intensidad y agregación diaria con `today` explícito. Usar la API CommonJS en Node y no acceder al DOM ni a `localStorage` desde la lógica.
- **RF:** RF-01, RF-02, RF-03, RF-04.
- **Depende de:** ninguna.
- **Terminado cuando:** `node --test` pasa sin dependencias e incluye límites de intensidad, fechas inválidas/año bisiesto, semana de cada día, fechas futuras, agregación de sesiones y caso DST comprobado bajo `TZ=Europe/Madrid`. La app existente sigue abriendo sin cambios.

### T2 [x] — Integrar los helpers de fecha sin cambiar el comportamiento actual

- **Archivos:** modificar `index.html` y `app.js`.
- **Cambio:** cargar `heatmap-logic.js` como script clásico con `defer` antes de `app.js`; cambiar los usos actuales de `getLocalDateString` y `parseLocalDate` para usar `window.StudyHeatmap`, sin cambiar su semántica.
- **RF:** RF-01, RF-02, RF-03.
- **Depende de:** T1.
- **Terminado cuando:** `node --test` pasa y Chrome DevTools confirma que la app abre desde `file://`, no muestra errores y siguen funcionando registro de sesiones, rachas, filtros de fecha, formato de fechas y respaldo/importación. Las sesiones anteriores permanecen intactas.

### T3 [x] — Añadir la estructura visual del mapa

- **Archivos:** modificar `index.html` y `styles.css`.
- **Cambio:** incorporar la sección después de Estadísticas y antes de Logros, con título en español, contenedor de mapa, leyenda de niveles y región de detalle inicialmente vacía. Definir el espacio responsive y el contenedor con desplazamiento horizontal móvil; todavía no conectar datos.
- **RF:** RF-07, RF-08, RF-09.
- **Depende de:** T2.
- **Terminado cuando:** la página abre con `file://` sin errores; la sección y leyenda son legibles en temas claro/oscuro y a 375 px, y su contenedor no altera el resto de la interfaz.

### T4 [x] — Pintar las 84 fechas desde el modelo puro

- **Archivos:** modificar `app.js` y `styles.css`.
- **Cambio:** llamar a `buildHeatmap(sessions, today)` al renderizar; pintar 12 semanas por 7 días en el orden acordado, con los cuatro niveles, celdas vacías, fechas futuras deshabilitadas y nombres accesibles. Mostrar las 84 celdas y la leyenda aunque no haya sesiones.
- **RF:** RF-01, RF-02, RF-03, RF-04, RF-06, RF-07, RF-09.
- **Depende de:** T1, T2, T3.
- **Terminado cuando:** `node --test` pasa; con un conjunto de sesiones de prueba en un contexto aislado, Chrome DevTools confirma 84 fechas en el orden correcto, niveles según los umbrales, suma total independiente de los filtros, futuro sin actividad y estado vacío sin errores. La clave de `localStorage` no cambia al renderizar.

### T5 [x] — Seleccionar días y mostrar su detalle

- **Archivos:** modificar `app.js`, `index.html` y `styles.css`.
- **Cambio:** hacer seleccionables con botones nativos los días pasados y actuales; al activar uno, mostrar su fecha y total diario localizado en la región de detalle. Mantener las fechas futuras no interactivas y anunciar el detalle con `aria-live="polite"`. El foco por sí solo no cambia la selección.
- **RF:** RF-05, RF-06, RF-09.
- **Depende de:** T4.
- **Terminado cuando:** Chrome DevTools confirma que ratón y tacto seleccionan un día con sesiones y uno vacío (que muestra cero), que una fecha futura no se puede activar y que el detalle conserva los decimales del total. Antes de seleccionar, el detalle está vacío.

### T6 [x] — Completar navegación por teclado y foco accesible

- **Archivos:** modificar `index.html`, `app.js` y `styles.css`.
- **Cambio:** aplicar semántica grid/row/gridcell, nombres accesibles, `tabindex` itinerante y navegación con flechas: izquierda/derecha una semana, arriba/abajo un día; detenerse en los bordes y omitir fechas futuras. Enter y Espacio activan; el foco visible desplaza la cuadrícula cuando sea necesario.
- **RF:** RF-05, RF-06, RF-08.
- **Depende de:** T5.
- **Terminado cuando:** con teclado se puede entrar y salir con Tab, navegar y activar sin que solo mover el foco cambie el detalle; el árbol de accesibilidad de Chrome muestra fechas, minutos y nivel/estado; a 375 px se puede recorrer todo el rango y el foco permanece visible.

### T7 [x] — Actualizar el mapa al cambiar el día local

- **Archivos:** modificar `app.js`.
- **Cambio:** recalcular el día actual al iniciar, después de renderizar cambios de sesiones y al llegar la siguiente medianoche local. Reprogramar desde la próxima fecha local tras cada actualización, sin asumir días de 24 horas; conservar la selección si aún pertenece al rango y no es futura.
- **RF:** RF-02, RF-05, RF-09.
- **Depende de:** T5, T6.
- **Terminado cuando:** en Chrome DevTools, avanzando el reloj virtual a través de la medianoche local, una celda futura pasa a ser la fecha actual sin recargar; una selección todavía válida se conserva y las sesiones almacenadas no cambian.

### T8 [x] — Ejecutar la regresión de aceptación

- **Archivos:** ninguno; verificación solamente.
- **Cambio:** ejecutar la comprobación completa sin modificar datos reales; usar un contexto aislado en Chrome para las sesiones sintéticas.
- **RF:** RF-01–RF-09.
- **Depende de:** T1–T7.
- **Terminado cuando:** `node --test` pasa; en Chrome, la app abre desde `file://`, la consola no tiene errores, se verifican ambos temas, selección, teclado, historial vacío, filtros independientes y vista móvil de 375 px. Si falla una comprobación, T8 queda abierto y se reabre la tarea responsable del defecto.

### T9 [x] — Actualizar la memoria del proyecto

- **Archivos:** modificar `MEMORY.md`.
- **Cambio:** registrar que el mapa de calor está implementado y resumir las decisiones permanentes relevantes, sin superar el límite de memoria del proyecto.
- **RF:** no añade RF; documenta el estado final.
- **Depende de:** T8.
- **Terminado cuando:** `MEMORY.md` refleja fielmente la funcionalidad verificada y sigue siendo breve.

### T10 [x] — Actualizar la terminología visible y la documentación

- **Archivos:** modificar `index.html`, `app.js`, `README.md` y `MEMORY.md`.
- **Cambio:** sustituir los textos visibles que usan “racha” por “Días seguidos estudiando” y “Mejor marca de días seguidos estudiando”, incluyendo estados vacíos, mensajes dinámicos y referencias pertinentes del README. Mantener sin cambios la lógica, los nombres internos, los identificadores y los datos almacenados.
- **RF:** RF-10.
- **Depende de:** T9.
- **Terminado cuando:** la interfaz y la documentación usan la terminología aprobada; los estados de cero, uno y varios días son claros; no queda “racha” en los textos visibles afectados; `node --test` pasa y Chrome DevTools confirma la presentación y accesibilidad sin errores.

## Cobertura de requisitos

| RF | Tareas que lo cubren |
|---|---|
| RF-01 — Ventana y orden | T1, T2, T4, T8 |
| RF-02 — Fechas locales | T1, T2, T4, T7, T8 |
| RF-03 — Totales | T1, T2, T4, T8 |
| RF-04 — Intensidad | T1, T4, T8 |
| RF-05 — Detalle | T5, T6, T7, T8 |
| RF-06 — Accesibilidad | T4, T5, T6, T8 |
| RF-07 — Leyenda y tema | T3, T4, T8 |
| RF-08 — Móvil | T3, T6, T8 |
| RF-09 — Historial vacío | T3, T4, T5, T7, T8 |
| RF-10 — Terminología visible | T10 |
