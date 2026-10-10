const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('index.html', 'utf8');
const css = fs.readFileSync('styles.css', 'utf8');

test('el panel de objetivo contiene controles y contenido accesible', () => {
  assert.match(html, /<section[^>]+class="objective-section"[^>]+aria-labelledby="objective-title"/);
  assert.match(html, /id="objective-title"[^>]*>Objetivo semanal</);
  assert.match(html, /id="base-goal-form"/);
  assert.match(html, /id="base-goal-hours"/);
  assert.match(html, /for="base-goal-hours"[^>]*>Objetivo base/);
  assert.match(html, /id="week-exception-form"/);
  assert.match(html, /id="objective-week"/);
  assert.match(html, /id="exception-goal-hours"/);
  assert.match(html, /id="exception-no-goal"/);
  assert.match(html, /id="objective-studied"/);
  assert.match(html, /id="objective-percentage"/);
  assert.match(html, /id="objective-status"/);
  assert.match(html, /id="objective-no-goal"/);
});

test('el círculo tiene un equivalente textual y admite una representación proporcional', () => {
  assert.match(html, /<svg[^>]+class="objective-circle"[^>]+role="img"/);
  assert.match(html, /id="objective-circle-label"/);
  assert.match(html, /aria-labelledby="objective-circle-label"/);
  assert.match(html, /id="objective-circle-progress"/);
  assert.match(css, /\.objective-circle/);
  assert.match(css, /stroke-dasharray/);
});

test('el panel de objetivo incluye adaptación móvil', () => {
  assert.match(css, /@media \(max-width: 700px\)[\s\S]*\.objective-panel/);
});

test('el selector de semanas permite consultar histórico y la integración persiste objetivos', () => {
  assert.match(html, /id="objective-week"/);
  const app = fs.readFileSync('app.js', 'utf8');
  assert.match(app, /diario-de-estudio-objetivos/);
  assert.match(app, /freezeHistoricalWeeks/);
  assert.match(app, /Semana histórica/);
  assert.match(app, /setWeekException/);
  assert.match(app, /removeWeekException/);
});

test('el indicador usa todo el historial y se recalcula con el ciclo de sesiones', () => {
  const app = fs.readFileSync('app.js', 'utf8');
  assert.match(app, /function renderObjective\(allSessions\)/);
  assert.match(app, /calculateWeekProgress\(allSessions, goal/);
  assert.match(app, /renderObjective\(sessions\)/);
});

test('el cambio de medianoche vuelve a renderizar también el objetivo', () => {
  const app = fs.readFileSync('app.js', 'utf8');
  assert.match(app, /function scheduleMidnightUpdate\(\)/);
  assert.match(app, /scheduleMidnightUpdate\(\);/);
  assert.match(app, /setTimeout\(\(\) => \{[\s\S]*render\(sessions\)/);
});

test('el panel conserva un ancho utilizable en viewport móvil estrecho y en ambos temas', () => {
  assert.match(css, /\.objective-panel\s*\{[\s\S]*min-width:\s*0/);
  assert.match(css, /\.objective-result\s*\{[\s\S]*min-width:\s*0/);
  assert.match(css, /:root\[data-theme="dark"\][\s\S]*--soft-surface/);
  assert.match(css, /@media \(max-width: 390px\)[\s\S]*\.objective-indicator/);
});

test('la integración sigue siendo compatible con file:// y respaldos de sesiones', () => {
  assert.doesNotMatch(html, /type="module"/);
  assert.doesNotMatch(html, /fetch\(/);
  const app = fs.readFileSync('app.js', 'utf8');
  assert.match(app, /sessions\s*\}/);
  assert.match(app, /Array\.isArray\(data\.sessions\)/);
  assert.doesNotMatch(app, /sessions:\s*[^,}]+,\s*objective/);
});
