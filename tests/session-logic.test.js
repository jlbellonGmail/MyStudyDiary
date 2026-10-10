const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');

const sessions = require('../session-logic.js');

const TODAY = '2026-10-05';

function values(overrides = {}) {
  return {
    date: '2026-10-04',
    topic: 'Matemáticas',
    minutes: 45,
    ...overrides
  };
}

test('identifica fechas futuras usando hoy explícito', () => {
  assert.equal(sessions.isFutureDate('2026-10-06', TODAY), true);
  assert.equal(sessions.isFutureDate(TODAY, TODAY), false);
  assert.equal(sessions.isFutureDate('2026-10-04', TODAY), false);
  assert.equal(sessions.isFutureDate('2026-02-30', TODAY), false);
});

test('acepta una sesión con fecha anterior, tema y minutos enteros positivos', () => {
  assert.deepEqual(sessions.validateSessionValues(values(), TODAY), {
    valid: true,
    errors: {}
  });
});

test('acepta la fecha de hoy y rechaza una fecha futura', () => {
  assert.equal(sessions.validateSessionValues(values({ date: TODAY }), TODAY).valid, true);
  const result = sessions.validateSessionValues(values({ date: '2026-10-06' }), TODAY);
  assert.equal(result.valid, false);
  assert.equal(result.errors.date, 'La fecha no puede ser posterior a hoy.');
});

test('rechaza fechas inexistentes y formatos inválidos', () => {
  ['2026-02-30', '2026-2-05', 'no-es-fecha'].forEach((date) => {
    const result = sessions.validateSessionValues(values({ date }), TODAY);
    assert.equal(result.valid, false);
    assert.equal(result.errors.date, 'Escribe una fecha válida.');
  });
});

test('rechaza tema vacío, espacios y temas demasiado largos', () => {
  assert.equal(sessions.validateSessionValues(values({ topic: '' }), TODAY).errors.topic, 'Escribe un tema.');
  assert.equal(sessions.validateSessionValues(values({ topic: '   ' }), TODAY).errors.topic, 'Escribe un tema.');
  assert.equal(
    sessions.validateSessionValues(values({ topic: 'a'.repeat(121) }), TODAY).errors.topic,
    'El tema no puede superar 120 caracteres.'
  );
});

test('rechaza minutos cero, negativos, decimales y valores no finitos', () => {
  [0, -1, 1.5, NaN, Infinity].forEach((minutes) => {
    const result = sessions.validateSessionValues(values({ minutes }), TODAY);
    assert.equal(result.valid, false);
    assert.equal(result.errors.minutes, 'Escribe un número entero mayor que 0.');
  });
});

test('devuelve todos los errores de una entrada inválida', () => {
  const result = sessions.validateSessionValues({ date: '2026-10-06', topic: ' ', minutes: 0 }, TODAY);
  assert.deepEqual(result, {
    valid: false,
    errors: {
      date: 'La fecha no puede ser posterior a hoy.',
      topic: 'Escribe un tema.',
      minutes: 'Escribe un número entero mayor que 0.'
    }
  });
});

function makeSession(date, topic, minutes, createdAt) {
  return { date, topic, minutes, createdAt };
}

test('actualiza solo la sesión elegida y conserva createdAt', () => {
  const original = [
    makeSession('2026-10-04', 'Matemáticas', 45, 1),
    makeSession('2026-10-04', 'Historia', 30, 1),
    makeSession('2026-10-03', 'Física', 25, 2)
  ];
  const snapshot = structuredClone(original);
  const updated = sessions.updateSession(original, 1, {
    date: '2026-10-02',
    topic: 'Literatura',
    minutes: 60
  });

  assert.deepEqual(updated, [
    original[0],
    { date: '2026-10-02', topic: 'Literatura', minutes: 60, createdAt: 1 },
    original[2]
  ]);
  assert.deepEqual(original, snapshot);
});

test('elimina solo el índice elegido, incluso con fechas repetidas', () => {
  const original = [
    makeSession('2026-10-04', 'Matemáticas', 45, 1),
    makeSession('2026-10-04', 'Historia', 30, 1),
    makeSession('2026-10-03', 'Física', 25, 2)
  ];
  const snapshot = structuredClone(original);

  assert.deepEqual(sessions.deleteSession(original, 1), [original[0], original[2]]);
  assert.deepEqual(original, snapshot);
});

test('un índice inexistente no borra ni actualiza otra sesión', () => {
  const original = [makeSession('2026-10-04', 'Matemáticas', 45, 1)];

  assert.deepEqual(sessions.updateSession(original, 3, values()), original);
  assert.deepEqual(sessions.deleteSession(original, -1), original);
});

test('la página carga la lógica de sesiones antes de la interfaz y ofrece cancelar edición', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.ok(html.indexOf('src="session-logic.js"') >= 0);
  assert.ok(html.indexOf('src="session-logic.js"') < html.indexOf('src="app.js"'));
  assert.match(html, /id="cancel-edit"[^>]*hidden/);
});

test('la interfaz genera acciones individuales y conecta editar y cancelar', () => {
  const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  assert.match(app, /className = 'session-actions'/);
  assert.match(app, /edit-session/);
  assert.match(app, /delete-session/);
  assert.match(app, /sessionList\.addEventListener\('click'/);
  assert.match(app, /cancelEditButton\.addEventListener\('click'/);
});

test('la edición valida con la lógica pura y persiste un nuevo array', () => {
  const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  assert.match(app, /editingSessionIndex !== null/);
  assert.match(app, /StudySessions\.validateSessionValues/);
  assert.match(app, /StudySessions\.updateSession/);
  assert.match(app, /saveSessions\(nextSessions\)/);
  assert.match(app, /La sesión se actualizó/);
});

test('la eliminación solicita confirmación y usa la transformación pura', () => {
  const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  assert.match(app, /Eliminar la sesión/);
  assert.match(app, /StudySessions\.deleteSession/);
  assert.match(app, /La sesión se eliminó/);
});

test('los estilos contemplan acciones, errores y lista móvil', () => {
  const styles = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');
  assert.match(styles, /\.session-actions/);
  assert.match(styles, /\.session-action/);
  assert.match(styles, /\.form-message\.is-error/);
  assert.match(styles, /@media \(max-width: 390px\)/);
});
