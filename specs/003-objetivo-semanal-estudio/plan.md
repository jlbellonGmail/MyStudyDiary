# Plan — Spec 003: Objetivo semanal de estudio

## Alcance de la implementación

La implementación añadirá el objetivo semanal sin alterar la forma de las sesiones existentes (`date`, `topic`, `minutes`) ni romper los respaldos actuales. El indicador mostrará una sola semana cada vez: por defecto la semana actual y, cuando se consulte, una semana histórica en modo solo lectura.

## Archivos y responsabilidades

| Archivo | Acción | Responsabilidad | RF |
| --- | --- | --- | --- |
| `objective-logic.js` | Crear | Lógica pura de calendario local, configuración de objetivos, resolución histórica y cálculo del progreso. Se expondrá tanto para las pruebas de Node como para la interfaz. | RF-1–RF-5, RF-7–RF-13, RF-15–RF-19, RF-21–RF-24 |
| `tests/objective-logic.test.js` | Crear | Pruebas unitarias de calendario, configuración, persistencia representable, histórico, sesiones válidas, fórmula, redondeos, estados y arco. | RF-1–RF-5, RF-7–RF-13, RF-15–RF-19, RF-21–RF-24 |
| `index.html` | Modificar | Estructura del panel de objetivo, formulario de objetivo base/excepción, selector de semana y texto alternativo del círculo. | RF-1–RF-5, RF-7–RF-14, RF-21, RF-23–RF-24 |
| `styles.css` | Modificar | Presentación del panel, horas destacadas, porcentaje, círculo de avance, estados, aviso y controles de semanas; adaptación al viewport móvil y a ambos temas. | RF-9–RF-14, RF-24 |
| `app.js` | Modificar | Lectura y guardado de la configuración, eventos del formulario y selector, actualización del indicador al cambiar sesiones/día/semana y bloqueo de edición histórica. | RF-1–RF-6, RF-9–RF-17, RF-20–RF-24 |

La configuración de objetivos se persistirá separada de las sesiones, con una clave propia y una forma versionable que contenga el objetivo base, revisiones de base por semana, excepciones y objetivos históricos efectivos. El lector aceptará una configuración inexistente como “sin objetivo”; si encuentra una configuración dañada, la tratará como no configurada sin tocar las sesiones. Los respaldos de sesiones existentes seguirán siendo importables y no reemplazarán la configuración de objetivos, porque la spec exige persistencia local pero no amplía el formato de respaldo.

## Funciones puras y contrato temporal

Todas las funciones que dependan del calendario recibirán `hoy` explícitamente; no leerán la fecha del sistema ni el DOM. Las funciones principales serán:

- `parseLocalDate(dateString)` y `getLocalDateString(date)`: validación estricta de fechas de calendario y conversión local sin interpretar cadenas como UTC.
- `getWeekStart(date)` y `getWeekKey(date)`: obtención del lunes local y de la clave de semana, avanzando con componentes de calendario.
- `getWeekEnd(weekStart)`, `getElapsedDays(weekStart, hoy)` y `compareWeekToToday(weekStart, hoy)`: delimitación de la semana y clasificación pasada/actual/futura, correcta al cruzar medianoche, DST, meses y años.
- `validateGoalHours(value)`: acepta solamente enteros positivos y devuelve un resultado verificable con error para cero, negativos, fracciones, texto vacío, no numéricos o no finitos.
- `getApplicableGoal(config, weekStart, hoy)`: resuelve excepción positiva, excepción “sin objetivo”, revisión del objetivo base u objetivo histórico congelado, respetando que solo se editen semanas actuales/futuras.
- `setBaseGoal(config, hours, hoy)`, `setWeekException(config, weekStart, exception, hoy)` y `removeWeekException(config, weekStart, hoy)`: devuelven nuevas configuraciones, validan el alcance temporal y no mutan semanas históricas.
- `freezeHistoricalWeeks(config, hoy)`: materializa el objetivo efectivo de las semanas que dejaron de ser actuales, incluyendo “sin objetivo”, sin reescribirlas con una revisión posterior del objetivo base.
- `calculateWeekProgress(sessions, goal, weekStart, hoy)`: filtra fechas locales válidas, no futuras respecto al corte aplicable, y minutos finitos mayores que cero; suma minutos exactos, calcula esperado, porcentaje y estado.
- `roundDuration(minutes)`: redondea solo la presentación de minutos al entero más cercano, convierte 60 minutos en una hora y conserva el exceso; por ejemplo, 90,5 → 1 h 31 min.
- `getVisualProgress(realPercent)` y `getArcFraction(visualPercent)`: limita a 0–100 y devuelve 0, 1 o la fracción proporcional intermedia para el círculo.
- `formatGoalProgress(progress)`: produce los valores textuales en español sin usar los valores redondeados para las comparaciones.

