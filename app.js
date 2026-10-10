const STORAGE_KEY = 'diario-de-estudio-sesiones';
const THEME_KEY = 'diario-de-estudio-tema';
const OBJECTIVE_STORAGE_KEY = 'diario-de-estudio-objetivos';
const BACKUP_VERSION = 1;

const form = document.querySelector('#session-form');
const dateInput = document.querySelector('#session-date');
const topicInput = document.querySelector('#session-topic');
const minutesInput = document.querySelector('#session-minutes');
const formEyebrow = document.querySelector('#form-eyebrow');
const formTitle = document.querySelector('#form-title');
const submitButton = form.querySelector('button[type="submit"]');
const cancelEditButton = document.querySelector('#cancel-edit');
const sessionList = document.querySelector('#session-list');
const emptyState = document.querySelector('#empty-state');
const sessionTotal = document.querySelector('#session-total');
const filterSummary = document.querySelector('#filter-summary');
const periodFilter = document.querySelector('#period-filter');
const topicFilter = document.querySelector('#topic-filter');
const fromFilter = document.querySelector('#date-from');
const toFilter = document.querySelector('#date-to');
const filterMessage = document.querySelector('#filter-message');
const resetFiltersButton = document.querySelector('#reset-filters');
const streakCount = document.querySelector('#streak-count');
const streakDays = document.querySelector('#streak-days');
const streakCaption = document.querySelector('#streak-caption');
const bestStreak = document.querySelector('#best-streak');
const bestStreakValue = document.querySelector('#best-streak-value');
const bestStreakCount = document.querySelector('#best-streak-count');
const bestStreakDays = document.querySelector('#best-streak-days');
const bestStreakEmpty = document.querySelector('#best-streak-empty');
const formMessage = document.querySelector('#form-message');
const themeToggle = document.querySelector('#theme-toggle');
const backupInput = document.querySelector('#backup-file');
const backupMessage = document.querySelector('#backup-message');
const heatmapGrid = document.querySelector('#heatmap-grid');
const heatmapDetail = document.querySelector('#heatmap-detail');
const baseGoalForm = document.querySelector('#base-goal-form');
const baseGoalHoursInput = document.querySelector('#base-goal-hours');
const baseGoalMessage = document.querySelector('#base-goal-message');
const objectiveWeekSelect = document.querySelector('#objective-week');
const weekExceptionForm = document.querySelector('#week-exception-form');
const exceptionGoalHoursInput = document.querySelector('#exception-goal-hours');
const exceptionNoGoalInput = document.querySelector('#exception-no-goal');
const exceptionMessage = document.querySelector('#exception-message');
const objectiveNoGoal = document.querySelector('#objective-no-goal');
const objectiveIndicator = document.querySelector('#objective-indicator');
const objectiveStudied = document.querySelector('#objective-studied');
const objectiveGoal = document.querySelector('#objective-goal');
const objectivePercentage = document.querySelector('#objective-percentage');
const objectiveStatus = document.querySelector('#objective-status');
const objectiveCircleLabel = document.querySelector('#objective-circle-label');
const objectiveCircleProgress = document.querySelector('#objective-circle-progress');
let selectedHeatmapDate = null;
let midnightRenderTimer = null;
let editingSessionIndex = null;
let objectiveConfig = readObjectiveConfig();

const statistics = {
  sessions: document.querySelector('#stat-sessions'),
  days: document.querySelector('#stat-days'),
  minutes: document.querySelector('#stat-minutes'),
  averageSession: document.querySelector('#stat-average-session'),
  averageDay: document.querySelector('#stat-average-day'),
  weekMinutes: document.querySelector('#stat-week-minutes'),
  monthDays: document.querySelector('#stat-month-days')
};

function normalizeSession(session) {
  if (!session || typeof session !== 'object' || Array.isArray(session)) {
    return null;
  }

  const date = StudyHeatmap.parseLocalDate(session.date);
  const topic = typeof session.topic === 'string' ? session.topic.trim() : '';
  const minutes = Number(session.minutes);
  const createdAt = session.createdAt === undefined ? 0 : Number(session.createdAt);

  if (
    !date ||
    !topic ||
    topic.length > 120 ||
    !Number.isFinite(minutes) ||
    minutes <= 0 ||
    !Number.isFinite(createdAt)
  ) {
    return null;
  }

  return {
    date: session.date,
    topic,
    minutes,
    createdAt
  };
}

// Recupera datos compatibles con versiones anteriores y omite entradas dañadas.
function readSessions() {
  try {
    const savedSessions = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(savedSessions)
      ? savedSessions.map(normalizeSession).filter(Boolean)
      : [];
  } catch {
    return [];
  }
}

function saveSessions(nextSessions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSessions));
    return true;
  } catch {
    return false;
  }
}

function emptyObjectiveConfig() {
  return { version: 1, baseRevisions: [], exceptions: {}, historical: {} };
}

