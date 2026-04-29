export const DEFAULT_APP_SETTINGS = {
  minTotalQuestions: 5,
  defaultTotalQuestions: 20,
  maxTotalQuestions: 50,
  minSecondsPerQuestion: 10,
  defaultSecondsPerQuestion: 30,
  maxSecondsPerQuestion: 60,
  defaultMaxPlayers: 8,
  maxPlayers: 20,
  maxRounds: 20,
};

function toNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function sanitizeAppSettings(settings = {}) {
  const minTotalQuestions = Math.max(1, Math.min(toNumber(settings.minTotalQuestions, DEFAULT_APP_SETTINGS.minTotalQuestions), 50));
  const maxTotalQuestions = Math.max(minTotalQuestions, Math.min(toNumber(settings.maxTotalQuestions, DEFAULT_APP_SETTINGS.maxTotalQuestions), 200));
  const defaultTotalQuestions = Math.max(
    minTotalQuestions,
    Math.min(toNumber(settings.defaultTotalQuestions, DEFAULT_APP_SETTINGS.defaultTotalQuestions), maxTotalQuestions)
  );
  const minSecondsPerQuestion = Math.max(5, Math.min(toNumber(settings.minSecondsPerQuestion, DEFAULT_APP_SETTINGS.minSecondsPerQuestion), 120));
  const maxSecondsPerQuestion = Math.max(
    minSecondsPerQuestion,
    Math.min(toNumber(settings.maxSecondsPerQuestion, DEFAULT_APP_SETTINGS.maxSecondsPerQuestion), 180)
  );
  const defaultSecondsPerQuestion = Math.max(
    minSecondsPerQuestion,
    Math.min(toNumber(settings.defaultSecondsPerQuestion, DEFAULT_APP_SETTINGS.defaultSecondsPerQuestion), maxSecondsPerQuestion)
  );
  const maxPlayers = Math.max(1, Math.min(toNumber(settings.maxPlayers, DEFAULT_APP_SETTINGS.maxPlayers), 50));
  const defaultMaxPlayers = Math.max(1, Math.min(toNumber(settings.defaultMaxPlayers, DEFAULT_APP_SETTINGS.defaultMaxPlayers), maxPlayers));
  const maxRounds = Math.max(1, Math.min(toNumber(settings.maxRounds, DEFAULT_APP_SETTINGS.maxRounds), 100));

  return {
    minTotalQuestions,
    defaultTotalQuestions,
    maxTotalQuestions,
    minSecondsPerQuestion,
    defaultSecondsPerQuestion,
    maxSecondsPerQuestion,
    defaultMaxPlayers,
    maxPlayers,
    maxRounds,
  };
}
