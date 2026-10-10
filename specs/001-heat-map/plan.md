# Plan técnico: mapa de actividad de estudio

Este plan deriva de `spec.md` y respeta `docs/constitution.md`. La spec no etiqueta formalmente sus requisitos; RF-01–RF-10 son identificadores de trazabilidad asignados aquí, sin cambiar la spec.

## Requisitos funcionales (RF)

- **RF-01 — Ventana y orden:** semana local actual y 11 anteriores; 84 fechas, semanas de izquierda a derecha y días de lunes a domingo.
- **RF-02 — Fechas locales:** excluir actividad futura; manejar límites de semana, meses, años y cambios de horario con calendario local.
- **RF-03 — Totales:** sumar sesiones válidas por día, ignorar filtros y no cambiar ni persistir datos.
- **RF-04 — Intensidad:** clasificar el total sin redondear usando los tramos exactos de la spec.
- **RF-05 — Detalle:** seleccionar días pasados o actuales, incluidos días sin sesiones, y mostrar fecha y total diario sin perder la precisión decimal disponible; el foco no selecciona.
- **RF-06 — Accesibilidad:** interacción por ratón, tacto y teclado, nombres accesibles, navegación con flechas y exclusión de celdas futuras.
- **RF-07 — Leyenda y tema:** explicar los cuatro niveles y distinguirlos en temas claro y oscuro; no comunicar intensidad solo mediante color.
- **RF-08 — Móvil:** permitir recorrer horizontalmente las 12 semanas y mantener visible el foco.
- **RF-09 — Historial vacío:** mostrar cuadrícula y leyenda vacías, sin detalle seleccionado.
- **RF-10 — Terminología visible:** usar “Días seguidos estudiando” y “Mejor marca de días seguidos estudiando” en la interfaz y en las referencias pertinentes de `README.md`, sin cambiar lógica, identificadores ni datos.

## Archivos y responsabilidades

### Cambios previstos para implementar la funcionalidad

- **`index.html` — modificar:** añadir la sección del mapa después de Estadísticas y antes de Logros (decisión de composición visual, no requisito funcional), con título en español, cuadrícula `role="grid"`, filas `role="row"`, celdas `role="gridcell"`, leyenda y región de detalle. Cada fecha seleccionable tendrá un botón nativo dentro de su celda; las fechas futuras serán celdas no interactivas con `aria-disabled="true"`. Cargar `heatmap-logic.js` como script clásico antes de `app.js`, ambos con `defer`; el módulo debe exponer su API de navegador antes de que se ejecute `app.js`. También actualizar los textos visibles de la tarjeta de días seguidos estudiando, sin cambiar sus identificadores. (RF-05–RF-10)
- **`styles.css` — modificar:** diseñar niveles mediante variables compatibles con ambos temas; definir la cuadrícula semanal, foco visible, estados vacíos/futuros y desplazamiento horizontal móvil. No usar color como única señal. (RF-06–RF-09)
- **`heatmap-logic.js` — crear:** contener cálculos puros de fechas locales, agrupación diaria, rango de 84 días y niveles. Exponer la API como `window.StudyHeatmap` en navegador y mediante `module.exports` en Node, sin dependencias. El acceso a `module` debe comprobarse sin provocar errores en navegador. (RF-01–RF-04)
- **`app.js` — modificar:** obtener y suministrar la fecha local actual, pedir el modelo a la lógica pura, construir las celdas y conectar selección, teclado y detalle. No escribir en `localStorage` ni aplicar filtros al mapa. Al consolidar los helpers de fecha existentes, conservar su comportamiento para rachas, filtros, formatos y respaldos. Sustituir únicamente los textos dinámicos visibles que mencionen la racha, manteniendo las funciones y la lógica. (RF-03–RF-10)
- **`README.md` — modificar:** actualizar las referencias pertinentes a la racha actual y a la mejor racha para reflejar la terminología visible aprobada, sin alterar las reglas funcionales ni los nombres internos documentados. (RF-10)
- **`tests/heatmap-logic.test.js` — crear:** probar directamente la API pura con `node:test`; no requiere DOM ni dependencias instaladas. (RF-01–RF-04)
- **`MEMORY.md` — modificar al completar la implementación:** registrar el estado de la funcionalidad y las decisiones relevantes, manteniendo el resumen breve.