function isObjectiveConfig(value) {
  return value && typeof value === 'object' && !Array.isArray(value)
    && Array.isArray(value.baseRevisions)
    && value.exceptions && typeof value.exceptions === 'object' && !Array.isArray(value.exceptions)
    && value.historical && typeof value.historical === 'object' && !Array.isArray(value.historical);
}

function readObjectiveConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem(OBJECTIVE_STORAGE_KEY) || 'null');
    return isObjectiveConfig(saved) ? saved : emptyObjectiveConfig();
  } catch {
    return emptyObjectiveConfig();
  }
}

function saveObjectiveConfig(nextConfig) {
  try {
    localStorage.setItem(OBJECTIVE_STORAGE_KEY, JSON.stringify(nextConfig));
    objectiveConfig = nextConfig;
    return true;
  } catch {
    return false;
  }
}

function getObjectiveToday() {
  return StudyObjective.getLocalDateString(new Date());
}

function getCurrentObjectiveWeek() {
  return StudyObjective.getWeekKey(getObjectiveToday());
}

function getSelectedObjectiveWeek() {
  const current = getCurrentObjectiveWeek();
  if (objectiveWeekSelect.value === 'current') return current;
  if (objectiveWeekSelect.value === 'future') {
    const date = StudyObjective.parseLocalDate(current);
    date.setDate(date.getDate() + 7);
    return StudyObjective.getWeekKey(date);
  }
  return StudyObjective.getWeekKey(objectiveWeekSelect.value) || current;
}

function renderObjectiveWeekOptions() {
  const selected = objectiveWeekSelect.value;
  const currentKey = getCurrentObjectiveWeek();
  const historicalKeys = new Set(Object.keys(objectiveConfig.historical || {}));
  Object.keys(objectiveConfig.exceptions || {}).forEach((key) => {
    if (key < currentKey) historicalKeys.add(key);
  });
  const fragment = document.createDocumentFragment();
  const currentOption = document.createElement('option');
  currentOption.value = 'current';
  currentOption.textContent = 'Semana actual';
  fragment.append(currentOption);
  const futureOption = document.createElement('option');
  futureOption.value = 'future';
  futureOption.textContent = 'Semana futura';
  fragment.append(futureOption);
  [...historicalKeys].sort().reverse().forEach((key) => {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = `Semana histórica · ${key}`;
    fragment.append(option);
  });
  objectiveWeekSelect.replaceChildren(fragment);
  objectiveWeekSelect.value = [...objectiveWeekSelect.options].some((option) => option.value === selected)
    ? selected : 'current';
}

function setObjectiveMessage(element, message = '', isError = false) {
  element.textContent = message;
  element.classList.toggle('is-error', isError);
}

function renderObjective(allSessions) {
  const today = getObjectiveToday();
  const frozen = StudyObjective.freezeHistoricalWeeks(objectiveConfig, today);
  if (JSON.stringify(frozen) !== JSON.stringify(objectiveConfig)) {
    saveObjectiveConfig(frozen);
  }
  objectiveConfig = frozen;
  renderObjectiveWeekOptions();

  const weekKey = getSelectedObjectiveWeek();
  const weekKind = StudyObjective.compareWeekToToday(weekKey, today);
  const goal = StudyObjective.getApplicableGoal(objectiveConfig, weekKey, today);
  const historical = weekKind === 'past';
  const editable = !historical;
  [...weekExceptionForm.elements].forEach((element) => { element.disabled = !editable; });

  const selectedException = objectiveConfig.exceptions[weekKey];
  exceptionNoGoalInput.checked = selectedException === StudyObjective.NO_GOAL;
  exceptionGoalHoursInput.value = selectedException !== undefined && selectedException !== StudyObjective.NO_GOAL
    ? String(selectedException) : '';
  if (editable) {
    const currentRevision = [...objectiveConfig.baseRevisions].reverse().find((revision) =>
      revision.weekStart <= getCurrentObjectiveWeek()
    );
    baseGoalHoursInput.value = currentRevision ? String(currentRevision.hours) : '';
  }

  objectiveNoGoal.hidden = goal !== null && goal !== StudyObjective.NO_GOAL;
  objectiveIndicator.hidden = !objectiveNoGoal.hidden;
  if (goal === null || goal === StudyObjective.NO_GOAL || weekKind === 'future') {
    objectiveNoGoal.hidden = false;
    objectiveIndicator.hidden = true;
    return;
  }

  const progress = StudyObjective.calculateWeekProgress(allSessions, goal, weekKey, today);
  const formatted = StudyObjective.formatGoalProgress(progress);
  objectiveStudied.textContent = formatted.durationText;
  objectiveGoal.textContent = formatted.goalText;
  objectivePercentage.textContent = formatted.percentageText;
  objectiveStatus.textContent = progress.state;
  objectiveCircleLabel.textContent = `Progreso semanal: ${formatted.percentageText}`;
  objectiveCircleProgress.setAttribute('stroke-dasharray', `${formatted.arcFraction * 100} ${100 - formatted.arcFraction * 100}`);
}

