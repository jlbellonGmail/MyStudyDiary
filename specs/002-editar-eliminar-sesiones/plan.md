# Plan técnico: editar y eliminar sesiones registradas

Este plan deriva de la spec aprobada `specs/002-editar-eliminar-sesiones/spec.md` y respeta `docs/constitution.md`. No cambia el formato de las sesiones guardadas: cada registro continúa usando `date`, `topic`, `minutes` y, cuando exista, `createdAt`.

## Requisitos funcionales cubiertos

- **RF-1:** seleccionar una sesión y abrir su edición para modificar fecha, tema y minutos.
- **RF-2:** validar y guardar únicamente la sesión seleccionada.
- **RF-3:** rechazar fechas futuras, mostrar el error y mantener la sesión original mientras continúa la edición.
- **RF-4:** rechazar tema vacío o minutos no enteros mayores que cero, mostrar el error y mantener la sesión original mientras continúa la edición.
- **RF-5:** solicitar confirmación antes de eliminar.
- **RF-6:** eliminar solamente la sesión seleccionada después de confirmar.
- **RF-7:** conservar la sesión si se rechaza la confirmación.
- **RF-8:** preservar las demás sesiones en todas las operaciones.

## Archivos y responsabilidades

### Archivos que se crearán

- **`session-logic.js` — crear:** contener la validación y las transformaciones puras de sesiones. Exponer la misma API como `window.StudySessions` para el navegador y mediante `module.exports` para los tests de Node, sin dependencias ni acceso al DOM, al reloj o a `localStorage`. (RF-2–RF-4, RF-6, RF-8)
- **`tests/session-logic.test.js` — crear:** probar directamente la lógica pura con `node:test`, incluyendo fechas, validaciones, edición, eliminación, duplicados de fecha e inmutabilidad. (RF-2–RF-4, RF-6, RF-8)

### Archivos que se modificarán

- **`index.html` — modificar:** cargar `session-logic.js` antes de `app.js` como script clásico; añadir un control de cancelar edición asociado al formulario, inicialmente oculto. Mantener el formulario existente como punto de entrada tanto para registrar como para editar. (RF-1, RF-3, RF-4)
- **`app.js` — modificar:** mantener el estado de la sesión en edición, conectar los controles de editar y eliminar de cada fila, reutilizar el formulario, validar con la API pura, guardar el array completo solo después de una operación válida y volver a renderizar todas las vistas tras guardar o eliminar. (RF-1–RF-8)
- **`styles.css` — modificar:** dar formato a las acciones individuales de cada sesión, al estado de edición, al botón de cancelar y a los mensajes de error sin romper los temas claro/oscuro ni la vista de 375 px. (RF-1, RF-3–RF-5)
- **`MEMORY.md` — modificar al completar la fase de implementación:** registrar el estado de la spec, la decisión de no añadir identificadores persistidos y cualquier error de fechas o persistencia que deba evitarse.

### Archivos que no se modificarán

- **`heatmap-logic.js`:** ya contiene la lógica pura del mapa; la actualización del mapa se obtiene mediante el render existente después de cambiar el historial. (RF-2, RF-6, RF-8)
- **`tests/heatmap-logic.test.js`:** no necesita cambios de alcance, salvo que la implementación revele una regresión en su contrato actual.
- **Datos guardados y copias JSON:** no se añade ni elimina ningún campo persistido. (RF-8)
- No se añadirán dependencias, frameworks, módulos ES, build ni backend.

## Funciones puras de lógica

Todas las funciones de `session-logic.js` recibirán sus datos por parámetro y no consultarán el reloj, el DOM ni `localStorage`. Cuando una decisión dependa de la fecha actual, recibirán `hoy` como cadena local válida `AAAA-MM-DD`. Las fechas se validarán mediante componentes locales; no se usará `toISOString()`, `new Date("AAAA-MM-DD")` ni sumas de milisegundos.

- **`isFutureDate(date, hoy)`**: devolver `true` si la fecha válida es posterior a `hoy`; comparar cadenas `AAAA-MM-DD` solo después de validar el formato y el calendario.
- **`validateSessionValues(values, hoy)`**: devolver un resultado determinista con `valid` y los errores por campo. Exigir fecha válida no futura, tema no vacío después de quitar espacios y minutos finitos, enteros y mayores que cero. Mantener el límite de 120 caracteres ya aceptado por los datos actuales.
- **`updateSession(sessions, index, values)`**: devolver un nuevo array con una copia de la sesión en `index` usando los valores ya validados; no mutar `sessions`, conservar las demás sesiones y conservar `createdAt` de la sesión editada.
- **`deleteSession(sessions, index)`**: devolver un nuevo array sin la sesión en `index`; no mutar `sessions`. Si el índice no existe, devolver una copia equivalente sin borrar otra sesión.

