# Especificación: mapa de actividad de estudio

## Objetivo

Mostrar en un mapa de calor los minutos estudiados por día durante las 12 semanas naturales que terminan en la semana actual.

## Alcance y fechas

- El mapa cubre la semana local actual y las 11 semanas naturales anteriores: 12 columnas semanales completas, de lunes a domingo (84 fechas).
- Las semanas se ordenan de más antigua a más reciente, de izquierda a derecha; los días van de lunes a domingo, de arriba abajo.
- El cálculo usa la fecha local actual como parámetro, de acuerdo con la constitución. Las fechas futuras no cuentan como actividad.
- Las fechas deben calcularse como fechas de calendario local, incluso al cruzar meses, años o cambios de horario.
- La función no modifica `localStorage` ni el formato de las sesiones existentes.

## Cálculo e intensidad

- Para cada fecha, sumar los minutos de todas las sesiones válidas de esa fecha. El mapa siempre considera el historial completo e ignora los filtros activos.
- No redondear antes de asignar el nivel; conservar la precisión decimal de los minutos.
- Los niveles son: cero minutos = sin intensidad; más de 0 y hasta 30 = nivel 1; más de 30 y hasta 60 = nivel 2; más de 60 y hasta 90 = nivel 3; más de 90 = nivel 4.
- Los días futuros de la semana actual se muestran como celdas vacías deshabilitadas: no tienen nivel ni se pueden seleccionar.
- Los días pasados o actuales sin sesiones se muestran vacíos, pero se pueden seleccionar y su detalle indica cero minutos.

## Interacción y presentación

- Al activar una celda pasada o actual con ratón, tacto o teclado, mostrar debajo del mapa la fecha completa y el total del día en un formato legible que conserve la precisión disponible. El foco por sí solo no selecciona una fecha.
- El mapa permite entrar y salir con Tab; dentro de la cuadrícula, las flechas mueven el foco entre fechas y Enter o Espacio seleccionan la fecha enfocada. Las celdas futuras deshabilitadas se omiten en la navegación.
- Cada celda tiene un nombre accesible que identifica la fecha, el total y su nivel o la ausencia de estudio. La intensidad no se comunica únicamente mediante el color.
- Incluir una leyenda que asocie claramente los cuatro niveles con su intervalo de minutos. Los niveles deben distinguirse en los temas claro y oscuro.
- El mapa debe seguir siendo legible y operable en móvil y no depender de hover. En pantallas estrechas, la cuadrícula puede desplazarse horizontalmente sin ocultar ninguna de las 12 semanas; el foco de teclado debe mantenerse visible.
- Si no hay sesiones, se muestran las 12 semanas vacías y la leyenda; no se muestra un detalle diario hasta seleccionar una fecha.

## Terminología visible

- **RF-10:** CUANDO la interfaz o la documentación `README.md` describan la continuidad de días estudiados, EL PROYECTO DEBE usar “Días seguidos estudiando” para la racha actual y “Mejor marca de días seguidos estudiando” para la mejor racha histórica, sin cambiar el cálculo ni los datos existentes.

## Casos límite del cambio de terminología

- Cuando la racha actual sea cero, el mensaje de estado no debe mostrar la palabra “racha” y debe conservar un sentido claro para animar a registrar una sesión.
- Cuando la mejor marca sea cero, su estado vacío debe usar la nueva terminología.
- Los valores de uno y varios días deben conservar la concordancia de singular y plural en los textos dinámicos.
- Los textos accesibles que se anuncien a tecnologías de asistencia deben usar la misma terminología visible.
- Los nombres de funciones, identificadores HTML, clases CSS, claves de `localStorage` y datos de sesiones no deben cambiar.

## Fuera de alcance

- Cambiar el cálculo de la racha actual o de la mejor marca histórica.
- Renombrar funciones, variables, identificadores, clases CSS o claves de datos.
- Cambiar el formato de las sesiones, las reglas de fechas, el mapa de actividad o cualquier otra funcionalidad.
- Modificar documentación distinta de las referencias pertinentes de `README.md`.

## Pruebas y criterios de aceptación

- La lógica de fechas y totales se implementa como funciones puras, sin DOM ni `localStorage`, que reciben la fecha local actual como parámetro.
- Probar la lógica con `node --test` sin instalar dependencias. No avanzar con pruebas fallidas.
- Verificar semanas que cruzan mes y año, cambios de horario, historial vacío o menor a 12 semanas, varias sesiones en una fecha, fechas futuras y cambios de filtros.
- Verificar los límites de 0, 30, 30.1, 60, 60.1, 90 y 90.1 minutos, además de sumas fraccionarias y sesiones coincidentes con cada límite.
- Confirmar que las 84 fechas están en el orden indicado; que los futuros están vacíos y deshabilitados; y que las fechas vacías pasadas/actuales se pueden seleccionar y muestran cero.
- Confirmar que los minutos agregados no cambian al modificar filtros y que la presentación funciona con ratón, tacto, teclado y ambos temas.
- Confirmar en una pantalla móvil estrecha que se puede recorrer la cuadrícula completa horizontalmente y que la fecha enfocada permanece visible.
