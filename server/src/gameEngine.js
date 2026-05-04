import { DEFAULT_APP_SETTINGS } from "./appSettings.js";

const DEFAULT_SETTINGS = {
  gameType: "quiz",
  categories: ["Marvel", "Star Wars", "DC", "O Senhor dos Anéis", "Cultura Pop", "League of Legends"],
  difficulties: ["Fácil", "Médio", "Difícil"],
  totalQuestions: 20,
  secondsPerQuestion: 30,
  maxPlayers: 8,
  isPublic: true,
  roundLimit: 0,
};

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function clamp(number, min, max) {
  return Math.max(min, Math.min(Number(number), max));
}

function getRoundLimit(settings = {}, appSettings = DEFAULT_APP_SETTINGS) {
  const value = Number(settings.roundLimit ?? DEFAULT_SETTINGS.roundLimit);
  if (!Number.isFinite(value) || value <= 0) return 0;
  return clamp(value, 1, appSettings.maxRounds);
}

function sanitizeSettings(settings = {}, questionBank = [], appSettings = DEFAULT_APP_SETTINGS) {
  const categories = [...new Set(questionBank.map((q) => q.category))];
  const difficulties = [...new Set(questionBank.map((q) => q.difficulty))];

  const selectedCategories = Array.isArray(settings.categories) && settings.categories.length
    ? settings.categories.filter((item) => categories.includes(item))
    : DEFAULT_SETTINGS.categories.filter((item) => categories.includes(item));

  const selectedDifficulties = Array.isArray(settings.difficulties) && settings.difficulties.length
    ? settings.difficulties.filter((item) => difficulties.includes(item))
    : DEFAULT_SETTINGS.difficulties.filter((item) => difficulties.includes(item));

  const totalQuestions = clamp(
    settings.totalQuestions || appSettings.defaultTotalQuestions,
    appSettings.minTotalQuestions,
    appSettings.maxTotalQuestions
  );
  const secondsPerQuestion = clamp(
    settings.secondsPerQuestion || appSettings.defaultSecondsPerQuestion,
    appSettings.minSecondsPerQuestion,
    appSettings.maxSecondsPerQuestion
  );
  const maxPlayers = clamp(settings.maxPlayers || appSettings.defaultMaxPlayers, 1, appSettings.maxPlayers);
  const isPublic = settings.isPublic !== false;
  const roundLimit = getRoundLimit(settings, appSettings);

  return {
    gameType: "quiz",
    categories: selectedCategories.length ? selectedCategories : categories,
    difficulties: selectedDifficulties.length ? selectedDifficulties : difficulties,
    totalQuestions,
    secondsPerQuestion,
    maxPlayers,
    isPublic,
    roundLimit,
  };
}

function prepareQuestion(question) {
  return {
    ...question,
    options: shuffle(question.options),
  };
}

function buildDeck(settings, questionBank, usedQuestionIds = new Set()) {
  const filtered = questionBank.filter(
    (q) => settings.categories.includes(q.category) && settings.difficulties.includes(q.difficulty)
  );
  const uniqueQuestions = [...new Map(filtered.map((q) => [q.question.trim().toLowerCase(), q])).values()];

  if (uniqueQuestions.length < 1) {
    throw new Error("Nenhuma pergunta encontrada para os filtros selecionados.");
  }

  let available = uniqueQuestions.filter((question) => !usedQuestionIds.has(question.id));
  const shouldResetUsed = available.length < 1;

  if (shouldResetUsed) {
    usedQuestionIds.clear();
    available = uniqueQuestions;
  }

  const deck = shuffle(available).slice(0, Math.min(settings.totalQuestions, available.length));

  if (deck.length < settings.totalQuestions && available.length < uniqueQuestions.length) {
    const selectedIds = new Set(deck.map((question) => question.id));
    const refill = shuffle(uniqueQuestions.filter((question) => !selectedIds.has(question.id)))
      .slice(0, settings.totalQuestions - deck.length);
    deck.push(...refill);
  }

  return deck.map(prepareQuestion);
}

