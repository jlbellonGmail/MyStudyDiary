const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const heatmap = require('../heatmap-logic.js');

function makeSession(date, minutes) {
  return { date, topic: 'Prueba', minutes, createdAt: 0 };
}

test('formatea y analiza fechas de calendario locales', () => {
  const localDate = new Date(2026, 8, 30, 12);
  assert.equal(heatmap.getLocalDateString(localDate), '2026-09-30');

  const parsed = heatmap.parseLocalDate('2024-02-29');
  assert.ok(parsed instanceof Date);
  assert.equal(heatmap.getLocalDateString(parsed), '2024-02-29');
  assert.equal(heatmap.parseLocalDate('2023-02-29'), null);
  assert.equal(heatmap.parseLocalDate('2026-13-01'), null);
  assert.equal(heatmap.parseLocalDate('2026-2-01'), null);
});

test('genera 84 fechas únicas de lunes a domingo para cualquier día de hoy', () => {
  const weekdays = [
    '2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01',
    '2026-10-02', '2026-10-03', '2026-10-04'
  ];

  weekdays.forEach((today) => {
    const dates = heatmap.getHeatmapDates(today);
    assert.equal(dates.length, 84);
    assert.equal(new Set(dates).size, 84);
    assert.equal(dates[0], '2026-07-13');
    assert.equal(dates[83], '2026-10-04');
    assert.equal(heatmap.getLocalDateString(heatmap.parseLocalDate(dates[0])), '2026-07-13');
    assert.equal(heatmap.getLocalDateString(heatmap.parseLocalDate(dates[6])), '2026-07-19');
  });
});

test('rechaza una fecha actual inválida para generar el mapa', () => {
  assert.deepEqual(heatmap.getHeatmapDates('2026-02-30'), []);
});

test('clasifica los niveles usando los límites inclusivos aprobados', () => {
  const cases = [
    [0, 0], [1, 1], [30, 1], [30.1, 2], [60, 2],
    [60.1, 3], [90, 3], [90.1, 4]
  ];
  cases.forEach(([minutes, expected]) => {
    assert.equal(heatmap.getIntensityLevel(minutes), expected);
  });
  assert.equal(heatmap.getIntensityLevel(-1), null);
  assert.equal(heatmap.getIntensityLevel(Infinity), null);
});

test('agrega sesiones normalizadas, ignora fuera de rango y no muta los datos', () => {
  const sessions = [
    makeSession('2026-07-13', 10),
    makeSession('2026-09-29', 0.1),
    makeSession('2026-09-29', 0.2),
    makeSession('2026-10-01', 50),
    makeSession('2026-07-12', 90),
    makeSession('2026-10-05', 90)
  ];
  const original = structuredClone(sessions);
  const result = heatmap.buildHeatmap(sessions, '2026-09-30');
  const byDate = new Map(result.map((day) => [day.date, day]));

  assert.equal(result.length, 84);
  assert.deepEqual(sessions, original);
  assert.deepEqual(byDate.get('2026-07-13'), {
    date: '2026-07-13', minutes: 10, level: 1, isFuture: false
  });
  assert.equal(byDate.get('2026-09-29').minutes, 0.1 + 0.2);
  assert.equal(byDate.get('2026-09-29').level, 1);
  assert.deepEqual(byDate.get('2026-09-30'), {
    date: '2026-09-30', minutes: 0, level: 0, isFuture: false
  });
  assert.deepEqual(byDate.get('2026-10-01'), {
    date: '2026-10-01', minutes: 0, level: null, isFuture: true
  });
});

test('produce semanas correctas atravesando límites de mes y año', () => {
  const dates = heatmap.getHeatmapDates('2027-01-01');
  assert.equal(dates.length, 84);
  assert.equal(dates[0], '2026-10-12');
  assert.equal(dates[83], '2027-01-03');
});

test('avanza días de calendario correctamente bajo una zona con cambio horario', () => {
  const script = `
    const assert = require('node:assert/strict');
    const heatmap = require('./heatmap-logic.js');
    const before = new Date(2026, 2, 28, 12).getTimezoneOffset();
    const after = new Date(2026, 2, 30, 12).getTimezoneOffset();
    const dates = heatmap.getHeatmapDates('2026-03-29');
    assert.notEqual(before, after);
    assert.equal(dates.length, 84);
    assert.equal(new Set(dates).size, 84);
    assert.equal(dates[0], '2026-01-05');
    assert.equal(dates.at(-1), '2026-03-29');
    assert.ok(dates.includes('2026-03-28'));
    assert.ok(dates.includes('2026-03-29'));
    assert.ok(!dates.includes('2026-03-30'));

    const expected = new Date(2026, 0, 5, 12);
    dates.forEach((date) => {
      assert.equal(heatmap.getLocalDateString(expected), date);
      expected.setDate(expected.getDate() + 1);
    });
  `;
  const result = spawnSync(process.execPath, ['-e', script], {
    cwd: process.cwd(),
    env: { ...process.env, TZ: 'Europe/Madrid' },
    encoding: 'utf8'
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
});
