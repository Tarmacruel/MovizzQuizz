import { randomUUID } from "crypto";
import { DEFAULT_APP_SETTINGS } from "./appSettings.js";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIFFICULT_LETTERS = new Set(["K", "W", "Y"]);
const DEFAULT_CATEGORIES = ["Nome", "Cidade", "Animal", "Objeto", "Filme/Serie", "Personagem"];
const REVIEW_SECONDS_PER_CATEGORY = 60;
const REVIEW_CHAT_LIMIT = 80;
const REVIEW_CHAT_MESSAGE_LIMIT = 220;

export const DEFAULT_STOP_SETTINGS = {
  gameType: "stop",
  matchName: "Stop / Adedanha",
  roundSeconds: 90,
  totalRounds: 5,
  letters: ALPHABET.split("").filter((letter) => !DIFFICULT_LETTERS.has(letter)).join(""),
  categories: DEFAULT_CATEGORIES.map((name, index) => ({
    id: `default-${index + 1}`,
    name,
    order: index,
  })),
  basePoints: 10,
  uniqueBonus: 5,
  allowDifficultLetters: false,
  manualValidation: true,
  maxPlayers: 8,
  isPublic: true,
};

function clamp(number, min, max) {
  const value = Number(number);
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(value, max));
}

function cleanText(value, limit = 80) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, limit);
}

function isSingleLetterAnswer(value) {
  return normalizeAnswer(value).replace(/\s/g, "").length === 1;
}

