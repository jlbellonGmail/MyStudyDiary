(function (root, createApi) {
  const api = createApi();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.StudyObjective = api;
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  function getLocalDateString(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function parseLocalDate(dateString) {
    if (typeof dateString !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return null;
    }

    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(0);
    date.setHours(0, 0, 0, 0);
    date.setFullYear(year, month - 1, day);

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }

    return date;
  }

  function toLocalDate(value) {
    if (value instanceof Date) {
      if (Number.isNaN(value.getTime())) return null;
      const date = new Date(value.getTime());
      date.setHours(0, 0, 0, 0);
      return date;
    }
    return parseLocalDate(value);
  }

  function getWeekStart(value) {
    const date = toLocalDate(value);
    if (!date) return null;

    const daysSinceMonday = (date.getDay() + 6) % 7;
    date.setDate(date.getDate() - daysSinceMonday);
    return date;
  }

  function getWeekKey(value) {
    const start = getWeekStart(value);
    return start ? getLocalDateString(start) : null;
  }

  function getWeekEnd(value) {
    const start = getWeekStart(value);
    if (!start) return null;

    start.setDate(start.getDate() + 6);
    return start;
  }

  function getElapsedDays(weekStart, today) {
    const start = getWeekStart(weekStart);
    const end = toLocalDate(today);
    if (!start || !end) return null;

    let days = 1;
    const cursor = new Date(start.getTime());
    while (getLocalDateString(cursor) !== getLocalDateString(end) && days < 8) {
      cursor.setDate(cursor.getDate() + 1);
      days += 1;
    }

    return getLocalDateString(cursor) === getLocalDateString(end) ? days : null;
  }

  function compareWeekToToday(weekStart, today) {
    const requestedWeek = getWeekKey(weekStart);
    const currentWeek = getWeekKey(today);
    if (!requestedWeek || !currentWeek) return null;
    if (requestedWeek < currentWeek) return 'past';
    if (requestedWeek > currentWeek) return 'future';
    return 'current';
  }

  const NO_GOAL = 'sin objetivo';

  function validateGoalHours(value) {
    if (value === null || value === undefined) {
      return { valid: false, value: null, error: 'El objetivo debe ser un entero positivo.' };
    }

    if (typeof value === 'string' && !/^\s*\d+\s*$/.test(value)) {
      return { valid: false, value: null, error: 'El objetivo debe ser un entero positivo.' };
    }

    const hours = typeof value === 'string' ? Number(value.trim()) : value;
    if (!Number.isSafeInteger(hours) || hours <= 0) {
      return { valid: false, value: null, error: 'El objetivo debe ser un entero positivo.' };
    }

    return { valid: true, value: hours, error: '' };
  }

  function cloneConfig(config) {
    const source = config && typeof config === 'object' && !Array.isArray(config) ? config : {};
    return {
      ...source,
      baseRevisions: Array.isArray(source.baseRevisions)
        ? source.baseRevisions.map((revision) => ({ ...revision }))
        : [],
      exceptions: { ...(source.exceptions || {}) },
      historical: { ...(source.historical || {}) }
    };
  }

  function getWeekKeyOrThrow(value, label) {
    const key = getWeekKey(value);
    if (!key) throw new Error(`${label} no es una semana válida.`);
    return key;
  }

  function isNoGoal(value) {
    return value === NO_GOAL || value === 'no-goal' || value === 'sin-objetivo';
  }

  function getApplicableGoal(config, weekStart, today) {
    const weekKey = getWeekKey(weekStart);
    const todayKey = getWeekKey(today);
    if (!weekKey || !todayKey) return null;
    const source = config && typeof config === 'object' ? config : {};
    const historical = source.historical && source.historical[weekKey];
    if (historical !== undefined) return isNoGoal(historical) ? NO_GOAL : historical;

    const exception = source.exceptions && source.exceptions[weekKey];
    if (exception !== undefined) return isNoGoal(exception) ? NO_GOAL : exception;

    const revisions = Array.isArray(source.baseRevisions) ? source.baseRevisions : [];
    let applicable = null;
    for (const revision of revisions) {
      const revisionKey = revision && getWeekKey(revision.weekStart);
      const validation = validateGoalHours(revision && revision.hours);
      if (revisionKey && revisionKey <= weekKey && validation.valid) {
        if (!applicable || revisionKey >= applicable.weekStart) {
          applicable = { weekStart: revisionKey, hours: validation.value };
        }
      }
    }
    return applicable ? applicable.hours : null;
  }

  function setBaseGoal(config, hours, today) {
    const validation = validateGoalHours(hours);
    if (!validation.valid) throw new Error(validation.error);
    const weekStart = getWeekKeyOrThrow(today, 'La fecha actual');
    const next = cloneConfig(config);
    next.baseRevisions.push({ weekStart, hours: validation.value });
    return next;
  }

  function setWeekException(config, weekStart, exception, today) {
    const key = getWeekKeyOrThrow(weekStart, 'La semana');
    const currentKey = getWeekKeyOrThrow(today, 'La fecha actual');
    if (key < currentKey) throw new Error('No se puede editar una semana pasada.');
    if (!isNoGoal(exception) && !validateGoalHours(exception).valid) {
      throw new Error('La excepción debe ser un entero positivo o sin objetivo.');
    }
    const next = cloneConfig(config);
    next.exceptions[key] = isNoGoal(exception) ? NO_GOAL : validateGoalHours(exception).value;
    return next;
  }

  function removeWeekException(config, weekStart, today) {
    const key = getWeekKeyOrThrow(weekStart, 'La semana');
    const currentKey = getWeekKeyOrThrow(today, 'La fecha actual');
    if (key < currentKey) throw new Error('No se puede editar una semana pasada.');
    const next = cloneConfig(config);
    delete next.exceptions[key];
    return next;
  }

  function freezeHistoricalWeeks(config, today) {
    const currentKey = getWeekKeyOrThrow(today, 'La fecha actual');
    const source = cloneConfig(config);
    const next = cloneConfig(config);
    const knownWeeks = [];

    for (const revision of source.baseRevisions) {
      const key = revision && getWeekKey(revision.weekStart);
      if (key && key < currentKey) knownWeeks.push(key);
    }
    for (const key of Object.keys(source.exceptions)) {
      if (getWeekKey(key) === key && key < currentKey) knownWeeks.push(key);
    }
    for (const key of Object.keys(source.historical)) {
      if (getWeekKey(key) === key && key < currentKey) knownWeeks.push(key);
    }

    if (knownWeeks.length === 0) return next;

    const firstKey = knownWeeks.sort()[0];
    const cursor = parseLocalDate(firstKey);
    while (cursor && getLocalDateString(cursor) < currentKey) {
      const weekKey = getLocalDateString(cursor);
      if (next.historical[weekKey] === undefined) {
        const effectiveGoal = getApplicableGoal(source, weekKey, today);
        if (effectiveGoal !== null) next.historical[weekKey] = effectiveGoal;
      }
      cursor.setDate(cursor.getDate() + 7);
    }

    return next;
  }

  function calculateWeekProgress(sessions, goal, weekStart, today) {
    const start = getWeekStart(weekStart);
    const todayDate = toLocalDate(today);
    const validatedGoal = validateGoalHours(goal);
    if (!start || !todayDate || !validatedGoal.valid) return null;

    const startKey = getLocalDateString(start);
    const end = getWeekEnd(start);
    const endKey = getLocalDateString(end);
    const todayKey = getLocalDateString(todayDate);
    const weekKind = compareWeekToToday(start, todayDate);
    if (weekKind === 'future') return null;

    const cutoffKey = weekKind === 'past' ? endKey : todayKey;
    const sourceSessions = Array.isArray(sessions) ? sessions : [];
    const minutesStudied = sourceSessions.reduce((total, session) => {
      if (!session || typeof session !== 'object') return total;
      const date = parseLocalDate(session.date);
      const minutes = Number(session.minutes);
      if (!date || !Number.isFinite(minutes) || minutes <= 0) return total;

      const dateKey = getLocalDateString(date);
      if (dateKey < startKey || dateKey > cutoffKey) return total;
      return total + minutes;
    }, 0);

    const elapsedDays = weekKind === 'past' ? 7 : getElapsedDays(start, todayDate);
    const expectedMinutes = validatedGoal.value * 60 * elapsedDays / 7;
    const realPercent = minutesStudied / (validatedGoal.value * 60) * 100;
    let state = '🟠 Vas por detrás';
    if (minutesStudied >= validatedGoal.value * 60) {
      state = '✅ Objetivo cumplido';
    } else if (minutesStudied >= expectedMinutes) {
      state = '🟢 Vas al día';
    }

    return {
      minutesStudied,
      expectedMinutes,
      realPercent,
      goalHours: validatedGoal.value,
      state
    };
  }

  function roundDuration(minutes) {
    const roundedMinutes = Number.isFinite(minutes) && minutes > 0
      ? Math.floor(minutes + 0.5)
      : 0;
    return {
      hours: Math.floor(roundedMinutes / 60),
      minutes: roundedMinutes % 60
    };
  }

  function getVisualProgress(realPercent) {
    if (!Number.isFinite(realPercent)) return 0;
    return Math.min(100, Math.max(0, realPercent));
  }

  function getArcFraction(visualPercent) {
    return getVisualProgress(visualPercent) / 100;
  }

  function formatGoalProgress(progress) {
    const safeProgress = progress && typeof progress === 'object' ? progress : {};
    const duration = roundDuration(safeProgress.minutesStudied);
    const visualPercent = getVisualProgress(safeProgress.realPercent);
    const percentage = Math.floor(visualPercent + 0.5);
    const arcFraction = getArcFraction(visualPercent);
    const durationText = `${duration.hours} h ${duration.minutes} min`;
    const goalText = Number.isFinite(safeProgress.goalHours)
      ? `${safeProgress.goalHours} h`
      : '';

    return {
      duration,
      durationText,
      goalText,
      percentage,
      percentageText: `${percentage} %`,
      visualPercent,
      arcFraction
    };
  }

  return {
    getLocalDateString,
    parseLocalDate,
    getWeekStart,
    getWeekKey,
    getWeekEnd,
    getElapsedDays,
    compareWeekToToday,
    NO_GOAL,
    validateGoalHours,
    getApplicableGoal,
    setBaseGoal,
    setWeekException,
    removeWeekException,
    freezeHistoricalWeeks,
    calculateWeekProgress,
    roundDuration,
    getVisualProgress,
    getArcFraction,
    formatGoalProgress
  };
});
