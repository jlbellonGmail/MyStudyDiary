# Spec 003 — Objetivo semanal de estudio
Estado: implementada

## Contexto y objetivo

Actualmente la persona puede consultar cuánto ha estudiado, pero no dispone de una meta semanal que le permita saber cuánto le falta ni si mantiene el ritmo esperado. Esta funcionalidad permitirá fijar un objetivo recurrente, consultar el avance de la semana local y recibir una orientación temprana sobre el ritmo necesario para alcanzarlo.

El objetivo base se repetirá cada semana hasta que se modifique. Un objetivo base nuevo será efectivo desde la semana actual y las semanas futuras, sin recalcular las semanas pasadas. Una semana actual o futura podrá tener un objetivo distinto o una excepción explícita de “sin objetivo”, sin alterar el objetivo base ni las semanas pasadas, que quedarán como histórico.

## Usuarios

Personas que registran y consultan sus sesiones de estudio y quieren planificar una cantidad semanal de estudio.

## Historias de usuario

- HU-1. Como persona usuaria, quiero fijar un objetivo semanal de horas para comprometerme con una cantidad concreta de estudio.
- HU-2. Como persona usuaria, quiero ver las horas estudiadas, el porcentaje y un círculo de avance para conocer rápidamente mi progreso.
- HU-3. Como persona usuaria, quiero saber si voy al día respecto al momento de la semana para poder corregir mi ritmo antes de terminarla.
- HU-4. Como persona usuaria, quiero cambiar el objetivo base o establecer una excepción para una semana concreta para adaptar mi planificación.
- HU-5. Como persona usuaria, quiero dejar una semana sin objetivo para que una semana excepcional no se interprete como incumplimiento.

## Definiciones

- **Semana:** periodo local que comienza el lunes y termina el domingo.
- **Objetivo base:** cantidad entera y positiva de horas que se repite en todas las semanas actuales o futuras que no tienen una excepción; un cambio solo es aplicable desde la semana en que se realiza y hacia adelante.
- **Excepción semanal:** configuración de una semana actual o futura que sustituye al objetivo base; las semanas pasadas no se pueden editar.
- **Excepción “sin objetivo”:** configuración de una semana actual o futura que hace que esa semana no tenga indicador de progreso ni estado de ritmo y muestre un aviso para fijar un objetivo.
- **Objetivo efectivo histórico:** objetivo base o excepción que estaba aplicándose cuando una semana dejó de ser la semana actual; queda fijado para esa semana y no cambia por modificaciones posteriores.
- **Semana consultada:** semana actual o pasada cuyo progreso se está visualizando; las semanas pasadas pueden consultarse, pero su configuración no puede editarse.
- **Horas estudiadas:** suma de los minutos finitos y mayores que cero de las sesiones con fecha local válida que pertenece a la semana actual y no es posterior al día actual, convertida a formato de horas y minutos. Varias sesiones del mismo día se suman y se conservan los minutos fraccionarios válidos.
- **Días transcurridos:** número de días desde el lunes hasta el día actual, ambos incluidos; el lunes son 1/7 y el domingo son 7/7.
- **Horas esperadas:** objetivo semanal multiplicado por los días transcurridos y dividido entre 7.
- **Estado:** “✅ Objetivo cumplido” cuando las horas estudiadas alcanzan el objetivo; “🟢 Vas al día” cuando no lo han alcanzado pero alcanzan las horas esperadas; “🟠 Vas por detrás” cuando son inferiores a las horas esperadas.

## Requisitos funcionales