### Archivo creado por este encargo

- **`specs/001-heat-map/plan.md` — crear:** este plan. No modifica la spec aprobada.

No se prevén cambios en `AGENTS.md`, `docs/constitution.md`, los datos de prueba ni el formato o contenido almacenado de sesiones.

## Funciones puras de lógica

Todas reciben entradas explícitas; ninguna consulta el reloj, el DOM, filtros o `localStorage`. La fecha `today` será una cadena local válida `AAAA-MM-DD` suministrada por la capa de interfaz. La interfaz obtendrá `today` al iniciar y lo recalculará después de cada render provocado por cambios de sesiones y al cambio de día local. Las funciones que operen con fechas convertirán sus componentes a una fecha local de calendario; no usarán `toISOString()`, `new Date("AAAA-MM-DD")` ni sumas de milisegundos.

- **`getLocalDateString(date)`**: formatear los componentes locales de una fecha como `AAAA-MM-DD`, sin mutarla.
- **`parseLocalDate(dateString)`**: validar estrictamente año, mes y día (incluidos años bisiestos) y convertirlos a medianoche local; devolver `null` si la fecha no es válida.
- **`getHeatmapDates(today)`**: devolver las 84 fechas desde el lunes de la semana actual menos 11 semanas hasta el domingo de la semana actual, en orden. Avanzar con operaciones de calendario local.
- **`getIntensityLevel(minutes)`**: devolver `0` para cero y los niveles 1–4 con los límites definidos en RF-04. No redondear el argumento; esta función no recibe fechas.
- **`buildHeatmap(sessions, today)`**: recibir sesiones que ya pasaron por `normalizeSession` en `app.js`; usar sus campos `date` y `minutes`, agregar las del rango, excluir fechas posteriores a `today` y devolver exactamente 84 registros `{ date, minutes, level, isFuture }`. Para fechas pasadas/actuales sin sesiones, `minutes` y `level` serán `0`; para futuras, serán `0` y `null`, respectivamente, con `isFuture: true`. En las demás fechas, `level` será el resultado de `getIntensityLevel(minutes)` e `isFuture: false`. No recibe filtros ni modifica las sesiones.

Las funciones `getLocalDateString` y `parseLocalDate` actualmente están en `app.js`; se consolidarán en `heatmap-logic.js`. Se actualizarán todos sus puntos de uso en `app.js`, no solo los del mapa, y se comprobarán las funciones existentes de racha, filtros, formato y respaldos en la verificación de regresión. Así no se mantienen dos implementaciones de fechas locales. El módulo se cargará como script clásico en `file://` y expondrá la misma API `StudyHeatmap` a `require()` para los tests. (RF-01–RF-04)

## Algoritmo del mapa (pseudocódigo)

```text
recibir sesiones y hoy local
obtener el lunes de la semana local de hoy
restar 11 semanas de calendario para hallar el primer lunes
generar 84 fechas consecutivas avanzando un día de calendario local
crear una suma diaria inicialmente vacía

para cada sesión válida:
    si su fecha está en el rango y no es posterior a hoy:
        acumular sus minutos en la suma de esa fecha

para cada una de las 84 fechas, en orden:
    si la fecha es posterior a hoy:
        emitir { date, minutes: 0, level: null, isFuture: true }
    en otro caso:
        total = suma diaria o cero
        nivel = clasificar el total sin redondearlo
        emitir { date, minutes: total, level: nivel, isFuture: false }

devolver las 84 celdas sin alterar sesiones
```

La resta de semanas y el avance diario se harán con fechas locales y `setDate`, no con intervalos de 24 horas; así los días de cambio horario no desplazan ni duplican fechas. (RF-01–RF-04)

## Pintado e interacción en la interfaz

