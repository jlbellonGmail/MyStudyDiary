(function (root, createApi) {
  const api = createApi();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.StudySessions = api;
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  function parseLocalDate(dateString) {
    if (typeof dateString !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return null;
    }

    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(0);
    date.setFullYear(year, month - 1, day);
    date.setHours(0, 0, 0, 0);

    if (
      date.getFullYear() !== year
      || date.getMonth() !== month - 1
      || date.getDate() !== day
    ) {
      return null;
    }

    return date;
  }

  function isFutureDate(date, today) {
    return Boolean(parseLocalDate(date) && parseLocalDate(today) && date > today);
  }

  function validateSessionValues(values, today) {
    const errors = {};
    const input = values && typeof values === 'object' ? values : {};
    const date = input.date;
    const topic = input.topic;
    const minutes = Number(input.minutes);

    if (!parseLocalDate(date)) {
      errors.date = 'Escribe una fecha válida.';
    } else if (isFutureDate(date, today)) {
      errors.date = 'La fecha no puede ser posterior a hoy.';
    }

    if (typeof topic !== 'string' || !topic.trim()) {
      errors.topic = 'Escribe un tema.';
    } else if (topic.trim().length > 120) {
      errors.topic = 'El tema no puede superar 120 caracteres.';
    }

    if (!Number.isFinite(minutes) || !Number.isInteger(minutes) || minutes <= 0) {
      errors.minutes = 'Escribe un número entero mayor que 0.';
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors
    };
  }

  function updateSession(sessions, index, values) {
    if (!Array.isArray(sessions) || !Number.isInteger(index) || index < 0 || index >= sessions.length) {
      return Array.isArray(sessions) ? [...sessions] : [];
    }

    return sessions.map((session, sessionIndex) => {
      if (sessionIndex !== index) return session;
      return {
        ...session,
        date: values.date,
        topic: values.topic,
        minutes: values.minutes
      };
    });
  }

  function deleteSession(sessions, index) {
    if (!Array.isArray(sessions) || !Number.isInteger(index) || index < 0 || index >= sessions.length) {
      return Array.isArray(sessions) ? [...sessions] : [];
    }

    return sessions.filter((session, sessionIndex) => sessionIndex !== index);
  }

  return {
    isFutureDate,
    validateSessionValues,
    updateSession,
    deleteSession
  };
});