export function normalizeAnswer(value) {
  return String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function startsWithLetter(answer, letter) {
  return normalizeAnswer(answer).startsWith(normalizeAnswer(letter));
}

function sanitizeLetters(value, allowDifficultLetters) {
  const source = String(value || ALPHABET)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
  const letters = [];

  for (const char of source) {
    if (!ALPHABET.includes(char)) continue;
    if (!allowDifficultLetters && DIFFICULT_LETTERS.has(char)) continue;
    if (!letters.includes(char)) letters.push(char);
  }

  if (letters.length) return letters.join("");
  return ALPHABET.split("").filter((letter) => allowDifficultLetters || !DIFFICULT_LETTERS.has(letter)).join("");
}

function sanitizeCategoryId(value) {
  const id = String(value || "").trim();
  if (/^[a-zA-Z0-9_-]{3,60}$/.test(id)) return id;
  return `cat-${randomUUID()}`;
}

function sanitizeCategories(categories = DEFAULT_CATEGORIES) {
  const source = Array.isArray(categories) && categories.length ? categories : DEFAULT_CATEGORIES;
  const seen = new Set();
  const clean = [];

  for (const item of source) {
    const rawName = typeof item === "string" ? item : item?.name;
    const name = cleanText(rawName, 42);
    const normalized = normalizeAnswer(name);
    if (!name || seen.has(normalized)) continue;

    seen.add(normalized);
    clean.push({
      id: sanitizeCategoryId(typeof item === "string" ? "" : item?.id),
      name,
      order: clean.length,
    });
  }

  if (clean.length) return clean;
  return DEFAULT_STOP_SETTINGS.categories;
}

export function sanitizeStopSettings(settings = {}, appSettings = DEFAULT_APP_SETTINGS) {
  const allowDifficultLetters = settings.allowDifficultLetters === true;
  const maxPlayers = clamp(
    settings.maxPlayers || DEFAULT_STOP_SETTINGS.maxPlayers,
    1,
    appSettings.maxPlayers || DEFAULT_APP_SETTINGS.maxPlayers
  );

  return {
    gameType: "stop",
    matchName: cleanText(settings.matchName || DEFAULT_STOP_SETTINGS.matchName, 60),
    roundSeconds: clamp(settings.roundSeconds || DEFAULT_STOP_SETTINGS.roundSeconds, 15, 300),
    totalRounds: clamp(settings.totalRounds || DEFAULT_STOP_SETTINGS.totalRounds, 1, appSettings.maxRounds || 50),
    letters: sanitizeLetters(settings.letters, allowDifficultLetters),
    categories: sanitizeCategories(settings.categories),
    basePoints: clamp(settings.basePoints ?? DEFAULT_STOP_SETTINGS.basePoints, 0, 100),
    uniqueBonus: clamp(settings.uniqueBonus ?? DEFAULT_STOP_SETTINGS.uniqueBonus, 0, 100),
    allowDifficultLetters,
    manualValidation: settings.manualValidation !== false,
    maxPlayers,
    isPublic: settings.isPublic !== false,
  };
}

export function createStopRoom({ code, hostSocketId, playerName, playerId, socketId, settings, appSettings }) {
  const id = playerId || socketId;
  return {
    code,
    gameType: "stop",
    hostSocketId: hostSocketId || id,
    status: "lobby",
    settings: sanitizeStopSettings(settings, appSettings),
    players: [{ id, socketId, name: playerName, score: 0, connected: true }],
    roundNumber: 0,
    currentRound: null,
    rounds: [],
    usedLetters: [],
    lastRoundResult: null,
    emptySince: null,
    createdAt: Date.now(),
  };
}

export function updateStopSettings(room, settings, appSettings) {
  if (room.status !== "lobby") {
    throw new Error("As configuracoes do Stop so podem ser alteradas no lobby.");
  }

  room.settings = sanitizeStopSettings({ ...room.settings, ...settings }, appSettings);
  room.settings.maxPlayers = Math.max(room.players.length, room.settings.maxPlayers);
}

function drawLetter(room) {
  const letters = room.settings.letters.split("");
  const unused = letters.filter((letter) => !room.usedLetters.includes(letter));
  const pool = unused.length ? unused : letters;
  const letter = pool[Math.floor(Math.random() * pool.length)];
  room.usedLetters.push(letter);
  return letter;
}

function blankAnswersFor(room, playerId) {
  return Object.fromEntries(room.settings.categories.map((category) => [category.id, ""]));
}

function beginStopRound(room) {
  const now = Date.now();
  const letter = drawLetter(room);

  room.roundNumber += 1;
  room.status = "stop-playing";
  room.currentRound = {
    roundNumber: room.roundNumber,
    letter,
    startedAt: now,
    endedAt: null,
    roundEndsAt: now + room.settings.roundSeconds * 1000,
    stoppedByPlayerId: null,
    stoppedByPlayerName: null,
    stopReason: null,
    answers: {},
    review: {},
    reviewReadyByCategory: {},
    reviewChat: [],
    reviewFinished: false,
    pointsByPlayer: {},
  };
  room.lastRoundResult = null;
}

export function startStopGame(room) {
  if (!["lobby", "stop-finished"].includes(room.status)) {
    throw new Error("A partida Stop ja esta em andamento.");
  }
  if (room.players.length < 1) throw new Error("A partida precisa ter ao menos um jogador.");

  room.players = room.players.map((player) => ({ ...player, score: 0 }));
  room.roundNumber = 0;
  room.rounds = [];
  room.usedLetters = [];
  room.lastRoundResult = null;
  beginStopRound(room);
}

export function submitStopAnswers(room, { socketId, answers = {} }) {
  if (room.status !== "stop-playing" || !room.currentRound) {
    throw new Error("A rodada Stop nao esta aceitando respostas.");
  }

  const player = room.players.find((item) => item.socketId === socketId || item.id === socketId);
  if (!player) throw new Error("Jogador nao encontrado.");

  const nextAnswers = { ...blankAnswersFor(room, player.id), ...(room.currentRound.answers[player.id] || {}) };
  for (const category of room.settings.categories) {
    nextAnswers[category.id] = cleanText(answers[category.id], 80);
  }

  room.currentRound.answers[player.id] = nextAnswers;
  return {
    playerId: player.id,
    playerName: player.name,
    answers: nextAnswers,
    submittedAt: Date.now(),
  };
}

function getHostOverride(previousReview, playerId, categoryId) {
  const previous = previousReview?.[playerId]?.[categoryId];
  return typeof previous?.hostValid === "boolean" ? previous.hostValid : null;
}

function getResponseId(previousReview, playerId, categoryId) {
  return previousReview?.[playerId]?.[categoryId]?.responseId || `resp-${randomUUID()}`;
}

function getPreviousVotes(previousReview, playerId, categoryId) {
  const previous = previousReview?.[playerId]?.[categoryId];
  return previous?.votes && typeof previous.votes === "object" ? previous.votes : {};
}

function summarizeVotes(votes = {}, playerCount = 1) {
  const values = Object.values(votes).filter((value) => typeof value === "boolean");
  const yes = values.filter(Boolean).length;
  const no = values.length - yes;
  const total = values.length;
  const invalidThreshold = Math.max(1, Math.ceil(playerCount / 2));
  const invalidated = no >= invalidThreshold;

  return {
    yes,
    no,
    total,
    invalidThreshold,
    invalidated,
    decided: total > 0,
    finalValid: invalidated ? false : null,
    tied: total > 0 && yes === no,
  };
}

export function recomputeStopReview(room) {
  if (!room.currentRound) return;

  const previousReview = room.currentRound.review || {};
  const review = {};
  const categoryFrequency = new Map();
  const categoryEntries = new Map();

  for (const player of room.players) {
    const playerAnswers = room.currentRound.answers[player.id] || blankAnswersFor(room, player.id);
    review[player.id] = {};

    for (const category of room.settings.categories) {
      const answer = cleanText(playerAnswers[category.id], 80);
      const normalizedAnswer = normalizeAnswer(answer);
      const singleLetter = isSingleLetterAnswer(answer);
      const autoValid = Boolean(normalizedAnswer) && !singleLetter;
      const hostValid = getHostOverride(previousReview, player.id, category.id);
      const responseId = getResponseId(previousReview, player.id, category.id);
      const votes = getPreviousVotes(previousReview, player.id, category.id);
      const voteSummary = summarizeVotes(votes, room.players.length);
      const lockedInvalid = singleLetter || !normalizedAnswer;
      const finalValid = lockedInvalid ? false : voteSummary.finalValid ?? hostValid ?? autoValid;
      const entry = {
        playerId: player.id,
        playerName: player.name,
        responseId,
        categoryId: category.id,
        categoryName: category.name,
        answer,
        normalizedAnswer,
        autoValid,
        hostValid,
        votes,
        voteSummary,
        lockedInvalid,
        finalValid,
        unique: false,
        points: 0,
        reason: !normalizedAnswer ? "vazia" : singleLetter ? "uma letra" : autoValid ? "validavel" : "letra",
      };

      review[player.id][category.id] = entry;
      if (!categoryEntries.has(category.id)) categoryEntries.set(category.id, []);
      categoryEntries.get(category.id).push(entry);

      if (finalValid && normalizedAnswer) {
        const key = `${category.id}:${normalizedAnswer}`;
        categoryFrequency.set(key, (categoryFrequency.get(key) || 0) + 1);
      }
    }
  }

  const pointsByPlayer = {};
  for (const entries of categoryEntries.values()) {
    for (const entry of entries) {
      const count = categoryFrequency.get(`${entry.categoryId}:${entry.normalizedAnswer}`) || 0;
      entry.unique = entry.finalValid && count === 1;
      entry.points = entry.finalValid ? room.settings.basePoints + (entry.unique ? room.settings.uniqueBonus : 0) : 0;
      if (!entry.finalValid) {
        entry.reason = entry.lockedInvalid ? entry.reason : entry.voteSummary.invalidated ? "votacao" : entry.hostValid === false ? "invalidada" : entry.reason;
      } else {
        entry.reason = entry.voteSummary.yes > entry.voteSummary.no ? "votacao" : entry.unique ? "unica" : "repetida";
      }
      pointsByPlayer[entry.playerId] = (pointsByPlayer[entry.playerId] || 0) + entry.points;
    }
  }

  room.currentRound.review = review;
  room.currentRound.pointsByPlayer = pointsByPlayer;
}

export function finishStopRound(room, { stoppedBySocketId = null, reason = "stop" } = {}) {
  if (room.status !== "stop-playing" || !room.currentRound) return;

  const stopper = room.players.find((player) => player.socketId === stoppedBySocketId || player.id === stoppedBySocketId);
  for (const player of room.players) {
    if (!room.currentRound.answers[player.id]) {
      room.currentRound.answers[player.id] = blankAnswersFor(room, player.id);
    }
  }

  room.currentRound.endedAt = Date.now();
  room.currentRound.stoppedByPlayerId = stopper?.id || null;
  room.currentRound.stoppedByPlayerName = stopper?.name || null;
  room.currentRound.stopReason = reason;
  room.currentRound.reviewCategoryIndex = 0;
  room.currentRound.reviewCategoryStartedAt = Date.now();
  room.currentRound.reviewCategoryEndsAt = room.currentRound.reviewCategoryStartedAt + REVIEW_SECONDS_PER_CATEGORY * 1000;
  room.currentRound.reviewComplete = false;
  room.status = "stop-review";
  recomputeStopReview(room);
}

export function callStop(room, { socketId }) {
  const player = room.players.find((item) => item.socketId === socketId || item.id === socketId);
  if (!player) throw new Error("Jogador nao encontrado.");

  const playerAnswers = room.currentRound?.answers?.[player.id] || {};
  const filledCount = room.settings.categories.filter((category) => {
    const answer = cleanText(playerAnswers[category.id]);
    return answer && !isSingleLetterAnswer(answer);
  }).length;

  if (filledCount < room.settings.categories.length) {
    throw new Error("Preencha todos os temas com respostas validas antes de pedir STOP.");
  }

  finishStopRound(room, { stoppedBySocketId: player.id, reason: "stop" });
}

function getActiveReviewCategory(room) {
  return room.settings.categories[room.currentRound?.reviewCategoryIndex || 0] || null;
}

function getConnectedReviewPlayerIds(room) {
  return room.players
    .filter((player) => player.connected !== false)
    .map((player) => player.id);
}

function getActiveReviewReadySet(room) {
  const category = getActiveReviewCategory(room);
  if (!category || !room.currentRound) return new Set();
  const readyByCategory = room.currentRound.reviewReadyByCategory || {};
  return new Set(Array.isArray(readyByCategory[category.id]) ? readyByCategory[category.id] : []);
}

function setActiveReviewReadySet(room, readySet) {
  const category = getActiveReviewCategory(room);
  if (!category || !room.currentRound) return;
  room.currentRound.reviewReadyByCategory = {
    ...(room.currentRound.reviewReadyByCategory || {}),
    [category.id]: [...readySet],
  };
}

function getActiveReviewReadiness(room) {
  if (room.status !== "stop-review" || !room.currentRound || room.currentRound.reviewComplete) {
    return { count: 0, total: 0, playerIds: [] };
  }

  const connectedIds = new Set(getConnectedReviewPlayerIds(room));
  const playerIds = [...getActiveReviewReadySet(room)].filter((id) => connectedIds.has(id));
  return {
    count: playerIds.length,
    total: connectedIds.size,
    playerIds,
  };
}

function findReviewEntry(room, { responseId, playerId, categoryId }) {
  const activeCategory = getActiveReviewCategory(room);
  const targetCategoryId = categoryId || activeCategory?.id;
  if (!targetCategoryId) return null;

  if (responseId) {
    for (const player of room.players) {
      const entry = room.currentRound.review?.[player.id]?.[targetCategoryId];
      if (entry?.responseId === responseId) return entry;
    }
  }

  return playerId ? room.currentRound.review?.[playerId]?.[targetCategoryId] : null;
}

export function validateStopAnswer(room, { voterSocketId, responseId, playerId, categoryId, valid }) {
  if (room.status !== "stop-review" || !room.currentRound) {
    throw new Error("A rodada nao esta em revisao.");
  }
  if (room.currentRound.reviewComplete || room.currentRound.reviewFinished) {
    throw new Error("A votacao desta rodada ja foi encerrada.");
  }
  if (!room.settings.manualValidation) {
    throw new Error("A validacao manual esta desativada nesta partida.");
  }

  const voter = room.players.find((player) => player.socketId === voterSocketId || player.id === voterSocketId);
  if (!voter) throw new Error("Jogador nao encontrado.");

  const entry = findReviewEntry(room, { responseId, playerId, categoryId });
  if (!entry) throw new Error("Resposta nao encontrada.");
  if (entry.categoryId !== getActiveReviewCategory(room)?.id) {
    throw new Error("Esta resposta nao pertence ao tema em votacao.");
  }
  if (entry.lockedInvalid) {
    throw new Error("Esta resposta foi desconsiderada automaticamente.");
  }

  entry.votes = { ...(entry.votes || {}), [voter.id]: Boolean(valid) };
  recomputeStopReview(room);
}

export function markStopReviewReady(room, { socketId }) {
  if (room.status !== "stop-review" || !room.currentRound) {
    throw new Error("A rodada nao esta em revisao.");
  }
  if (room.currentRound.reviewComplete || room.currentRound.reviewFinished) {
    throw new Error("A revisao desta rodada ja foi encerrada.");
  }

  const player = room.players.find((item) => item.socketId === socketId || item.id === socketId);
  if (!player) throw new Error("Jogador nao encontrado.");

  const readySet = getActiveReviewReadySet(room);
  readySet.add(player.id);
  setActiveReviewReadySet(room, readySet);

  const connectedPlayerIds = getConnectedReviewPlayerIds(room);
  if (connectedPlayerIds.length && connectedPlayerIds.every((id) => readySet.has(id))) {
    return advanceStopReviewCategory(room);
  }

  return false;
}

export function addStopReviewChatMessage(room, { socketId, message }) {
  if (room.status !== "stop-review" || !room.currentRound) {
    throw new Error("O chat esta disponivel apenas durante a revisao.");
  }

  const player = room.players.find((item) => item.socketId === socketId || item.id === socketId);
  if (!player) throw new Error("Jogador nao encontrado.");

  const text = cleanText(message, REVIEW_CHAT_MESSAGE_LIMIT);
  if (!text) throw new Error("Digite uma mensagem.");

  const category = getActiveReviewCategory(room);
  const chatMessage = {
    id: `chat-${randomUUID()}`,
    playerId: player.id,
    playerName: player.name,
    text,
    categoryId: category?.id || null,
    categoryName: category?.name || null,
    createdAt: Date.now(),
  };

  const currentChat = Array.isArray(room.currentRound.reviewChat) ? room.currentRound.reviewChat : [];
  room.currentRound.reviewChat = [...currentChat, chatMessage].slice(-REVIEW_CHAT_LIMIT);
  return chatMessage;
}

export function advanceStopReviewCategory(room) {
  if (room.status !== "stop-review" || !room.currentRound || room.currentRound.reviewComplete) return false;

  const nextIndex = (room.currentRound.reviewCategoryIndex || 0) + 1;
  if (nextIndex >= room.settings.categories.length) {
    room.currentRound.reviewComplete = true;
    room.currentRound.reviewCategoryStartedAt = null;
    room.currentRound.reviewCategoryEndsAt = null;
    recomputeStopReview(room);
    return true;
  }

  const now = Date.now();
  room.currentRound.reviewCategoryIndex = nextIndex;
  room.currentRound.reviewCategoryStartedAt = now;
  room.currentRound.reviewCategoryEndsAt = now + REVIEW_SECONDS_PER_CATEGORY * 1000;
  recomputeStopReview(room);
  return true;
}

export function finishStopReview(room) {
  if (room.status !== "stop-review" || !room.currentRound) {
    throw new Error("A rodada nao esta em revisao.");
  }
  if (room.currentRound.reviewFinished) return;
  if (!room.currentRound.reviewComplete) {
    throw new Error("A votacao por tema ainda nao terminou.");
  }

  recomputeStopReview(room);
  for (const player of room.players) {
    player.score += room.currentRound.pointsByPlayer[player.id] || 0;
  }

  room.currentRound.reviewFinished = true;
  room.lastRoundResult = {
    roundNumber: room.currentRound.roundNumber,
    letter: room.currentRound.letter,
    stoppedByPlayerName: room.currentRound.stoppedByPlayerName,
    pointsByPlayer: room.currentRound.pointsByPlayer,
    ranking: [...room.players].sort((a, b) => b.score - a.score),
    finishedAt: Date.now(),
  };
  room.rounds.push(room.currentRound);

  if (room.roundNumber >= room.settings.totalRounds) {
    room.status = "stop-finished";
  }
}

export function nextStopRound(room) {
  if (room.status === "stop-finished") return;
  if (room.status !== "stop-review" || !room.currentRound?.reviewFinished) {
    throw new Error("Confirme a revisao antes de avancar.");
  }
  if (room.roundNumber >= room.settings.totalRounds) {
    room.status = "stop-finished";
    return;
  }

  beginStopRound(room);
}

function getAnsweredPlayers(room) {
  const answers = room.currentRound?.answers || {};
  return room.players
    .filter((player) => {
      const playerAnswers = answers[player.id] || {};
      return room.settings.categories.some((category) => cleanText(playerAnswers[category.id]));
    })
    .map((player) => player.id);
}

function getActiveReviewResponses(room) {
  if (room.status !== "stop-review" || !room.currentRound || room.currentRound.reviewComplete) return [];
  const category = getActiveReviewCategory(room);
  if (!category) return [];

  return room.players.map((player) => {
    const entry = room.currentRound.review?.[player.id]?.[category.id];
    return entry ? {
      responseId: entry.responseId,
      answer: entry.answer,
      categoryId: entry.categoryId,
        autoValid: entry.autoValid,
        finalValid: entry.finalValid,
        lockedInvalid: entry.lockedInvalid,
        reason: entry.reason,
      voteSummary: entry.voteSummary,
    } : null;
  })
    .filter(Boolean)
    .sort((a, b) => a.responseId.localeCompare(b.responseId))
    .map((entry, index) => ({ ...entry, label: `Resposta ${index + 1}` }));
}

function publicReview(review = {}) {
  return Object.fromEntries(Object.entries(review).map(([playerId, categories]) => [
    playerId,
    Object.fromEntries(Object.entries(categories || {}).map(([categoryId, entry]) => {
      const { votes, ...safeEntry } = entry;
      return [categoryId, safeEntry];
    })),
  ]));
}

function publicCurrentRound(room) {
  if (!room.currentRound) return null;

  const { review, answers, reviewReadyByCategory, ...safeRound } = room.currentRound;
  const shouldRevealFullReview = room.currentRound.reviewComplete || room.currentRound.reviewFinished || room.status === "stop-finished";

  return {
    ...safeRound,
    answers: shouldRevealFullReview || room.status === "stop-playing" ? answers : undefined,
    review: shouldRevealFullReview ? publicReview(review) : undefined,
  };
}

export function getPublicStopRoom(room) {
  const reviewReadiness = getActiveReviewReadiness(room);
  const reviewChat = room.status === "stop-review" && Array.isArray(room.currentRound?.reviewChat)
    ? room.currentRound.reviewChat
    : [];

  return {
    code: room.code,
    gameType: "stop",
    hostSocketId: room.hostSocketId,
    status: room.status,
    settings: room.settings,
    players: room.players,
    roundNumber: room.roundNumber,
    totalRounds: room.settings.totalRounds,
    currentRound: publicCurrentRound(room),
    currentAnswers: room.status === "stop-playing" ? room.currentRound?.answers || {} : {},
    answeredPlayers: getAnsweredPlayers(room),
    activeReviewCategory: getActiveReviewCategory(room),
    reviewCategoryIndex: room.currentRound?.reviewCategoryIndex ?? null,
    reviewCategoryTotal: room.settings.categories.length,
    reviewEndsAt: room.currentRound?.reviewCategoryEndsAt || null,
    reviewReadyCount: reviewReadiness.count,
    reviewReadyTotal: reviewReadiness.total,
    reviewReadyPlayerIds: reviewReadiness.playerIds,
    reviewChat,
    reviewResponses: getActiveReviewResponses(room),
    roundStartedAt: room.currentRound?.startedAt || null,
    roundEndsAt: room.currentRound?.roundEndsAt || null,
    lastRoundResult: room.lastRoundResult,
    roundResults: room.rounds.map((round) => ({
      roundNumber: round.roundNumber,
      letter: round.letter,
      pointsByPlayer: round.pointsByPlayer,
      stoppedByPlayerName: round.stoppedByPlayerName,
      reviewFinished: round.reviewFinished,
    })),
    ranking: [...room.players].sort((a, b) => b.score - a.score),
  };
}