- `app.js` pedirá el modelo puro y generará una cuadrícula de 12 columnas por 7 filas. Las fechas pasadas/actuales serán controles seleccionables; las futuras, celdas deshabilitadas fuera de la secuencia de foco. (RF-01, RF-02, RF-06)
- La cuadrícula tendrá navegación por flechas con un único punto de entrada por Tab (decisión de implementación para cumplir la navegación de la spec); Enter o Espacio seleccionarán la fecha enfocada. Izquierda/derecha moverán una semana y arriba/abajo un día; en los bordes el foco se detendrá, sin envolver, y las futuras se omitirán. En móvil funcionará con toque. Mover el foco no actualizará el detalle. (RF-05, RF-06)
- Los botones seleccionables usarán un único `tabindex="0"` dentro de la cuadrícula y los demás `tabindex="-1"`; las flechas moverán el foco entre ellos. Las celdas futuras no serán controles enfocables. (RF-05, RF-06)
- Seleccionar una fecha actualizará una región de detalle bajo la cuadrícula con fecha completa y total decimal de minutos. Formatear con `Intl.NumberFormat` en español y hasta 20 decimales, sin reutilizar el formateador actual de duración que redondea. Un día sin sesiones mostrará cero. Antes de la primera selección no habrá detalle diario. El cambio se anunciará mediante una región viva `polite`. (RF-05, RF-09)
- Las celdas llevarán nombres accesibles con fecha, total y nivel o ausencia de estudio; las futuras se identificarán como no disponibles. Una leyenda textual asociará cada nivel con su tramo. Los cuatro niveles tendrán luminancia progresiva en ambos temas y sus nombres/intervalos seguirán disponibles como texto, sin depender del color. (RF-06, RF-07)
- En pantallas estrechas, un contenedor permitirá desplazar horizontalmente la cuadrícula completa sin recortar semanas y llevará a la vista la celda enfocada. No se dependerá de `hover`. (RF-08)
- Sin sesiones, se renderizarán las 84 celdas vacías y la leyenda, sin fecha seleccionada. (RF-09)
- La tarjeta de continuidad mostrará “Días seguidos estudiando” y “Mejor marca de días seguidos estudiando”; sus mensajes de cero, singular y plural usarán la misma terminología. Las referencias pertinentes de `README.md` coincidirán con esos textos. (RF-10)

## Decisiones técnicas y alternativas descartadas

- **Script clásico puro y API compartida con Node:** `heatmap-logic.js` expondrá sus funciones al navegador y a `require()`. Se elige para poder probar la misma lógica que usa la app y conservar compatibilidad con apertura directa mediante `file://`. Se descartan módulos ES porque el proyecto no debe depender de un servidor y los módulos locales pueden fallar por restricciones de origen.
- **Contrato CommonJS/global explícito:** usar el nombre `StudyHeatmap` en navegador y exportar el mismo objeto desde `module.exports` en Node. Se elige para que app y tests usen una API única; se descarta duplicar cálculos dentro de tests o cargar `app.js` con DOM simulado.
- **Lógica aislada del DOM:** `buildHeatmap` recibe sesiones y `today`; la UI solo presenta el resultado. Se elige para cumplir la constitución y probar cálculos deterministas. Se descarta calcular fechas y niveles dentro de los manejadores/renderizadores de DOM.
- **Cuadrícula HTML/CSS propia:** se elige por el conjunto pequeño y fijo de 84 fechas y por no añadir dependencias. Se descarta una librería de calendario/heatmap porque viola la simplicidad del stack y no se necesita para el comportamiento especificado.
- **Fechas de calendario locales:** usar componentes locales, construcción local de fechas y avance con `setDate`. Se elige para cruzar cambios de horario correctamente. Se descartan UTC, `toISOString()` y sumar milisegundos, que pueden cambiar la fecha local.
- **Actualización del día local:** recalcular al iniciar, en cada render de sesiones y al llegar la siguiente medianoche local. Programar la siguiente actualización con la próxima fecha local y recalcular su demora tras cada disparo; no tratar un día como un intervalo fijo de 24 horas. Se elige para que una página abierta no conserve celdas futuras/actuales obsoletas; se descarta dejar la actualización supeditada a una acción posterior del usuario.
- **Suma decimal:** acumular los valores numéricos sin redondeo y clasificar la suma resultante directamente, sin epsilon que cambie los límites aprobados. Se elige porque los datos existentes son números y la spec prohíbe redondear antes de clasificar; la precisión binaria de `Number` en sumas fraccionarias queda como riesgo conocido y se cubre con pruebas representativas.
- **Datos calculados al renderizar:** el mapa deriva del historial existente y no se guarda por separado. Se elige para no duplicar datos ni alterar sesiones; se descarta añadir una clave o cambiar el esquema de almacenamiento.
- **Intensidad por umbrales fijos:** mantener los niveles estables al añadir historial. Se descarta normalizarlos por cuantiles o máximos del usuario, que cambiarían el color de días anteriores y no cumplen los intervalos aprobados.
- **Área desplazable en móvil:** conservar las 12 semanas y mover la cuadrícula horizontalmente. Se descarta ocultar semanas o reducir el mapa a un período distinto, lo que rompería RF-01/RF-08.
- **Terminología visible separada de la lógica:** cambiar las etiquetas y mensajes de interfaz y documentación sin renombrar funciones, identificadores ni datos. Se elige para mejorar la claridad para el usuario sin introducir cambios de comportamiento; se descarta modificar el cálculo de las rachas o el esquema almacenado.