function formatSessionDate(dateString) {
  const date = StudyHeatmap.parseLocalDate(dateString);
  if (!date) return dateString;

  return new Intl.DateTimeFormat('es', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
}

function formatNumber(value, maximumFractionDigits = 0) {
  return new Intl.NumberFormat('es', { maximumFractionDigits }).format(value);
}

function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours === 0) return `${formatNumber(remainingMinutes)} min`;
  if (remainingMinutes === 0) return `${formatNumber(hours)} h`;
  return `${formatNumber(hours)} h ${formatNumber(remainingMinutes)} min`;
}

function getTodayString() {
  return StudyHeatmap.getLocalDateString(new Date());
}

function setFormMode(isEditing) {
  formEyebrow.textContent = isEditing ? 'Editar entrada' : 'Nueva entrada';
  formTitle.textContent = isEditing ? 'Editar una sesión' : 'Registrar una sesión';
  submitButton.textContent = isEditing ? 'Guardar cambios' : 'Guardar sesión';
  form.noValidate = isEditing;
  cancelEditButton.hidden = !isEditing;
  dateInput.max = isEditing ? getTodayString() : '';
  minutesInput.min = isEditing ? '1' : '0';
  minutesInput.step = isEditing ? '1' : 'any';
}

function setFormMessage(message = '', isError = false) {
  formMessage.textContent = message;
  formMessage.classList.toggle('is-error', isError);
}

function resetSessionForm(shouldFocus = false) {
  editingSessionIndex = null;
  setFormMode(false);
  dateInput.value = getTodayString();
  topicInput.value = '';
  minutesInput.value = '';
  dateInput.setCustomValidity('');
  topicInput.setCustomValidity('');
  minutesInput.setCustomValidity('');
  setFormMessage();
  if (shouldFocus) topicInput.focus();
}

function beginSessionEdit(index) {
  const session = sessions[index];
  if (!session) return;

  editingSessionIndex = index;
  setFormMode(true);
  dateInput.value = session.date;
  topicInput.value = session.topic;
  minutesInput.value = String(session.minutes);
  dateInput.setCustomValidity('');
  topicInput.setCustomValidity('');
  minutesInput.setCustomValidity('');
  setFormMessage();
  topicInput.focus();
}

function calculateStreak(sessions) {
  const studyDays = new Set(sessions.map((session) => session.date));
  const today = new Date();
  const todayString = StudyHeatmap.getLocalDateString(today);
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  let currentDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  if (!studyDays.has(todayString)) {
    if (!studyDays.has(StudyHeatmap.getLocalDateString(yesterday))) return 0;
    currentDay = yesterday;
  }

  let streak = 0;
  while (studyDays.has(StudyHeatmap.getLocalDateString(currentDay))) {
    streak += 1;
    currentDay.setDate(currentDay.getDate() - 1);
  }
  return streak;
}

function calculateBestStreak(sessions) {
  const studyDays = [...new Set(sessions.map((session) => session.date))].sort();
  if (studyDays.length === 0) return 0;

  let best = 1;
  let currentStreak = 1;
  let previousDay = StudyHeatmap.parseLocalDate(studyDays[0]);

  for (let index = 1; index < studyDays.length; index += 1) {
    const currentDay = StudyHeatmap.parseLocalDate(studyDays[index]);
    const dayAfterPrevious = new Date(
      previousDay.getFullYear(),
      previousDay.getMonth(),
      previousDay.getDate() + 1
    );

    if (StudyHeatmap.getLocalDateString(dayAfterPrevious) === studyDays[index]) {
      currentStreak += 1;
    } else {
      currentStreak = 1;
    }

    best = Math.max(best, currentStreak);
    previousDay = currentDay;
  }
  return best;
}

function renderStreak(sessions) {
  const streak = calculateStreak(sessions);
  const best = calculateBestStreak(sessions);

  streakCount.textContent = String(streak);
  streakDays.textContent = streak === 1 ? 'día' : 'días';
  bestStreakCount.textContent = String(best);
  bestStreakDays.textContent = best === 1 ? 'día' : 'días';
  bestStreakValue.hidden = best === 0;
  bestStreakEmpty.hidden = best !== 0;
  bestStreak.classList.toggle('is-empty', best === 0);

  if (streak === 0) {
    streakCaption.textContent = 'Registra una sesión para empezar tus días seguidos estudiando.';
  } else if (!sessions.some((session) => session.date === StudyHeatmap.getLocalDateString(new Date()))) {
    streakCaption.textContent = 'Tus días seguidos estudiando siguen vivos: todavía puedes estudiar hoy.';
  } else {
    streakCaption.textContent = '¡Muy bien! Sigue sumando días de estudio.';
  }
}