La interfaz obtendrá `hoy` mediante la utilidad local ya compartida por `StudyHeatmap` y lo pasará a `validateSessionValues`. Las funciones `updateSession` y `deleteSession` no necesitan `hoy` porque no calculan fechas; reciben directamente la colección y el índice seleccionado. (RF-2–RF-4, RF-6, RF-8)

## Algoritmo en pseudocódigo

### Renderizado de acciones

```text
renderizar las sesiones filtradas en el orden actual
para cada sesión visible:
    obtener su índice en el array completo de sesiones
    pintar fecha, tema y minutos
    pintar botón Editar con ese índice
    pintar botón Eliminar con ese índice
```

El índice pertenece al array en memoria y no se guarda en los datos. Así se distinguen sesiones con la misma fecha o con el mismo `createdAt`, incluso cuando provienen de datos antiguos. (RF-1, RF-6, RF-8)

### Edición

```text
al pulsar Editar para un índice:
    guardar el índice como sesión en edición
    copiar sus valores actuales al formulario
    cambiar el texto del formulario a modo edición
    mostrar Cancelar edición
    llevar el foco al primer campo editable

al enviar el formulario en modo edición:
    obtener hoy como fecha local
    validar fecha, tema y minutos con validateSessionValues(valores, hoy)
    si hay errores:
        mostrar cada error en su campo o en el mensaje del formulario
        no modificar sessions ni localStorage
        conservar la edición abierta y los valores introducidos para corregirlos
        terminar
    nextSessions = updateSession(sessions, índice, valores)
    si saveSessions(nextSessions) falla:
        mostrar el error de persistencia
        conservar sessions y la edición abierta
        terminar
    sessions = nextSessions
    salir del modo edición y limpiar el formulario
    render(sessions)
    anunciar que la sesión fue actualizada
```

### Cancelación de la edición

```text
al pulsar Cancelar edición:
    limpiar el índice en edición
    restaurar el formulario de nueva sesión
    ocultar Cancelar edición
    limpiar errores y valores temporales
    devolver el foco al campo de tema
```

Cancelar no modifica el array ni el almacenamiento. (RF-2–RF-4, RF-8)

### Eliminación

```text
al pulsar Eliminar para un índice:
    mostrar una confirmación con la sesión identificada
    si la persona rechaza:
        conservar sessions y no actualizar la interfaz
        terminar
    nextSessions = deleteSession(sessions, índice)
    si saveSessions(nextSessions) falla:
        mostrar el error de persistencia
        conservar sessions
        terminar
    sessions = nextSessions
    si la sesión eliminada era la que estaba en edición:
        salir del modo edición
    render(sessions)
    anunciar que la sesión fue eliminada
```

Guardar el array completo se hará antes de sustituir el estado en memoria. Si falla la persistencia, los datos visibles y los guardados permanecen sin cambios. (RF-5–RF-8)

## Cómo se pinta en la interfaz

- Cada elemento de la lista de sesiones mostrará sus datos actuales y dos acciones individuales: **Editar** y **Eliminar**. Las acciones estarán asociadas a una sola sesión visible, incluso si varias comparten fecha. (RF-1, RF-6, RF-8)
- Al editar, el formulario existente se reutilizará con los tres valores rellenados. Su título, botón principal y mensaje indicarán que se está actualizando una sesión; aparecerá un botón **Cancelar edición**. (RF-1)
- La fecha tendrá como límite máximo la fecha local actual durante la edición. La validación pura seguirá siendo la autoridad para impedir fechas futuras aunque el límite visual no se aplique. (RF-3)
- Los errores se mostrarán junto al campo correspondiente y/o en el mensaje accesible del formulario. Los valores inválidos no reemplazarán los originales en el registro; la persona podrá corregirlos sin cerrar la edición. (RF-3, RF-4)
- La confirmación de eliminación identificará la acción como irreversible para esa sesión. Rechazarla no quitará la fila ni cambiará las estadísticas. (RF-5, RF-7)
- Después de guardar una edición o una eliminación confirmada, se renderizarán de nuevo la lista, los filtros visibles, estadísticas, racha, logros y mapa para que reflejen el historial actualizado. (RF-2, RF-6, RF-8)
- Si la operación modifica o elimina la única sesión de una fecha, los cálculos derivados se actualizarán con las reglas locales existentes; no se persistirán métricas derivadas. (RF-2, RF-6)
- Los botones tendrán nombres accesibles en español que incluyan la acción y permitan identificar la sesión. Se conservará el foco de forma razonable tras error, cancelación y éxito, y se revisará la interacción a 375 px y en ambos temas. (RF-1, RF-3–RF-7)

## Decisiones técnicas y alternativas descartadas

