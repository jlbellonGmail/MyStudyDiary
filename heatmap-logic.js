(function (root, createApi) {
  const api = createApi();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.StudyHeatmap = api;
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  function getLocalDateString(date) {
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
    date.setFullYear(year, month - 1, day);
    date.setHours(0, 0, 0, 0);

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }

    return date;
  }

  function getHeatmapDates(today) {
    const start = parseLocalDate(today);
    if (!start) return [];

    const daysSinceMonday = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - daysSinceMonday - 77);
    start.setHours(12, 0, 0, 0);

    const dates = [];
    for (let index = 0; index < 84; index += 1) {
      dates.push(getLocalDateString(start));
      start.setDate(start.getDate() + 1);
    }
    return dates;
  }

  function getIntensityLevel(minutes) {
    if (!Number.isFinite(minutes) || minutes < 0) return null;
    if (minutes === 0) return 0;
    if (minutes <= 30) return 1;
    if (minutes <= 60) return 2;
    if (minutes <= 90) return 3;
    return 4;
  }

  function buildHeatmap(sessions, today) {
    const dates = getHeatmapDates(today);
    if (dates.length === 0) return [];

    const firstDate = dates[0];
    const todayIndex = dates.indexOf(today);
    const totals = new Map();

    if (Array.isArray(sessions)) {
      sessions.forEach((session) => {
        if (!session || typeof session.date !== 'string' || !Number.isFinite(session.minutes)) {
          return;
        }
        if (session.minutes <= 0 || session.date < firstDate || session.date > today) {
          return;
        }

        totals.set(session.date, (totals.get(session.date) || 0) + session.minutes);
      });
    }

    return dates.map((date, index) => {
      const isFuture = index > todayIndex;
      const minutes = isFuture ? 0 : totals.get(date) || 0;
      return {
        date,
        minutes,
        level: isFuture ? null : getIntensityLevel(minutes),
        isFuture
      };
    });
  }

  return {
    getLocalDateString,
    parseLocalDate,
    getHeatmapDates,
    getIntensityLevel,
    buildHeatmap
  };
});