function getFilterSettings() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayString = StudyHeatmap.getLocalDateString(today);
  let periodStart = '';

  if (periodFilter.value !== 'all') {
    const numberOfDays = Number(periodFilter.value);
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - numberOfDays + 1);
    periodStart = StudyHeatmap.getLocalDateString(start);
  }

  const invertedRange = Boolean(fromFilter.value && toFilter.value && fromFilter.value > toFilter.value);
  return {
    todayString,
    periodStart,
    topic: topicFilter.value,
    from: invertedRange ? '' : fromFilter.value,
    to: invertedRange ? '' : toFilter.value,
    invertedRange
  };
}

function getFilteredSessions(allSessions) {
  const filters = getFilterSettings();
  return allSessions.filter((session) => {
    if (filters.periodStart && (session.date < filters.periodStart || session.date > filters.todayString)) {
      return false;
    }
    if (filters.from && session.date < filters.from) return false;
    if (filters.to && session.date > filters.to) return false;
    if (filters.topic && session.topic !== filters.topic) return false;
    return true;
  });
}

function renderStatistics(sessions) {
  const studyDays = new Set(sessions.map((session) => session.date));
  const totalMinutes = sessions.reduce((total, session) => total + session.minutes, 0);
  statistics.sessions.textContent = formatNumber(sessions.length);
  statistics.days.textContent = formatNumber(studyDays.size);
  statistics.minutes.textContent = formatDuration(totalMinutes);
  statistics.averageSession.textContent = sessions.length
    ? `${formatNumber(totalMinutes / sessions.length, 1)} min`
    : '—';
  statistics.averageDay.textContent = studyDays.size
    ? `${formatNumber(totalMinutes / studyDays.size, 1)} min`
    : '—';
}

// Suma el tiempo desde el lunes de esta semana hasta hoy, en fechas locales.
function calculateCurrentWeekMinutes(sessions) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - ((today.getDay() + 6) % 7));
  const weekStart = StudyHeatmap.getLocalDateString(monday);
  const todayString = StudyHeatmap.getLocalDateString(today);

  return sessions.reduce((total, session) => {
    return session.date >= weekStart && session.date <= todayString
      ? total + session.minutes
      : total;
  }, 0);
}

// Cuenta los días únicos estudiados desde el inicio del mes hasta hoy.
function calculateCurrentMonthStudyDays(sessions) {
  const today = new Date();
  const todayString = StudyHeatmap.getLocalDateString(today);
  const currentMonth = todayString.slice(0, 7);
  const studyDays = new Set(
    sessions
      .filter((session) => session.date.startsWith(`${currentMonth}-`) && session.date <= todayString)
      .map((session) => session.date)
  );
  return studyDays.size;
}

function renderAchievements(sessions) {
  const totalMinutes = sessions.reduce((total, session) => total + session.minutes, 0);
  const achievements = [
    { icon: '🌱', title: 'Primer paso', description: 'Registra tu primera sesión.', progress: sessions.length, target: 1, unit: 'sesión' },
    { icon: '📚', title: 'En marcha', description: 'Completa 10 sesiones.', progress: sessions.length, target: 10, unit: 'sesiones' },
    { icon: '🏅', title: 'Constancia', description: 'Completa 50 sesiones.', progress: sessions.length, target: 50, unit: 'sesiones' },
    { icon: '⏱️', title: 'Cinco horas', description: 'Acumula 5 horas de estudio.', progress: totalMinutes, target: 300, unit: 'minutos' },
    { icon: '🌟', title: 'Gran dedicación', description: 'Acumula 25 horas de estudio.', progress: totalMinutes, target: 1500, unit: 'minutos' },
    { icon: '🔥', title: 'Una semana', description: 'Estudia 7 días seguidos.', progress: calculateBestStreak(sessions), target: 7, unit: 'días' },
    { icon: '🚀', title: 'Un mes de hábito', description: 'Estudia 30 días seguidos.', progress: calculateBestStreak(sessions), target: 30, unit: 'días' }
  ];
  const list = document.querySelector('#achievement-list');
  const fragment = document.createDocumentFragment();

  achievements.forEach((achievement) => {
    const unlocked = achievement.progress >= achievement.target;
    const card = document.createElement('article');
    card.className = `achievement-card${unlocked ? ' is-unlocked' : ''}`;
    card.setAttribute('aria-label', `${achievement.title}: ${unlocked ? 'desbloqueado' : 'en progreso'}`);

    const icon = document.createElement('span');
    icon.className = 'achievement-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = achievement.icon;

    const title = document.createElement('h3');
    title.textContent = achievement.title;
    const description = document.createElement('p');
    description.className = 'achievement-description';
    description.textContent = achievement.description;
    const progress = document.createElement('p');
    progress.className = 'achievement-progress';
    progress.textContent = unlocked
      ? '¡Logro desbloqueado!'
      : `${formatNumber(Math.min(achievement.progress, achievement.target))} / ${formatNumber(achievement.target)} ${achievement.unit}`;

    card.append(icon, title, description, progress);
    fragment.append(card);
  });

  list.replaceChildren(fragment);
}

