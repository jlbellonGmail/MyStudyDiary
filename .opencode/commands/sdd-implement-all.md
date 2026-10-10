---
description: SDD · Implementa todas las tareas pendientes de una spec, en orden (uso - /sdd-implement-all 00X-nombre)
agent: build
---

Implementa, en orden, todas las tareas pendientes de specs/$1/tasks.md, siguiendo specs/$1/plan.md, docs/constitution.md y la skill sdd.

Para CADA tarea:
1. Escribe primero los tests y comprueba que fallan.
2. Escribe el código hasta que pasen.
3. Ejecuta node --test.
4. Marca la tarea como hecha en tasks.md y pasa a la siguiente.

Si una tarea falla, los tests no pasan o el plan no encaja, PARA y explícalo.
Al terminar, actualiza MEMORY.md y resume: tareas hechas, archivos modificados y resultado de node --test.