- **Reutilizar el formulario actual:** se usará un único formulario para registrar y editar, distinguiendo el modo mediante estado temporal. Esto evita duplicar campos, validaciones y mensajes. Se descarta crear un segundo formulario o modal de edición porque duplicaría comportamiento y aumentaría la superficie de errores. (RF-1, RF-3, RF-4)
- **Índice en memoria como identidad temporal:** las acciones llevarán el índice de la sesión dentro del array actual y no se añadirá un `id` persistido. Esto mantiene compatibilidad con sesiones antiguas, copias existentes y duplicados de fecha. Se descarta añadir un campo `id`, porque cambiaría el formato almacenado y exigiría migrar todos los datos. (RF-2, RF-6, RF-8)
- **Lógica pura separada en `session-logic.js`:** la validación, edición y eliminación se probarán sin DOM ni almacenamiento. Se descarta colocar toda la lógica en manejadores de `app.js`, porque dificultaría las pruebas deterministas y mezclaría responsabilidades. (RF-2–RF-4, RF-6, RF-8)
- **Fecha local explícita:** `hoy` se obtiene en la interfaz y se entrega a la validación; las fechas se comparan como calendarios locales ya validados. Se descartan UTC, `toISOString()`, `new Date("AAAA-MM-DD")` y diferencias en milisegundos, porque pueden aceptar o rechazar fechas equivocadas cerca de medianoche o cambios horarios. (RF-3, RF-4)
- **Validación de minutos enteros solo en la edición de esta spec:** se aplicará la regla aprobada al guardar cambios de una sesión. Las sesiones antiguas con minutos decimales seguirán pudiendo mostrarse y eliminarse para conservar compatibilidad; no se cambiará el flujo de registro nuevo sin que la spec lo pida. Se descarta endurecer también el alta nueva, porque ampliaría el alcance funcional. (RF-2, RF-4, RF-8)
- **Confirmación nativa del navegador:** se usará la confirmación existente del entorno para bloquear la eliminación hasta obtener una decisión explícita. Se descarta construir un diálogo propio porque la spec exige confirmación, no un componente visual específico, y un diálogo propio añadiría estados, estilos y riesgos de accesibilidad innecesarios. (RF-5, RF-7)
- **Persistencia atómica por reemplazo del array:** se construirá un nuevo array, se intentará guardar y solo después se actualizará el estado en memoria. Se descarta mutar primero el array porque un fallo de almacenamiento podría dejar la interfaz distinta de los datos conservados. (RF-2, RF-6, RF-8)
- **Acciones individuales en la lista filtrada:** cada fila tendrá sus propias acciones y ninguna acción masiva. Se descarta un selector múltiple o un botón de borrado global porque están fuera de alcance. (RF-1, RF-5–RF-8)

## Estrategia de tests y verificación

- Ejecutar **`node --test`** sin instalar paquetes. Los tests de lógica importarán `session-logic.js` directamente y no crearán DOM ni accederán a `localStorage`.
- Probar `isFutureDate` y `validateSessionValues` con una fecha anterior, hoy, una fecha futura, fechas inválidas, tema vacío o solo con espacios, tema dentro y fuera del límite, minutos cero, negativos, decimales, valores no finitos y enteros positivos. (RF-3, RF-4)
- Probar que el resultado de validación contiene errores identificables por campo y que una entrada inválida no se convierte en una sesión guardable. Pasar siempre `hoy` explícitamente para que las pruebas no dependan del reloj del equipo. (RF-3, RF-4)
- Probar `updateSession` con una sesión en cada posición, varias sesiones con la misma fecha y otras sesiones sin cambios. Comprobar que el array de entrada no se muta y que `createdAt` se conserva. (RF-2, RF-8)
- Probar `deleteSession` con la primera, una intermedia y la última sesión, duplicados de fecha y un índice inexistente. Comprobar que solo se elimina el elemento elegido y que el array de entrada no se muta. (RF-6, RF-8)
- Mantener las pruebas existentes de `heatmap-logic.js` y ejecutar la suite completa con `node --test` para comprobar que las operaciones no rompen el contrato del mapa ni las fechas locales. (RF-2, RF-6, RF-8)
- Verificar manualmente en Chrome DevTools, con datos sintéticos en un contexto aislado y abriendo `index.html` mediante `file://`: editar los tres campos, provocar cada error, corregirlo sin reabrir la edición, cancelar, confirmar y rechazar eliminaciones, operar con filtros y con sesiones de la misma fecha, y revisar que no hay errores de consola. (RF-1–RF-8)
- Comprobar después de cada operación válida la lista, filtros, estadísticas, racha, logros, mapa y persistencia al recargar. Confirmar que una operación fallida no cambia `localStorage` y que las demás sesiones permanecen. (RF-2–RF-8)
- Revisar teclado, nombres accesibles, foco, temas claro/oscuro y vista móvil de 375 px para los botones, el formulario y los mensajes de validación. (RF-1, RF-3–RF-7)
- La funcionalidad no se considerará terminada si `node --test` falla, si una validación permite guardar datos inválidos, si una operación afecta a otra sesión o si la interfaz queda desincronizada del almacenamiento.
