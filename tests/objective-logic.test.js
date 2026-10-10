const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const ObjectiveLogic = require('../objective-logic.js');

test('las fechas locales se validan estrictamente y no se interpretan como UTC', () => {
  const date = ObjectiveLogic.parseLocalDate('2026-10-05');

  assert.ok(date instanceof Date);
  assert.equal(date.getFullYear(), 2026);
  assert.equal(date.getMonth(), 9);
  assert.equal(date.getDate(), 5);
  assert.equal(ObjectiveLogic.getLocalDateString(date), '2026-10-05');
  assert.equal(ObjectiveLogic.parseLocalDate('2026-02-30'), null);
  assert.equal(ObjectiveLogic.parseLocalDate('2026-1-05'), null);
  assert.equal(ObjectiveLogic.parseLocalDate('no es una fecha'), null);
});

test('una semana local empieza el lunes y termina el domingo', () => {
  const monday = ObjectiveLogic.getWeekStart('2026-10-05');
  const sunday = ObjectiveLogic.getWeekEnd(monday);

  assert.equal(ObjectiveLogic.getLocalDateString(monday), '2026-10-05');
  assert.equal(ObjectiveLogic.getLocalDateString(sunday), '2026-10-11');
  assert.equal(ObjectiveLogic.getWeekKey('2026-10-11'), '2026-10-05');
});

test('los días transcurridos cuentan de 1/7 el lunes a 7/7 el domingo', () => {
  const weekStart = ObjectiveLogic.getWeekStart('2026-10-05');

  assert.equal(ObjectiveLogic.getElapsedDays(weekStart, '2026-10-05'), 1);
  assert.equal(ObjectiveLogic.getElapsedDays(weekStart, '2026-10-07'), 3);
  assert.equal(ObjectiveLogic.getElapsedDays(weekStart, '2026-10-11'), 7);
});

test('el calendario avanza correctamente entre medianoche, meses y años', () => {
  assert.equal(ObjectiveLogic.getWeekKey('2026-01-01'), '2025-12-29');
  assert.equal(ObjectiveLogic.getWeekKey('2026-01-04'), '2025-12-29');
  assert.equal(ObjectiveLogic.getWeekKey('2026-01-05'), '2026-01-05');
  assert.equal(ObjectiveLogic.getLocalDateString(
    ObjectiveLogic.getWeekEnd(ObjectiveLogic.getWeekStart('2026-12-31'))
  ), '2027-01-03');
});

test('las semanas se clasifican respecto a hoy sin leer el reloj del sistema', () => {
  const today = '2026-10-07';

  assert.equal(ObjectiveLogic.compareWeekToToday('2026-09-28', today), 'past');
  assert.equal(ObjectiveLogic.compareWeekToToday('2026-10-05', today), 'current');
  assert.equal(ObjectiveLogic.compareWeekToToday('2026-10-12', today), 'future');
});

test('mantiene lunes-domingo al cruzar un cambio de hora local', () => {
  const logicPath = path.join(__dirname, '..', 'objective-logic.js');
  const script = `
    const logic = require(${JSON.stringify(logicPath)});
    const start = logic.getWeekStart('2026-03-08');
    console.log(JSON.stringify({
      start: logic.getLocalDateString(start),
      end: logic.getLocalDateString(logic.getWeekEnd(start)),
      elapsed: logic.getElapsedDays(start, '2026-03-08')
    }));
  `;
  const output = execFileSync(process.execPath, ['-e', script], {
    env: { ...process.env, TZ: 'America/New_York' },
    encoding: 'utf8'
  });

  assert.deepEqual(JSON.parse(output), {
    start: '2026-03-02',
    end: '2026-03-08',
    elapsed: 7
  });
});

test('valida objetivos como horas enteras positivas', () => {
  assert.deepEqual(ObjectiveLogic.validateGoalHours(8), { valid: true, value: 8, error: '' });
  assert.equal(ObjectiveLogic.validateGoalHours('8').valid, true);
  for (const value of [0, -1, 2.5, '', '   ', 'no', Infinity, NaN]) {
    assert.equal(ObjectiveLogic.validateGoalHours(value).valid, false);
  }
});