Para una semana histórica, el corte de sesiones será el final del domingo de esa semana; para la semana actual será `hoy`; una semana futura no se presentará como progreso actual. El objetivo esperado se calculará con días transcurridos 1/7 a 7/7, y las comparaciones de estado usarán minutos exactos.

## Algoritmo en pseudocódigo

### Resolución y congelado de objetivos

```text
al cargar configuración:
  normalizar o usar configuración vacía
  calcular semanaActual a partir de hoy local
  materializar como históricos las semanas anteriores que todavía no estén congeladas

al cambiar objetivo base:
  validar entero positivo
  añadir revisión {semanaInicio: semanaActual, horas}
  conservar revisiones, excepciones e históricos anteriores

al configurar excepción:
  validar que semanaInicio >= semanaActual
  validar horas enteras positivas o marcador "sin objetivo"
  guardar excepción solo para esa semana

al quitar excepción:
  validar que la semana no sea histórica
  eliminar la excepción; la resolución vuelve al objetivo base aplicable

resolver(semana):
  si existe histórico congelado:
    devolverlo, aunque exista una revisión posterior del objetivo base
  si existe excepción para semana:
    devolver objetivo positivo o "sin objetivo"
  devolver la última revisión de base cuyo inicio sea menor o igual a semana
```

### Cálculo del progreso

```text
si el objetivo resuelto es "sin objetivo" o no existe:
  devolver aviso, sin indicador ni estado

inicio = lunes local de la semana consultada
fin = domingo local de la semana consultada
corte = mínimo(hoy local, fin)
minutos = 0
para cada sesión:
  si fecha no es localmente válida, ignorar
  si fecha < inicio o fecha > corte, ignorar
  si minutes no es finito o minutes <= 0, ignorar
  minutos += minutes sin redondear

días = días de calendario desde inicio hasta corte, limitados a 1..7
esperado = objetivoHoras * 60 * días / 7
porcentajeReal = minutos / (objetivoHoras * 60) * 100
porcentajeVisual = limitar(porcentajeReal, 0, 100)
si minutos >= objetivoHoras * 60:
  estado = "✅ Objetivo cumplido"
sino si minutos >= esperado:
  estado = "🟢 Vas al día"
sino:
  estado = "🟠 Vas por detrás"

porcentajeMostrado = redondear(porcentajeReal al entero más cercano, .5 hacia arriba)
duraciónMostrada = redondear minutos al minuto más cercano y convertir 60 min a 1 h
arco = porcentajeVisual / 100
```

## Pintado e interacción de interfaz

1. Se añadirá un panel identificable que muestre el objetivo base y permita editarlo con validación inmediata y mensaje corregible.
2. Se añadirá un control para elegir la semana actual o una semana futura al crear/quitar una excepción; las semanas pasadas se mostrarán como históricas y bloquearán sus controles de edición.
3. El indicador mostrará las horas estudiadas destacadas en formato de horas/minutos, el objetivo en horas enteras, el porcentaje entero debajo, el círculo y el estado textual. El arco tendrá 0 de 100 para 0 %, la circunferencia completa para 100 % y una proporción intermedia limitada.
4. Una semana sin objetivo mostrará solamente un aviso claro para fijarlo. La misma regla se aplicará a una excepción histórica “sin objetivo”, sin habilitar edición.
5. El render se integrará con el ciclo existente: guardar, editar o eliminar sesiones actualizará el panel sin aplicar filtros de sesiones al cálculo; el cambio de fecha local a medianoche recalculará la semana y congelará el objetivo que corresponda.
6. Los textos del círculo tendrán equivalente textual mediante porcentaje y horas; los estados y avisos serán accesibles y se conservará el comportamiento en tema oscuro y viewport de 375 px.

## Decisiones técnicas y alternativas descartadas