function publicQuestion(question) {
  if (!question) return null;
  const { answer, ...safeQuestion } = question;
  return safeQuestion;
}

function getRoundResult(room) {
  const ranking = [...room.players].sort((a, b) => b.score - a.score);
  return {
    roundNumber: room.roundNumber,
    winner: ranking[0] || null,
    ranking,
    finishedAt: Date.now(),
  };
}

export function createRoom({ code, hostSocketId, playerName, playerId, socketId, accountId = null, settings, questionBank, appSettings }) {
  const id = playerId || socketId;
  return {
    code,
    gameType: "quiz",
    hostSocketId: hostSocketId || id,
    status: "lobby",
    settings: sanitizeSettings(settings, questionBank, appSettings),
    players: [{ id, socketId, accountId, name: playerName, score: 0, connected: true }],
    questions: [],
    currentIndex: 0,
    currentAnswers: {},
    history: [],
    roundNumber: 0,
    roundResults: [],
    lastRoundResult: null,
    usedQuestionIds: new Set(),
    roundStartedAt: null,
    roundEndsAt: null,
    revealAt: null,
    emptySince: null,
    createdAt: Date.now(),
  };
}

export function joinRoom(room, { socketId, playerName, playerId, accountId = null }) {
  const accountPlayer = accountId ? room.players.find((player) => player.accountId === accountId) : null;
  const browserPlayer = playerId ? room.players.find((player) => player.id === playerId) : null;
  const canUseBrowserFallback = browserPlayer && (!accountId || !browserPlayer.accountId || browserPlayer.accountId === accountId);
  const reconnectingPlayer = accountPlayer || (canUseBrowserFallback ? browserPlayer : null);

  if (reconnectingPlayer) {
    reconnectingPlayer.socketId = socketId;
    reconnectingPlayer.connected = true;
    reconnectingPlayer.name = playerName || reconnectingPlayer.name;
    reconnectingPlayer.accountId = reconnectingPlayer.accountId || accountId || null;
    room.emptySince = null;
    return reconnectingPlayer;
  }

  if (room.players.length >= room.settings.maxPlayers) {
    throw new Error("Esta sala já atingiu o limite de participantes.");
  }

  if (room.players.some((player) => player.name.toLowerCase() === playerName.toLowerCase())) {
    playerName = `${playerName} ${room.players.length + 1}`;
  }

  const id = playerId && !room.players.some((item) => item.id === playerId) ? playerId : socketId;
  const player = {
    id,
    socketId,
    accountId,
    name: playerName,
    score: 0,
    connected: true,
  };

  room.players.push(player);
  room.emptySince = null;
  return player;
}

export function updateSettings(room, settings, questionBank, appSettings) {
  if (room.status !== "lobby" && room.status !== "round_finished") {
    throw new Error("As configurações só podem ser alteradas no lobby ou entre rodadas.");
  }

  room.settings = sanitizeSettings({ ...room.settings, ...settings }, questionBank, appSettings);
  room.settings.maxPlayers = Math.max(room.players.length, room.settings.maxPlayers);
}

export function startGame(room, questionBank) {
  if (!["lobby", "round_finished", "finished"].includes(room.status)) {
    throw new Error("A partida já está em andamento.");
  }
  if (room.players.length < 1) throw new Error("A partida precisa ter ao menos um jogador.");

  if (room.status === "finished") {
    room.roundNumber = 0;
    room.roundResults = [];
    room.usedQuestionIds.clear();
  }

  room.questions = buildDeck(room.settings, questionBank, room.usedQuestionIds);
  for (const question of room.questions) {
    room.usedQuestionIds.add(question.id);
  }
  room.players = room.players.map((player) => ({ ...player, score: 0 }));
  room.status = "playing";
  room.roundNumber += 1;
  room.currentIndex = 0;
  room.currentAnswers = {};
  room.history = [];
  room.lastRoundResult = null;
  room.roundStartedAt = Date.now();
  room.roundEndsAt = room.roundStartedAt + room.settings.secondsPerQuestion * 1000;
  room.revealAt = null;
}

