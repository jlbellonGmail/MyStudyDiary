# Spec 002 — Editar y eliminar sesiones registradas
Estado: implementada

## Contexto y objetivo

Actualmente las sesiones registradas no pueden corregirse ni eliminarse individualmente. Esta funcionalidad permitirá mantener el historial correcto cuando una sesión contenga datos equivocados o deba retirarse.

## Usuarios

Personas que registran y consultan sus sesiones de estudio.

## Historias de usuario

- HU-1. Como persona usuaria, quiero modificar la fecha, el tema y los minutos de una sesión para corregir errores.
- HU-2. Como persona usuaria, quiero eliminar una sesión concreta para mantener únicamente las sesiones válidas.
- HU-3. Como persona usuaria, quiero confirmar una eliminación antes de ejecutarla para evitar pérdidas accidentales.

## Definiciones

- **Sesión válida:** una sesión con tema obligatorio, minutos enteros mayores que cero y una fecha no posterior a la fecha actual.
- **Sesión seleccionada:** la única sesión sobre la que se está realizando una operación.

## Requisitos funcionales

- RF-1: CUANDO la persona seleccione una sesión y solicite editarla, EL SISTEMA permitirá modificar su fecha, tema y minutos.
- RF-2: CUANDO los tres valores modificados sean válidos, EL SISTEMA guardará los cambios únicamente en la sesión seleccionada.
- RF-3: SI la fecha es posterior a la fecha actual, ENTONCES EL SISTEMA mostrará un error, no guardará el cambio y conservará la sesión original mientras permite corregirla.
- RF-4: SI el tema está vacío o los minutos no son enteros mayores que cero, ENTONCES EL SISTEMA mostrará el error correspondiente, no guardará el cambio y conservará la sesión original mientras permite corregirla.
- RF-5: CUANDO la persona solicite eliminar una sesión, EL SISTEMA pedirá confirmación antes de eliminarla.
- RF-6: CUANDO la persona confirme la eliminación, EL SISTEMA eliminará únicamente la sesión seleccionada.
- RF-7: SI la persona no confirma la eliminación, ENTONCES EL SISTEMA conservará la sesión sin cambios.
- RF-8: EL SISTEMA mantendrá sin cambios las demás sesiones durante cualquier edición o eliminación individual.

## Requisitos no funcionales

- EL SISTEMA no perderá sesiones distintas de la seleccionada.
- Las validaciones y los mensajes asociados serán comprensibles para la persona usuaria.
- Las fechas se interpretarán según la fecha actual del calendario de la persona usuaria.

## Casos límite

- Varias sesiones pueden tener la misma fecha; editar o eliminar una no modificará las demás.
- Una sesión no podrá guardarse con una fecha futura.
- Una sesión no podrá guardarse sin tema ni con cero minutos, minutos negativos o minutos no enteros.
- Rechazar una eliminación no producirá ningún cambio.
- Si una edición contiene valores inválidos, la sesión conservará sus valores originales y la persona podrá corregirlos sin iniciar de nuevo la edición.

## Fuera de alcance

- Editar o eliminar varias sesiones a la vez.
- Eliminar todo el historial mediante una única acción.
- Modificar datos distintos de la fecha, el tema y los minutos.

## Criterios de finalización

- Se puede editar individualmente la fecha, el tema y los minutos de una sesión.
- Los valores inválidos muestran el error correspondiente, no se guardan y la sesión original permanece intacta.
- La edición sigue disponible para corregir los valores sin volver a abrirla.
- La fecha actual es válida y las fechas futuras no lo son.
- La eliminación siempre requiere confirmación.
- Al confirmar, solo desaparece la sesión seleccionada.
- Al cancelar, la sesión permanece.
- Las demás sesiones permanecen intactas.

## Dudas abiertas

- Ninguna.