function renderSessions(sessions, allSessions) {
  const sortedSessions = [...sessions].sort((first, second) => {
    const dateDifference = second.date.localeCompare(first.date);
    return dateDifference || (second.createdAt || 0) - (first.createdAt || 0);
  });
  const fragment = document.createDocumentFragment();

  sortedSessions.forEach((session) => {
    const sessionIndex = allSessions.indexOf(session);
    const item = document.createElement('li');
    item.className = 'session-item';
    item.dataset.sessionIndex = String(sessionIndex);

    const details = document.createElement('div');
    const topic = document.createElement('p');
    topic.className = 'session-topic';
    topic.textContent = session.topic;
    const date = document.createElement('p');
    date.className = 'session-date';
    date.textContent = formatSessionDate(session.date);
    const minutes = document.createElement('span');
    minutes.className = 'session-minutes';
    minutes.textContent = `${formatNumber(session.minutes, 1)} min`;

    const actions = document.createElement('div');
    actions.className = 'session-actions';
    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.className = 'secondary-button session-action edit-session';
    editButton.dataset.sessionIndex = String(sessionIndex);
    editButton.textContent = 'Editar';
    editButton.setAttribute('aria-label', `Editar sesión de ${session.topic}`);
    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'secondary-button session-action delete-session';
    deleteButton.dataset.sessionIndex = String(sessionIndex);
    deleteButton.textContent = 'Eliminar';
    deleteButton.setAttribute('aria-label', `Eliminar sesión de ${session.topic}`);
    actions.append(editButton, deleteButton);

    details.append(topic, date);
    item.append(details, minutes, actions);
    fragment.append(item);
  });

  sessionList.replaceChildren(fragment);
  emptyState.hidden = sortedSessions.length > 0;
  emptyState.textContent = allSessions.length === 0
    ? 'Todavía no hay sesiones. ¡Registra la primera!'
    : 'No hay sesiones para los filtros seleccionados.';
  sessionTotal.textContent = `${formatNumber(sortedSessions.length)} ${sortedSessions.length === 1 ? 'sesión' : 'sesiones'}`;
  filterSummary.textContent = `Mostrando ${formatNumber(sortedSessions.length)} de ${formatNumber(allSessions.length)} ${allSessions.length === 1 ? 'sesión' : 'sesiones'}.`;
  filterMessage.textContent = getFilterSettings().invertedRange
    ? 'El rango de fechas está invertido; se ignora y se mantienen los demás filtros.'
    : '';
}

function renderHeatmap(sessions) {
  const today = StudyHeatmap.getLocalDateString(new Date());
  const days = StudyHeatmap.buildHeatmap(sessions, today);
  const selectedDay = days.find((day) => day.date === selectedHeatmapDate && !day.isFuture);
  if (!selectedDay) selectedHeatmapDate = null;
  const weekdays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const rows = weekdays.map((weekday) => {
    const row = document.createElement('div');
    row.className = 'heatmap-week-row';
    row.setAttribute('role', 'row');
    row.setAttribute('aria-label', weekday);
    return row;
  });

  days.forEach((day, index) => {
    const weekdayIndex = index % 7;
    const cell = document.createElement('div');
    cell.setAttribute('role', 'gridcell');
    cell.dataset.date = day.date;

    if (day.isFuture) {
      cell.className = 'heatmap-cell is-future';
      cell.setAttribute('aria-disabled', 'true');
      cell.setAttribute('aria-label', `${formatSessionDate(day.date)}: fecha futura, sin actividad`);
    } else {
      const levelDescription = day.level === 0 ? 'sin estudio' : `nivel ${day.level}`;
      const total = new Intl.NumberFormat('es', { maximumFractionDigits: 20 }).format(day.minutes);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `heatmap-cell heatmap-level-${day.level}`;
      button.dataset.date = day.date;
      const isSelected = day.date === selectedHeatmapDate;
      button.setAttribute('aria-pressed', String(isSelected));
      button.classList.toggle('is-selected', isSelected);
      button.setAttribute(
        'aria-label',
        `${formatSessionDate(day.date)}: ${total} min, ${levelDescription}`
      );
      cell.append(button);
    }

    rows[weekdayIndex].append(cell);
  });

  heatmapGrid.replaceChildren(...rows);
  const buttons = heatmapGrid.querySelectorAll('button[data-date]');
  buttons.forEach((button, index) => {
    button.tabIndex = button.dataset.date === selectedHeatmapDate
      ? 0
      : selectedHeatmapDate === null && index === 0 ? 0 : -1;
  });

  heatmapDetail.textContent = selectedDay
    ? `${formatSessionDate(selectedDay.date)}: ${formatNumber(selectedDay.minutes, 20)} min estudiados.`
    : '';
}

function scheduleMidnightUpdate() {
  window.clearTimeout(midnightRenderTimer);
  const now = new Date();
  const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const delay = Math.max(1, nextMidnight.getTime() - now.getTime());

  midnightRenderTimer = window.setTimeout(() => {
    render(sessions);
    scheduleMidnightUpdate();
  }, delay);
}