## Estrategia de tests y verificación

- Ejecutar **`node --test`** sin instalar paquetes. Los tests importarán `heatmap-logic.js` directamente; no crearán DOM ni duplicarán el algoritmo bajo prueba.
- Probar `getLocalDateString` y `parseLocalDate` con fechas válidas, inválidas, 29 de febrero en años bisiestos y límites de calendario local. Para DST, una prueba lanzará un proceso hijo con el módulo integrado `node:child_process` y `TZ=Europe/Madrid`; comprobará primero que el desplazamiento UTC cambia entre las fechas del fixture y después verificará que no se omite ni duplica ningún día. No depender de la zona por defecto del equipo ni añadir dependencias. (RF-01, RF-02)
- Probar que `getHeatmapDates(today)` siempre devuelve 84 fechas únicas, ordenadas, de lunes a domingo; e incluir un `today` en cada día de la semana para validar el lunes actual y las 11 semanas previas. (RF-01)
- Probar agrupación de varias sesiones normalizadas por día, fechas fuera del rango, sesiones futuras, rango vacío e historial menor a 12 semanas; comprobar que el cálculo no altera las sesiones de entrada. Añadir pruebas de regresión para los helpers de fecha extraídos que siguen usando rachas y filtros. (RF-02, RF-03)
- Probar niveles en 0, 30, 30.1, 60, 60.1, 90 y 90.1, además de sumas fraccionarias representativas y sumas exactamente en cada límite. Asegurar que clasificar no redondea y documentar el resultado de la suma numérica fraccionaria. (RF-04)
- Comprobar automáticamente el contrato de cada registro, incluidos futuros (`minutes: 0`, `level: null`) y días vacíos pasados/actuales (`minutes: 0`, `level: 0`). (RF-01–RF-04)
- Verificar manualmente en Chrome DevTools que cambiar filtros no altera mapa ni `localStorage`; que activar con ratón, tacto, Enter y Espacio muestra el total correcto (incluido cero); que solo la activación, no el foco, cambia el detalle; que las flechas respetan límites y omiten futuras; y que no hay errores de consola. (RF-03, RF-05, RF-06)
- Revisar nombres accesibles y relaciones grid/row/gridcell en el árbol de accesibilidad de Chrome, ambos temas, progresión perceptible de los cuatro niveles, leyenda, foco, estado vacío sin detalle y desplazamiento/foco a 375 px. Abrir `index.html` directamente con `file://`. (RF-06–RF-09)
- Verificar que los textos visibles y accesibles de la tarjeta usan “Días seguidos estudiando” y “Mejor marca de días seguidos estudiando” en cero, uno y varios días, y que las referencias pertinentes de `README.md` coinciden, sin cambios en lógica, identificadores ni datos. (RF-10)
- Verificar que la fecha actual se actualiza al cambiar de día local y que no se pierde la selección/detalle durante un render de sesiones mientras la fecha seleccionada siga dentro del rango y no sea futura. (RF-05, RF-09)
- La implementación no se considera terminada si `node --test` falla o queda sin cubrir algún RF.