- RF-1: CUANDO la persona configure un objetivo base, EL SISTEMA lo aceptará únicamente si es un número entero positivo y lo aplicará desde la semana actual y en las semanas futuras que no tengan excepción.
- RF-2: CUANDO la persona cambie el objetivo base, EL SISTEMA usará el nuevo valor desde la semana actual y en las semanas futuras sin excepción, conservará las excepciones ya configuradas y no modificará los objetivos históricos de las semanas pasadas.
- RF-3: CUANDO la persona configure una excepción con un número entero positivo para la semana actual o una futura, EL SISTEMA aplicará ese valor únicamente a esa semana, no modificará el objetivo base y conservará las semanas pasadas como históricas y no editables.
- RF-4: CUANDO la persona configure una excepción de “sin objetivo” para la semana actual o una futura, EL SISTEMA dejará esa semana sin indicador ni estado, mostrará un aviso claro de que puede fijarse un objetivo y no modificará el objetivo base ni las semanas pasadas.
- RF-5: CUANDO la persona quite una excepción de la semana actual o de una semana futura, EL SISTEMA restaurará en esa semana el objetivo base que le sea aplicable.
- RF-6: CUANDO la configuración del objetivo base o de una excepción se guarde, EL SISTEMA la conservará y la recuperará al volver a abrir la aplicación.
- RF-7: CUANDO la semana actual tenga un objetivo aplicable, EL SISTEMA sumará las sesiones de lunes hasta hoy de esa semana, excluirá las fechas futuras y las entradas inválidas o no utilizables, y calculará las horas estudiadas a partir de los minutos finitos mayores que cero.
- RF-8: CUANDO la semana actual tenga un objetivo aplicable, EL SISTEMA calculará las horas esperadas como objetivo × días transcurridos / 7, contando el lunes como primer día y el domingo como séptimo.
- RF-9: CUANDO la semana actual tenga un objetivo aplicable, EL SISTEMA calculará el porcentaje real como minutos estudiados / (objetivo en horas × 60) × 100, mostrará las horas estudiadas en formato de horas y minutos destacadas, expresará el objetivo en horas enteras, mostrará debajo el porcentaje y representará el avance con un círculo cuya circunferencia corresponda al avance visual.
- RF-10: CUANDO el porcentaje real de avance supere el 100 %, EL SISTEMA mostrará el porcentaje como máximo 100 % y limitará el arco del círculo al equivalente visual de 100 %, pero mantendrá visibles las horas reales por encima del objetivo; cuando el porcentaje visual sea 0 %, el arco será 0/100 de la circunferencia, cuando sea 100 %, será la circunferencia completa, y los valores intermedios mostrarán un arco proporcional al porcentaje visual.
- RF-11: CUANDO las horas estudiadas alcancen o superen el objetivo, EL SISTEMA mostrará el estado “✅ Objetivo cumplido”.
- RF-12: CUANDO las horas estudiadas sean inferiores al objetivo pero alcancen las horas esperadas, EL SISTEMA mostrará el estado “🟢 Vas al día”.
- RF-13: CUANDO las horas estudiadas sean inferiores a las horas esperadas, EL SISTEMA mostrará el estado “🟠 Vas por detrás”.
- RF-14: CUANDO la semana actual no tenga un objetivo aplicable, EL SISTEMA no mostrará el indicador de progreso ni un estado de ritmo y mostrará un aviso claro de que puede fijarse un objetivo.
- RF-15: SI la persona intenta guardar un objetivo base o una excepción que no sea un entero positivo, ENTONCES EL SISTEMA mostrará un error comprensible, no guardará ese valor y conservará la configuración válida anterior.
- RF-16: CUANDO cambie el día o la semana del calendario local, EL SISTEMA recalculará automáticamente las horas estudiadas, las horas esperadas, el porcentaje, el círculo y el estado con la configuración aplicable a la nueva semana, incluso al cruzar medianoche, mes, año o un cambio de hora.
- RF-17: CUANDO cambien las sesiones de la semana actual, EL SISTEMA actualizará las horas estudiadas, el porcentaje, el círculo y el estado sin modificar la configuración del objetivo.
- RF-18: EL SISTEMA calculará el progreso, el porcentaje y los estados con el valor exacto de los minutos fraccionarios válidos; mostrará el porcentaje como entero redondeado al más cercano (los valores exactamente intermedios se redondearán hacia arriba) y mostrará las horas estudiadas en horas y minutos redondeando los minutos al entero más cercano y convirtiendo 60 minutos en una hora, de modo que 90,5 minutos se muestre como “1 h 31 min”, incluidos los excesos sobre la meta.
- RF-19: SI una entrada no tiene una fecha local válida, tiene una fecha futura o no tiene minutos finitos mayores que cero, ENTONCES EL SISTEMA la ignorará para el progreso sin romper ni ocultar el indicador de una semana que sí tenga objetivo.
- RF-20: EL SISTEMA conservará las sesiones existentes y las utilizará para calcular el progreso sin modificar sus fechas, temas ni minutos.
- RF-21: CUANDO no exista todavía un objetivo base ni una excepción aplicable para la semana actual, EL SISTEMA mostrará el aviso para fijar un objetivo y no mostrará el indicador.
- RF-22: CUANDO una semana deje de ser la semana actual, EL SISTEMA fijará para ella el objetivo efectivo que estuviera aplicándose, ya fuera el objetivo base o una excepción, y un cambio posterior del objetivo base no reescribirá ese histórico.
- RF-23: CUANDO la persona consulte una semana histórica, EL SISTEMA aplicará la excepción que corresponda a esa semana, mantendrá su objetivo efectivo histórico y no permitirá editar su configuración.
- RF-24: CUANDO una semana histórica tenga una excepción “sin objetivo”, EL SISTEMA conservará esa situación, no mostrará indicador ni estado y mostrará el aviso correspondiente para fijar un objetivo, sin permitir editar la semana.