test('resuelve objetivo base, excepción positiva y excepción sin objetivo', () => {
  const today = '2026-10-07';
  const config = {
    baseRevisions: [{ weekStart: '2026-10-05', hours: 8 }],
    exceptions: {
      '2026-10-12': 10,
      '2026-10-19': ObjectiveLogic.NO_GOAL
    }
  };

  assert.equal(ObjectiveLogic.getApplicableGoal(config, '2026-10-05', today), 8);
  assert.equal(ObjectiveLogic.getApplicableGoal(config, '2026-10-12', today), 10);
  assert.equal(ObjectiveLogic.getApplicableGoal(config, '2026-10-19', today), ObjectiveLogic.NO_GOAL);
  assert.equal(ObjectiveLogic.getApplicableGoal({}, '2026-10-05', today), null);
});

test('cambiar la base y las excepciones no muta la configuración original', () => {
  const today = '2026-10-07';
  const original = {
    baseRevisions: [{ weekStart: '2026-09-28', hours: 6 }],
    exceptions: { '2026-10-12': 10 }
  };
  const withBase = ObjectiveLogic.setBaseGoal(original, 8, today);
  const withException = ObjectiveLogic.setWeekException(withBase, '2026-10-19', ObjectiveLogic.NO_GOAL, today);
  const removed = ObjectiveLogic.removeWeekException(withException, '2026-10-12', today);

  assert.equal(ObjectiveLogic.getApplicableGoal(withBase, '2026-10-05', today), 8);
  assert.equal(ObjectiveLogic.getApplicableGoal(withException, '2026-10-19', today), ObjectiveLogic.NO_GOAL);
  assert.equal(ObjectiveLogic.getApplicableGoal(removed, '2026-10-12', today), 8);
  assert.deepEqual(original, {
    baseRevisions: [{ weekStart: '2026-09-28', hours: 6 }],
    exceptions: { '2026-10-12': 10 }
  });
});

test('rechaza valores inválidos y editar semanas históricas', () => {
  const config = { baseRevisions: [], exceptions: {} };
  assert.throws(() => ObjectiveLogic.setBaseGoal(config, 0, '2026-10-07'), /entero positivo/);
  assert.throws(() => ObjectiveLogic.setWeekException(config, '2026-09-28', 8, '2026-10-07'), /pasada/);
  assert.throws(() => ObjectiveLogic.setWeekException(config, '2026-10-12', 1.5, '2026-10-07'), /entero positivo/);
  assert.throws(() => ObjectiveLogic.removeWeekException(config, '2026-09-28', '2026-10-07'), /pasada/);
});

test('congela el objetivo efectivo de las semanas pasadas sin mutar la configuración', () => {
  const today = '2026-10-19';
  const config = {
    baseRevisions: [{ weekStart: '2026-09-28', hours: 6 }],
    exceptions: {
      '2026-10-05': 10,
      '2026-10-12': ObjectiveLogic.NO_GOAL
    }
  };

  const frozen = ObjectiveLogic.freezeHistoricalWeeks(config, today);

  assert.equal(frozen.historical['2026-10-05'], 10);
  assert.equal(frozen.historical['2026-10-12'], ObjectiveLogic.NO_GOAL);
  assert.equal(ObjectiveLogic.getApplicableGoal(frozen, '2026-10-05', today), 10);
  assert.equal(ObjectiveLogic.getApplicableGoal(frozen, '2026-10-12', today), ObjectiveLogic.NO_GOAL);
  assert.equal(config.historical, undefined);
});

test('un cambio posterior de base no reescribe un histórico ya congelado', () => {
  const today = '2026-10-19';
  const initial = ObjectiveLogic.freezeHistoricalWeeks({
    baseRevisions: [{ weekStart: '2026-10-05', hours: 6 }],
    exceptions: {}
  }, today);
  const changed = ObjectiveLogic.setBaseGoal(initial, 12, today);

  assert.equal(ObjectiveLogic.getApplicableGoal(changed, '2026-10-12', today), 6);
  assert.equal(ObjectiveLogic.getApplicableGoal(changed, '2026-10-19', today), 12);
  assert.equal(changed.historical['2026-10-12'], 6);
});

test('el congelado conserva el aviso lógico de una excepción histórica sin objetivo', () => {
  const today = '2026-10-19';
  const frozen = ObjectiveLogic.freezeHistoricalWeeks({
    baseRevisions: [{ weekStart: '2026-10-05', hours: 6 }],
    exceptions: { '2026-10-12': ObjectiveLogic.NO_GOAL }
  }, today);

  assert.equal(ObjectiveLogic.getApplicableGoal(frozen, '2026-10-12', today), ObjectiveLogic.NO_GOAL);
  assert.equal(ObjectiveLogic.compareWeekToToday('2026-10-12', today), 'past');
});