export function submitAnswer(room, { socketId, questionId, option, timedOut = false }) {
  if (!["playing", "reveal"].includes(room.status)) throw new Error("A partida não está aceitando respostas.");
  if (room.status === "reveal") return;
  const question = room.questions[room.currentIndex];
  const player = room.players.find((p) => p.socketId === socketId || p.id === socketId);
  if (!question || !player) return;
  if (question.id !== questionId) throw new Error("Pergunta inválida para a rodada atual.");
  if (room.currentAnswers[player.id]) return;

  const correct = option === question.answer;
  const secondsLeft = Math.max(0, Math.ceil((room.roundEndsAt - Date.now()) / 1000));
  const points = correct ? 100 + secondsLeft * 3 : 0;

  player.score += points;
  room.currentAnswers[player.id] = {
    playerId: player.id,
    playerName: player.name,
    questionId: question.id,
    option: option || null,
    correct,
    points,
    secondsLeft,
    timedOut,
    answeredAt: Date.now(),
  };

  return room.currentAnswers[player.id];
}

export function advanceRound(room) {
  if (!["reveal", "playing"].includes(room.status)) return;

  if (room.currentIndex + 1 >= room.questions.length) {
    room.roundEndsAt = null;
    room.revealAt = null;
    room.history.push({
      question: room.questions[room.currentIndex],
      answers: room.currentAnswers,
    });
    room.lastRoundResult = getRoundResult(room);
    room.roundResults.push(room.lastRoundResult);
    room.status = room.settings.roundLimit > 0 && room.roundNumber >= room.settings.roundLimit
      ? "finished"
      : "round_finished";
    return;
  }

  room.history.push({
    question: room.questions[room.currentIndex],
    answers: room.currentAnswers,
  });

  room.currentIndex += 1;
  room.status = "playing";
  room.currentAnswers = {};
  room.roundStartedAt = Date.now();
  room.roundEndsAt = room.roundStartedAt + room.settings.secondsPerQuestion * 1000;
  room.revealAt = null;
}

export function removePlayerBySocket(room, socketId) {
  const before = room.players.length;
  room.players = room.players.filter((player) => player.socketId !== socketId && player.id !== socketId);
  return before !== room.players.length;
}

export function disconnectPlayerBySocket(room, socketId) {
  const player = room.players.find((item) => item.socketId === socketId || item.id === socketId);
  if (!player) return null;
  player.connected = false;
  player.socketId = null;
  return player;
}

export function getPlayerBySocket(room, socketId) {
  return room.players.find((player) => player.socketId === socketId || player.id === socketId) || null;
}

export function getPublicRoom(room) {
  const currentQuestion = room.questions[room.currentIndex];
  const correctAnswer = ["reveal", "round_finished", "finished"].includes(room.status) ? currentQuestion?.answer : null;

  return {
    code: room.code,
    gameType: "quiz",
    hostSocketId: room.hostSocketId,
    status: room.status,
    settings: room.settings,
    players: room.players,
    currentIndex: room.currentIndex,
    totalQuestions: room.questions.length || room.settings.totalQuestions,
    currentQuestion: publicQuestion(currentQuestion),
    correctAnswer,
    currentAnswers: room.currentAnswers,
    roundNumber: room.roundNumber,
    roundResults: room.roundResults,
    lastRoundResult: room.lastRoundResult,
    canStartNextRound: room.status === "round_finished",
    roundStartedAt: room.roundStartedAt,
    roundEndsAt: room.roundEndsAt,
    revealAt: room.revealAt,
    ranking: [...room.players].sort((a, b) => b.score - a.score),
  };
}