function populateTopicFilter(sessions) {
  const selectedTopic = topicFilter.value;
  const topics = [...new Set(sessions.map((session) => session.topic))]
    .sort((first, second) => first.localeCompare(second, 'es'));
  const fragment = document.createDocumentFragment();
  const allOption = document.createElement('option');
  allOption.value = '';
  allOption.textContent = 'Todas las materias';
  fragment.append(allOption);

  topics.forEach((topic) => {
    const option = document.createElement('option');
    option.value = topic;
    option.textContent = topic;
    fragment.append(option);
  });

  topicFilter.replaceChildren(fragment);
  topicFilter.value = topics.includes(selectedTopic) ? selectedTopic : '';
}

function render(sessions) {
  populateTopicFilter(sessions);
  const filteredSessions = getFilteredSessions(sessions);
  renderSessions(filteredSessions, sessions);
  renderStatistics(filteredSessions);
  statistics.weekMinutes.textContent = formatDuration(calculateCurrentWeekMinutes(sessions));
  statistics.monthDays.textContent = formatNumber(calculateCurrentMonthStudyDays(sessions));
  renderHeatmap(sessions);
  renderStreak(sessions);
  renderAchievements(sessions);
  renderObjective(sessions);
  scheduleMidnightUpdate();
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const dark = theme === 'dark';
  themeToggle.setAttribute('aria-pressed', String(dark));
  themeToggle.textContent = dark ? '☀️ Tema claro' : '🌙 Tema oscuro';
  themeToggle.setAttribute('aria-label', dark ? 'Activar tema claro' : 'Activar tema oscuro');
}

function initializeTheme() {
  let savedTheme = null;
  try {
    savedTheme = localStorage.getItem(THEME_KEY);
  } catch {
    // El tema del sistema sigue funcionando aunque el almacenamiento no esté disponible.
  }

  if (savedTheme === 'dark' || savedTheme === 'light') {
    setTheme(savedTheme);
  } else {
    delete document.documentElement.dataset.theme;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    themeToggle.setAttribute('aria-pressed', String(prefersDark));
    themeToggle.textContent = prefersDark ? '☀️ Tema claro' : '🌙 Tema oscuro';
    themeToggle.setAttribute('aria-label', prefersDark ? 'Activar tema claro' : 'Activar tema oscuro');
  }
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportBackup() {
  downloadJson(`diario-de-estudio-respaldo-${StudyHeatmap.getLocalDateString(new Date())}.json`, {
    version: BACKUP_VERSION,
    sessions
  });
  backupMessage.textContent = 'Respaldo descargado.';
}

function validateBackup(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data) || data.version !== BACKUP_VERSION) {
    throw new Error('El archivo no tiene una versión de respaldo compatible.');
  }
  if (!Array.isArray(data.sessions)) {
    throw new Error('El respaldo no contiene una lista de sesiones válida.');
  }

  const normalized = data.sessions.map(normalizeSession);
  if (normalized.some((session) => !session)) {
    throw new Error('Hay sesiones con fecha, materia, duración o datos inválidos. No se importó nada.');
  }
  return normalized;
}

async function importBackup(file) {
  backupMessage.textContent = '';
  try {
    const data = JSON.parse(await file.text());
    const importedSessions = validateBackup(data);
    const accepted = window.confirm(
      `El archivo contiene ${importedSessions.length} sesiones. Al importarlo se reemplazarán las sesiones actuales. ¿Continuar?`
    );
    if (!accepted) return;

    if (!saveSessions(importedSessions)) {
      throw new Error('No se pudieron guardar los datos en este navegador.');
    }
    sessions = importedSessions;
    render(sessions);
    backupMessage.textContent = `Se importaron ${formatNumber(sessions.length)} sesiones.`;
  } catch (error) {
    backupMessage.textContent = error instanceof SyntaxError
      ? 'El archivo no contiene JSON válido. Los datos actuales se conservaron.'
      : `${error.message} Los datos actuales se conservaron.`;
  } finally {
    backupInput.value = '';
  }
}

// Genera datos ficticios de un año, sin guardarlos ni mezclarlos automáticamente.
function downloadSampleHistory() {
  const topics = [
    'Matemáticas', 'Física', 'Química', 'Biología', 'Historia',
    'Literatura', 'Inglés', 'Programación', 'Estadística', 'Filosofía'
  ];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sampleSessions = [];

  for (let dayIndex = 0; dayIndex < 365; dayIndex += 1) {
    // Incluye una racha histórica de 35 días para mostrar medallas y descansos
    // irregulares durante el resto del año.
    if (dayIndex >= 35 && (dayIndex % 9 === 4 || dayIndex % 23 === 11)) continue;

    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (364 - dayIndex));
    const dateString = StudyHeatmap.getLocalDateString(date);
    const sessionsThatDay = 3 + (dayIndex % 4 === 0 ? 1 : 0);

    for (let slot = 0; slot < sessionsThatDay; slot += 1) {
      const createdAtDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      createdAtDate.setHours(8 + slot * 3, (dayIndex * 13 + slot * 7) % 60, 0, 0);
      sampleSessions.push({
        date: dateString,
        topic: topics[(dayIndex + slot * 3 + Math.floor(dayIndex / 7)) % topics.length],
        minutes: 25 + ((dayIndex * 11 + slot * 17) % 66),
        createdAt: createdAtDate.getTime()
      });
    }
  }

  downloadJson('datos-prueba-1-ano.json', {
    version: BACKUP_VERSION,
    sessions: sampleSessions
  });
  backupMessage.textContent = `Historial de prueba descargado: ${formatNumber(sampleSessions.length)} sesiones, 10 materias y 365 días.`;
}