- **Módulo de lógica separado:** se creará una unidad pura con puente compatible con Node y navegador, en vez de poner cálculos en `app.js`, para respetar la separación de lógica/interfaz y permitir `node --test` sin DOM. Se descarta reutilizar directamente el estado global de la interfaz.
- **Configuración separada de sesiones:** se conservará la forma existente de las sesiones y se guardarán objetivos en una estructura versionable independiente. Se descarta añadir campos a cada sesión porque no representan una propiedad de una sesión y arriesgarían compatibilidad hacia atrás.
- **Revisiones de objetivo base más histórico congelado:** se guardará cuándo empieza cada objetivo base y el objetivo efectivo histórico de cada semana. Se descarta recalcular el pasado con el último objetivo, porque contradice el congelado histórico.
- **Excepción explícita como marcador:** “sin objetivo” será distinto de ausencia de excepción. Se descarta interpretar una excepción ausente como “sin objetivo”, porque la ausencia debe heredar el objetivo base.
- **Duraciones exactas para cálculo y redondeo tardío:** se mantendrán los minutos fraccionarios hasta porcentaje/estado y se redondeará únicamente al presentar. Se descarta redondear cada sesión antes de sumar, porque produciría estados y porcentajes incorrectos.
- **Arco derivado de porcentaje visual:** el arco usará `min(max(porcentajeReal, 0), 100) / 100`. Se descarta representar porcentajes superiores a 100 % con más de una vuelta, porque la spec exige circunferencia completa como máximo.
- **Semana por componentes locales:** se usarán fechas de calendario locales y no diferencias fijas de milisegundos. Se descarta usar UTC o asumir que todos los días duran 24 horas, porque fallaría en cambios de hora.
- **No ampliar respaldos en esta spec:** los respaldos de sesiones seguirán siendo compatibles y no modificarán objetivos al importarse. Se descarta ampliar el contrato de backup porque la spec solo exige persistencia al reabrir y no define exportación/importación de objetivos.

## Estrategia de tests con `node --test`

Se ejecutará `node --test` tras cada grupo de cambios y al finalizar. `tests/objective-logic.test.js` cubrirá:

- Fechas locales: lunes-domingo, lunes 1/7, miércoles 3/7, domingo 7/7, medianoche, cambios de mes/año y una zona con DST.
- Validación y configuración: enteros positivos, valores inválidos, base recurrente, excepciones positivas, “sin objetivo”, quitar excepción, semanas futuras e intento de editar históricas.
- Congelado: una semana que pasa a histórica conserva base o excepción y no cambia después de modificar la base; la excepción histórica “sin objetivo” conserva aviso.
- Sesiones: suma de varias sesiones, fracciones exactas, fechas inválidas/futuras, minutos cero/negativos/no finitos y mezcla de entradas válidas e inválidas.
- Matemática: fórmula exacta de porcentaje, esperado proporcional, precedencia de cumplido sobre al día, límites y redondeo `90.5 → 1 h 31 min`.
- Visualización: porcentaje y arco en 0, intermedio y sobre 100, con fracción proporcional y límite en 1.
- Inmutabilidad: las funciones no mutan sesiones ni configuraciones de entrada.

Las pruebas existentes de sesiones y mapa se mantendrán verdes. Las comprobaciones de interfaz se harán después de la lógica con Chrome DevTools en `file://`, datos aislados, consola limpia y viewport de 375 px; no sustituyen los tests de lógica.

## Trazabilidad completa

- **RF-1–RF-6:** configuración, validación, excepciones, retirada y persistencia en `objective-logic.js` y `app.js`; pruebas de configuración y reapertura.
- **RF-7–RF-10:** filtrado, fórmula, representación textual y círculo en `objective-logic.js`, `index.html`, `styles.css` y `app.js`; pruebas de sesiones, fórmula y arco.
- **RF-11–RF-13:** clasificación de estados en `calculateWeekProgress`; pruebas de límites exactos y precedencia.
- **RF-14–RF-15:** aviso sin objetivo y validación de entrada en lógica e interfaz; pruebas de ausencia, marcador y errores.
- **RF-16–RF-17:** recalculado por fecha local y por cambios de sesiones en `app.js`, con funciones temporales puras y pruebas de cambio de día/semana.
- **RF-18–RF-19:** exactitud de fracciones, redondeo tardío y descarte seguro en `objective-logic.js`; pruebas de precisión y entradas inválidas.
- **RF-20:** lectura no destructiva de sesiones en la lógica y render; prueba de inmutabilidad.
- **RF-21:** estado inicial sin configuración en resolución, persistencia e interfaz; prueba de aviso inicial.
- **RF-22–RF-24:** revisiones, congelado y consulta histórica en `objective-logic.js` y controles de `app.js`; pruebas de histórico editable/no editable y “sin objetivo” histórico.