## Requisitos no funcionales

- Las fechas y el cambio de semana se interpretarán según el calendario local de la persona usuaria.
- Los textos del indicador, el aviso, los estados y los errores serán comprensibles y estarán en español.
- El círculo no será la única forma de comunicar el progreso: las horas y el porcentaje deberán estar disponibles como texto.
- Cambiar una configuración semanal no producirá cambios en sesiones ni en objetivos de otras semanas.

## Casos límite

- El lunes las horas esperadas serán 1/7 del objetivo; el domingo serán el objetivo completo.
- Al cruzar la medianoche local del domingo al lunes, el indicador pasará a la nueva semana, conservará el objetivo base y aplicará la excepción de esa nueva semana si existe.
- Los cambios de mes, año y hora local no alterarán el orden de los días de lunes a domingo ni harán que una fecha cuente dos veces o deje de contar.
- Una semana sin sesiones tendrá cero horas estudiadas y, si tiene objetivo, mostrará “🟠 Vas por detrás” desde el lunes.
- Si las horas estudiadas son exactamente las horas esperadas y todavía no se ha alcanzado la meta, el estado será “🟢 Vas al día”.
- Si las horas estudiadas son exactamente el objetivo, el estado será “✅ Objetivo cumplido”.
- Si las horas estudiadas superan el objetivo, las horas mostrarán el exceso y el porcentaje y el arco permanecerán en 100 %.
- Los minutos fraccionarios se conservarán para el cálculo: 90,5 minutos cuentan como 90,5 para porcentaje y estados y se muestran como “1 h 31 min”.
- Con 0 % visual el círculo no mostrará arco; con 100 % mostrará toda la circunferencia; entre ambos mostrará una fracción proporcional al porcentaje visual.
- Varias sesiones en una misma fecha se sumarán individualmente al total semanal.
- Las sesiones con fecha posterior al día actual no contarán para el progreso, aunque estén dentro de la misma semana.
- Una semana con excepción positiva usará la excepción aunque exista un objetivo base.
- Una semana con excepción “sin objetivo” no mostrará indicador ni estado, aunque tenga sesiones o un objetivo base.
- Cambiar o eliminar una excepción hará que la semana vuelva a usar el objetivo base, salvo que se configure otra excepción.
- Una excepción o un cambio del objetivo base no podrá modificar una semana pasada; las semanas pasadas solo conservarán su configuración histórica.
- Al pasar una semana a histórica, quedará fijado el objetivo efectivo que tenía en ese momento; cambiar después el objetivo base no lo sustituirá.
- Una excepción de una semana histórica seguirá aplicándose al consultarla; si era “sin objetivo”, conservará el aviso y no mostrará indicador ni estado.
- Si nunca se ha configurado un objetivo, la semana actual mostrará el aviso para fijarlo y no mostrará indicador.
- Una configuración guardada seguirá disponible después de cerrar y volver a abrir la aplicación.
- Una entrada inválida junto con entradas válidas no impedirá sumar las entradas válidas ni mostrar el indicador.
- Los objetivos con cero, valores negativos, fracciones, texto vacío o valores no numéricos no serán aceptados.
- El porcentaje real puede tener decimales antes de mostrarse; se redondeará al entero más cercano, con los valores exactamente intermedios hacia arriba, sin cambiar la comparación usada para el estado.
- El redondeo de los minutos solo afectará a la presentación: los minutos exactos, incluidos los fraccionarios, se usarán para porcentaje y estados; 60 minutos presentados se expresarán como una hora.