dateInput.value = StudyHeatmap.getLocalDateString(new Date());
let sessions = readSessions();
initializeTheme();
render(sessions);

sessionList.addEventListener('click', (event) => {
  const editButton = event.target.closest('button.edit-session');
  if (editButton) {
    beginSessionEdit(Number(editButton.dataset.sessionIndex));
    return;
  }

  const deleteButton = event.target.closest('button.delete-session');
  if (!deleteButton) return;

  const index = Number(deleteButton.dataset.sessionIndex);
  const session = sessions[index];
  if (!session) return;

  const accepted = window.confirm(
    `¿Eliminar la sesión de ${session.topic} del ${formatSessionDate(session.date)}? Esta acción no se puede deshacer.`
  );
  if (!accepted) return;

  const nextSessions = StudySessions.deleteSession(sessions, index);
  if (!saveSessions(nextSessions)) {
    setFormMessage('No se pudo eliminar. El almacenamiento del navegador puede estar lleno.', true);
    return;
  }

  sessions = nextSessions;
  if (editingSessionIndex === index) {
    resetSessionForm(false);
  } else if (editingSessionIndex !== null && index < editingSessionIndex) {
    editingSessionIndex -= 1;
  }
  render(sessions);
  setFormMessage('La sesión se eliminó.');
});

cancelEditButton.addEventListener('click', () => resetSessionForm(true));

heatmapGrid.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-date]');
  if (!button) return;

  const today = StudyHeatmap.getLocalDateString(new Date());
  const day = StudyHeatmap.buildHeatmap(sessions, today)
    .find((entry) => entry.date === button.dataset.date);
  if (!day || day.isFuture) return;

  selectedHeatmapDate = day.date;

  heatmapGrid.querySelectorAll('button[data-date]').forEach((dayButton) => {
    const selected = dayButton === button;
    dayButton.setAttribute('aria-pressed', String(selected));
    dayButton.classList.toggle('is-selected', selected);
    dayButton.tabIndex = selected ? 0 : -1;
  });

  const total = formatNumber(day.minutes, 20);
  heatmapDetail.textContent = `${formatSessionDate(day.date)}: ${total} min estudiados.`;
});

heatmapGrid.addEventListener('keydown', (event) => {
  const currentButton = event.target.closest('button[data-date]');
  if (!currentButton) return;

  const today = StudyHeatmap.getLocalDateString(new Date());
  const dates = StudyHeatmap.getHeatmapDates(today);
  const currentIndex = dates.indexOf(currentButton.dataset.date);
  if (currentIndex < 0) return;

  const weekIndex = Math.floor(currentIndex / 7);
  const weekdayIndex = currentIndex % 7;
  let nextWeek = weekIndex;
  let nextWeekday = weekdayIndex;

  if (event.key === 'ArrowLeft') nextWeek -= 1;
  else if (event.key === 'ArrowRight') nextWeek += 1;
  else if (event.key === 'ArrowUp') nextWeekday -= 1;
  else if (event.key === 'ArrowDown') nextWeekday += 1;
  else return;

  event.preventDefault();
  if (nextWeek < 0 || nextWeek >= 12 || nextWeekday < 0 || nextWeekday >= 7) return;

  const nextDate = dates[nextWeek * 7 + nextWeekday];
  const nextButton = heatmapGrid.querySelector(`button[data-date="${nextDate}"]`);
  if (!nextButton) return;

  currentButton.tabIndex = -1;
  nextButton.tabIndex = 0;
  nextButton.focus();
  nextButton.scrollIntoView({ block: 'nearest', inline: 'nearest' });
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  setFormMessage();

  if (editingSessionIndex !== null) {
    const values = {
      date: dateInput.value,
      topic: topicInput.value,
      minutes: minutesInput.value
    };
    const validation = StudySessions.validateSessionValues(values, getTodayString());
    dateInput.setCustomValidity(validation.errors.date || '');
    topicInput.setCustomValidity(validation.errors.topic || '');
    minutesInput.setCustomValidity(validation.errors.minutes || '');

    if (!validation.valid) {
      setFormMessage(Object.values(validation.errors).join(' '), true);
      form.reportValidity();
      return;
    }

    const nextSessions = StudySessions.updateSession(sessions, editingSessionIndex, {
      date: values.date,
      topic: values.topic.trim(),
      minutes: Number(values.minutes)
    });

    if (!saveSessions(nextSessions)) {
      setFormMessage('No se pudo guardar. El almacenamiento del navegador puede estar lleno.', true);
      return;
    }

    sessions = nextSessions;
    resetSessionForm(true);
    render(sessions);
    setFormMessage('La sesión se actualizó.');
    return;
  }

  if (!form.reportValidity()) return;

  const minutes = Number(minutesInput.value);
  if (!Number.isFinite(minutes) || minutes <= 0) {
    minutesInput.setCustomValidity('Escribe un número mayor que 0.');
    minutesInput.reportValidity();
    return;
  }

  const topic = topicInput.value.trim();
  if (!topic) {
    topicInput.setCustomValidity('Escribe la materia que has estudiado.');
    topicInput.reportValidity();
    return;
  }

  topicInput.setCustomValidity('');
  minutesInput.setCustomValidity('');
  const nextSessions = [...sessions, {
    date: dateInput.value,
    topic,
    minutes,
    createdAt: Date.now()
  }];

  if (!saveSessions(nextSessions)) {
    setFormMessage('No se pudo guardar. El almacenamiento del navegador puede estar lleno.', true);
    return;
  }

  sessions = nextSessions;
  render(sessions);
  topicInput.value = '';
  minutesInput.value = '';
  topicInput.focus();
  setFormMessage('Sesión guardada.');
});

