# AGENTS.md — Diario de Estudio

Web estática para registrar sesiones de estudio y motivarse viendo la racha de días seguidos.
Proyecto didáctico: el código debe poder entenderlo alguien que empieza a programar.

## Stack y estructura
- HTML, CSS y JavaScript puros: sin frameworks, librerías, npm, bundler ni build.
- `index.html` (estructura), `styles.css` (estilos), `app.js` (interfaz y datos),
  `heatmap-logic.js` (lógica pura del mapa de actividad), `tests/` (pruebas).
- Debe funcionar abriendo `index.html` con doble clic (`file://`): nada de módulos ES
  (`type="module"`), `fetch` a archivos locales ni nada que requiera servidor.

## Comandos
- Tests: `node --test`

## Datos
- localStorage: `diario-de-estudio-sesiones` (array de `{ date: "AAAA-MM-DD", topic, minutes }`)
  y `diario-de-estudio-tema`.
- Si cambias la forma de los datos, mantén compatibilidad con lo ya guardado.

## Fechas y racha (fácil equivocarse)
- Siempre fecha local: nunca `toISOString()` ni `new Date("AAAA-MM-DD")`. Sigue la skill `local-dates`.
- Racha = días consecutivos con al menos 1 sesión que terminan hoy; si hoy no hay sesión pero
  ayer sí, sigue viva. Varias sesiones el mismo día cuentan como uno. Las fechas futuras no suman.

## Forma de trabajar
- Lee `docs/constitution.md` y la spec activa (`specs/NNN-*/`) antes de tocar código.
- Haz solo lo que se pide, con cambios pequeños; no reescribas lo que ya funciona.
- Al terminar, resume qué cambiaste y qué decisiones debo revisar.

## Memoria
- Al empezar, lee `MEMORY.md`. Al terminar una tarea, actualízalo: estado, decisiones (con su
  porqué) y errores a evitar. Máximo ~50 líneas.
- Si algo se vuelve una regla permanente, propón moverlo aquí. Nunca guardes datos sensibles.

## Límites
- ✅ Siempre: respetar fechas y racha, textos en español, actualizar `MEMORY.md` al terminar cada tarea.
- ⚠️ Pregunta antes: crear archivos nuevos, cambiar el formato de los datos guardados.
- 🚫 Nunca: añadir dependencias, frameworks o un paso de build.

## Verificación
- Lógica: `node --test` en verde antes de dar algo por terminado.
- Interfaz: con el MCP de Chrome DevTools abre `index.html`, prueba la funcionalidad, revisa la
  consola y la vista móvil (375 px).
- No borres sesiones reales al probar: usa un contexto aislado de Chrome.