## Fuera de alcance

- Objetivos distintos por día de la semana.
- Editar o recalcular objetivos de semanas pasadas; esas semanas son históricas y no editables.
- Ajustar automáticamente el objetivo según el historial, la racha o el tiempo restante.
- Incluir sesiones futuras en el progreso.
- Cambiar, borrar o corregir sesiones desde el indicador de objetivo.
- Mostrar indicadores de objetivos simultáneos para varias semanas.
- Compartir objetivos o progreso entre personas, dispositivos o cuentas.

## Criterios de finalización

- Se puede fijar y cambiar un objetivo base usando únicamente horas enteras positivas.
- El objetivo base nuevo se aplica desde la semana actual y a las futuras sin excepción, sin modificar semanas pasadas; las excepciones solo se pueden establecer para la semana actual o futuras.
- Se puede establecer para una semana actual o futura un objetivo entero positivo distinto o la excepción “sin objetivo”, quitarla para restaurar el objetivo base y dejar las semanas pasadas sin editar.
- Al dejar de ser actual una semana, su objetivo efectivo queda fijado como histórico; al consultarla, su excepción sigue vigente, pero no se puede editar.
- La configuración del objetivo base y de las excepciones persiste al cerrar y volver a abrir la aplicación; si nunca hubo objetivo, solo aparece el aviso.
- La semana se calcula de lunes a domingo con fechas locales y el cálculo del esperado usa 1/7 el lunes, 3/7 el miércoles y 7/7 el domingo, también al cruzar medianoche, mes, año o cambios de hora.
- Las horas semanales suman sesiones con fecha local válida, minutos finitos mayores que cero y fecha hasta hoy; las futuras y las entradas no utilizables se ignoran.
- Las horas estudiadas se muestran como horas y minutos, el objetivo como horas enteras y el porcentaje como entero redondeado al más cercano.
- Los minutos fraccionarios se calculan con exactitud y se muestran redondeados al minuto más cercano, con conversión de 60 minutos a una hora; el porcentaje y los estados no usan esos redondeos.
- El porcentaje real se calcula con minutos estudiados / (objetivo en horas × 60) × 100; el porcentaje visual y el arco se limitan al 100 %, pero las horas muestran el exceso.
- El indicador muestra horas destacadas, porcentaje debajo y círculo de avance: 0 % equivale a 0/100 de la circunferencia, 100 % a la circunferencia completa y los valores intermedios a una fracción proporcional limitada al 100 %; las horas muestran el exceso.
- El estado mostrado coincide con las comparaciones sin redondear: cumplido al alcanzar la meta, al día al alcanzar lo esperado sin haber cumplido, y por detrás por debajo de lo esperado.
- Una semana sin objetivo muestra únicamente el aviso para fijarlo, sin indicador ni estado.
- Una semana histórica con excepción “sin objetivo” conserva únicamente el aviso para fijar un objetivo, sin indicador ni estado, y no permite editar esa excepción.
- Los valores inválidos se rechazan sin perder la configuración anterior ni modificar sesiones.
- Las pruebas de casos límite verifican semanas sin sesiones, varias sesiones por día, fechas futuras, cambio de semana, exceso sobre la meta y las dos clases de excepción.

## Dudas abiertas

- Ninguna.