test('calcula el progreso actual con minutos exactos y descarta entradas inválidas o futuras', () => {
  const sessions = [
    { date: '2026-10-05', minutes: 30.25 },
    { date: '2026-10-07', minutes: 60.25 },
    { date: '2026-10-07', minutes: 9.5 },
    { date: '2026-10-08', minutes: 120 },
    { date: '2026-10-07', minutes: 0 },
    { date: '2026-10-07', minutes: -5 },
    { date: '2026-10-07', minutes: Infinity },
    { date: '2026-02-30', minutes: 20 },
    { date: 'no-es-fecha', minutes: 20 }
  ];

  const progress = ObjectiveLogic.calculateWeekProgress(sessions, 2, '2026-10-05', '2026-10-07');

  assert.equal(progress.minutesStudied, 100);
  assert.equal(progress.expectedMinutes, 360 / 7);
  assert.equal(progress.realPercent, 100 / 120 * 100);
  assert.equal(progress.state, '🟢 Vas al día');
  assert.deepEqual(sessions[0], { date: '2026-10-05', minutes: 30.25 });
});

test('calcula 1/7, 3/7 y 7/7 días esperados según el día local', () => {
  const sessions = [];
  const weekStart = '2026-10-05';

  assert.equal(ObjectiveLogic.calculateWeekProgress(sessions, 7, weekStart, '2026-10-05').expectedMinutes, 60);
  assert.equal(ObjectiveLogic.calculateWeekProgress(sessions, 7, weekStart, '2026-10-07').expectedMinutes, 180);
  assert.equal(ObjectiveLogic.calculateWeekProgress(sessions, 7, weekStart, '2026-10-11').expectedMinutes, 420);
});

test('una semana histórica usa el domingo como corte y mantiene la precedencia de cumplido', () => {
  const progress = ObjectiveLogic.calculateWeekProgress([
    { date: '2026-10-11', minutes: 60 },
    { date: '2026-10-12', minutes: 999 }
  ], 1, '2026-10-05', '2026-10-19');

  assert.equal(progress.minutesStudied, 60);
  assert.equal(progress.expectedMinutes, 60);
  assert.equal(progress.state, '✅ Objetivo cumplido');
});

test('clasifica por comparaciones exactas sin redondear minutos ni porcentaje', () => {
  const sessions = [{ date: '2026-10-05', minutes: 17.1 }];
  const progress = ObjectiveLogic.calculateWeekProgress(sessions, 2, '2026-10-05', '2026-10-05');

  assert.equal(progress.minutesStudied, 17.1);
  assert.equal(progress.expectedMinutes, 120 / 7);
  assert.equal(progress.state, '🟠 Vas por detrás');
  assert.equal(progress.realPercent, 17.1 / 120 * 100);
});

test('formatea duraciones redondeando solo los minutos de presentación', () => {
  assert.deepEqual(ObjectiveLogic.roundDuration(90.5), { hours: 1, minutes: 31 });
  assert.deepEqual(ObjectiveLogic.roundDuration(120), { hours: 2, minutes: 0 });
  assert.deepEqual(ObjectiveLogic.roundDuration(150.6), { hours: 2, minutes: 31 });
});

test('limita el porcentaje visual y calcula el arco proporcional', () => {
  assert.equal(ObjectiveLogic.getVisualProgress(0), 0);
  assert.equal(ObjectiveLogic.getVisualProgress(42.5), 42.5);
  assert.equal(ObjectiveLogic.getVisualProgress(140), 100);
  assert.equal(ObjectiveLogic.getArcFraction(0), 0);
  assert.equal(ObjectiveLogic.getArcFraction(42.5), 0.425);
  assert.equal(ObjectiveLogic.getArcFraction(100), 1);
});

test('limita el porcentaje mostrado a 100 y conserva el exceso de horas', () => {
  const progress = ObjectiveLogic.calculateWeekProgress([
    { date: '2026-10-05', minutes: 90.5 }
  ], 1, '2026-10-05', '2026-10-05');
  const formatted = ObjectiveLogic.formatGoalProgress(progress);

  assert.equal(formatted.durationText, '1 h 31 min');
  assert.equal(formatted.percentage, 100);
  assert.equal(formatted.percentageText, '100 %');
  assert.equal(formatted.visualPercent, 100);
  assert.equal(formatted.arcFraction, 1);
});
