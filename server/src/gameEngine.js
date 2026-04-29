const DEFAULT_SETTINGS = {
  categories: ["Marvel", "Star Wars", "DC", "O Senhor dos Anéis", "Cultura Pop"],
  difficulties: ["Fácil", "Médio", "Difícil"],
  totalQuestions: 20,
  secondsPerQuestion: 30,
};

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function sanitizeSettings(settings = {}, questionBank = []) {
  const categories = [...new Set(questionBank.map((q) => q.category))];
  const difficulties = [...new Set(questionBank.map((q) => q.difficulty))];

  const selectedCategories = Array.isArray(settings.categories) && settings.categories.length
    ? settings.categories.filter((item) => categories.includes(item))
    : DEFAULT_SETTINGS.categories;

  const selectedDifficulties = Array.isArray(settings.difficulties) && settings.difficulties.length
    ? settings.difficulties.filter((item) => difficulties.includes(item))
    : DEFAULT_SETTINGS.difficulties;

  const totalQuestions = Math.max(5, Math.min(Number(settings.totalQuestions || DEFAULT_SETTINGS.totalQuestions), 50));
  const secondsPerQuestion = Math.max(10, Math.min(Number(settings.secondsPerQuestion || DEFAULT_SETTINGS.secondsPerQuestion), 60));

  return {
    categories: selectedCategories.length ? selectedCategories : categories,
    difficulties: selectedDifficulties.length ? selectedDifficulties : difficulties,
    totalQuestions,
    secondsPerQuestion,
  };
}

function buildDeck(settings, questionBank) {
  const filtered = questionBank.filter(
    (q) => settings.categories.includes(q.category) && settings.difficulties.includes(q.difficulty)
  );

  if (filtered.length < 1) {
    throw new Error("Nenhuma pergunta encontrada para os filtros selecionados.");
  }

  return shuffle(filtered).slice(0, Math.min(settings.totalQuestions, filtered.length));
}

function publicQuestion(question) {
  if (!question) return null;
  const { answer, ...safeQuestion } = question;
  return safeQuestion;
}

export function createRoom({ code, hostSocketId, playerName, socketId, settings, questionBank }) {
  return {
    code,
    hostSocketId,
    status: "lobby",
    settings: sanitizeSettings(settings, questionBank),
    players: [{ id: socketId, name: playerName, score: 0, connected: true }],
    questions: [],
    currentIndex: 0,
    currentAnswers: {},
    history: [],
    roundStartedAt: null,
    roundEndsAt: null,
    revealAt: null,
    createdAt: Date.now(),
  };
}

export function joinRoom(room, { socketId, playerName }) {
  if (room.players.some((player) => player.name.toLowerCase() === playerName.toLowerCase())) {
    playerName = `${playerName} ${room.players.length + 1}`;
  }

  room.players.push({
    id: socketId,
    name: playerName,
    score: 0,
    connected: true,
  });
}

export function updateSettings(room, settings, questionBank) {
  if (room.status !== "lobby") {
    throw new Error("As configurações só podem ser alteradas no lobby.");
  }

  room.settings = sanitizeSettings({ ...room.settings, ...settings }, questionBank);
}

export function startGame(room, questionBank) {
  if (room.players.length < 1) throw new Error("A partida precisa ter ao menos um jogador.");
  room.questions = buildDeck(room.settings, questionBank);
  room.players = room.players.map((player) => ({ ...player, score: 0 }));
  room.status = "playing";
  room.currentIndex = 0;
  room.currentAnswers = {};
  room.history = [];
  room.roundStartedAt = Date.now();
  room.roundEndsAt = room.roundStartedAt + room.settings.secondsPerQuestion * 1000;
  room.revealAt = null;
}

export function submitAnswer(room, { socketId, questionId, option, timedOut = false }) {
  if (!["playing", "reveal"].includes(room.status)) throw new Error("A partida não está aceitando respostas.");
  if (room.status === "reveal") return;
  const question = room.questions[room.currentIndex];
  const player = room.players.find((p) => p.id === socketId);
  if (!question || !player) return;
  if (question.id !== questionId) throw new Error("Pergunta inválida para a rodada atual.");
  if (room.currentAnswers[socketId]) return;

  const correct = option === question.answer;
  const secondsLeft = Math.max(0, Math.ceil((room.roundEndsAt - Date.now()) / 1000));
  const points = correct ? 100 + secondsLeft * 3 : 0;

  player.score += points;
  room.currentAnswers[socketId] = {
    playerId: socketId,
    playerName: player.name,
    option: option || null,
    correct,
    points,
    secondsLeft,
    timedOut,
    answeredAt: Date.now(),
  };
}

export function advanceRound(room) {
  if (!["reveal", "playing"].includes(room.status)) return;

  if (room.currentIndex + 1 >= room.questions.length) {
    room.status = "finished";
    room.roundEndsAt = null;
    room.revealAt = null;
    room.history.push({
      question: room.questions[room.currentIndex],
      answers: room.currentAnswers,
    });
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
  room.players = room.players.filter((player) => player.id !== socketId);
  return before !== room.players.length;
}

export function getPublicRoom(room) {
  const currentQuestion = room.questions[room.currentIndex];
  const correctAnswer = ["reveal", "finished"].includes(room.status) ? currentQuestion?.answer : null;

  return {
    code: room.code,
    hostSocketId: room.hostSocketId,
    status: room.status,
    settings: room.settings,
    players: room.players,
    currentIndex: room.currentIndex,
    totalQuestions: room.questions.length || room.settings.totalQuestions,
    currentQuestion: publicQuestion(currentQuestion),
    correctAnswer,
    currentAnswers: room.currentAnswers,
    roundStartedAt: room.roundStartedAt,
    roundEndsAt: room.roundEndsAt,
    revealAt: room.revealAt,
    ranking: [...room.players].sort((a, b) => b.score - a.score),
  };
}