topicInput.addEventListener('input', () => topicInput.setCustomValidity(''));
minutesInput.addEventListener('input', () => minutesInput.setCustomValidity(''));
dateInput.addEventListener('input', () => dateInput.setCustomValidity(''));

[periodFilter, topicFilter, fromFilter, toFilter].forEach((control) => {
  control.addEventListener('change', () => render(sessions));
});

resetFiltersButton.addEventListener('click', () => {
  periodFilter.value = 'all';
  topicFilter.value = '';
  fromFilter.value = '';
  toFilter.value = '';
  render(sessions);
});

baseGoalForm.querySelector('#save-base-goal').addEventListener('click', () => {
  setObjectiveMessage(baseGoalMessage);
  try {
    const next = StudyObjective.setBaseGoal(objectiveConfig, baseGoalHoursInput.value, getObjectiveToday());
    if (!saveObjectiveConfig(next)) throw new Error('No se pudo guardar el objetivo.');
    setObjectiveMessage(baseGoalMessage, 'Objetivo base guardado.');
    render(sessions);
  } catch (error) {
    setObjectiveMessage(baseGoalMessage, error.message, true);
  }
});

objectiveWeekSelect.addEventListener('change', () => {
  setObjectiveMessage(exceptionMessage);
  renderObjective(sessions);
});

weekExceptionForm.querySelector('#save-week-exception').addEventListener('click', () => {
  setObjectiveMessage(exceptionMessage);
  try {
    const exception = exceptionNoGoalInput.checked
      ? StudyObjective.NO_GOAL
      : exceptionGoalHoursInput.value;
    const next = StudyObjective.setWeekException(
      objectiveConfig,
      getSelectedObjectiveWeek(),
      exception,
      getObjectiveToday()
    );
    if (!saveObjectiveConfig(next)) throw new Error('No se pudo guardar la excepción.');
    setObjectiveMessage(exceptionMessage, 'Excepción guardada.');
    render(sessions);
  } catch (error) {
    setObjectiveMessage(exceptionMessage, error.message, true);
  }
});

weekExceptionForm.querySelector('#remove-week-exception').addEventListener('click', () => {
  setObjectiveMessage(exceptionMessage);
  try {
    const next = StudyObjective.removeWeekException(
      objectiveConfig,
      getSelectedObjectiveWeek(),
      getObjectiveToday()
    );
    if (!saveObjectiveConfig(next)) throw new Error('No se pudo quitar la excepción.');
    setObjectiveMessage(exceptionMessage, 'La semana vuelve a heredar el objetivo base.');
    render(sessions);
  } catch (error) {
    setObjectiveMessage(exceptionMessage, error.message, true);
  }
});

themeToggle.addEventListener('click', () => {
  const currentlyDark = document.documentElement.dataset.theme
    ? document.documentElement.dataset.theme === 'dark'
    : window.matchMedia('(prefers-color-scheme: dark)').matches;
  const nextTheme = currentlyDark ? 'light' : 'dark';
  setTheme(nextTheme);
  try {
    localStorage.setItem(THEME_KEY, nextTheme);
  } catch {
    // El cambio permanece activo hasta cerrar la página aunque no se pueda guardar.
  }
});

document.querySelector('#export-backup').addEventListener('click', exportBackup);
document.querySelector('#import-backup').addEventListener('click', () => backupInput.click());
backupInput.addEventListener('change', () => {
  if (backupInput.files && backupInput.files[0]) importBackup(backupInput.files[0]);
});
document.querySelector('#download-sample').addEventListener('click', downloadSampleHistory);
