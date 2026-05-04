import { prisma } from "./db.js";

let warningShown = false;
const FINAL_ROOM_STATUSES = new Set(["empty", "finished", "stop-finished", "ludo-finished"]);

export function hasDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

async function persist(label, operation, fallback = null) {
  if (!hasDatabase()) return fallback;

  try {
    return await operation();
  } catch (error) {
    if (!warningShown) {
      console.warn(`Persistencia PostgreSQL indisponivel (${label}): ${error.message}`);
      warningShown = true;
    }
    return fallback;
  }
}

function dateFromTimestamp(timestamp) {
  return timestamp ? new Date(timestamp) : undefined;
}

function serializeQuestion(question) {
  return {
    id: question.id,
    category: question.category,
    difficulty: question.difficulty,
    question: question.question,
    options: question.options,
    answer: question.answer,
  };
}

function serializeDeck(room) {
  if (room.gameType === "stop") {
    return {
      currentRound: room.currentRound,
      rounds: room.rounds || [],
      usedLetters: room.usedLetters || [],
    };
  }

  if (room.gameType === "ludo") {
    return {
      pieces: room.pieces || [],
      currentTurnPlayerId: room.currentTurnPlayerId || null,
      turnPhase: room.turnPhase || null,
      turnDeadlineAt: room.turnDeadlineAt || null,
      turnDurationMs: room.turnDurationMs || null,
      dice: room.dice || null,
      legalMoves: room.legalMoves || [],
      lastAction: room.lastAction || null,
      winner: room.winner || null,
    };
  }

  return (room.questions || []).map(serializeQuestion);
}

function serializeHistory(room) {
  if (room.gameType === "stop") return room.rounds || [];
  if (room.gameType === "ludo") {
    return {
      ranking: room.ranking || [],
      reactions: room.reactions || [],
      speechBubbles: room.speechBubbles || {},
      lastAction: room.lastAction || null,
    };
  }
  return room.history || [];
}

async function upsertRoom(room) {
  const dbRoom = await prisma.room.upsert({
    where: { code: room.code },
    update: {
      status: room.status,
      hostSocketId: room.hostSocketId,
      gameType: room.gameType || "quiz",
      settings: room.settings,
    },
    create: {
      code: room.code,
      status: room.status,
      hostSocketId: room.hostSocketId,
      gameType: room.gameType || "quiz",
      settings: room.settings,
    },
    select: { id: true },
  });

  room.dbRoomId = dbRoom.id;
  return dbRoom.id;
}

async function resolveRoomId(room) {
  if (room.dbRoomId) return room.dbRoomId;

  const dbRoom = await prisma.room.findUnique({
    where: { code: room.code },
    select: { id: true },
  });

  if (dbRoom) {
    room.dbRoomId = dbRoom.id;
    return dbRoom.id;
  }

  return upsertRoom(room);
}

async function upsertPlayer(roomId, player) {
  return prisma.player.upsert({
    where: {
      roomId_socketId: {
        roomId,
        socketId: player.id,
      },
    },
    update: {
      accountId: player.accountId || null,
      name: player.name,
      score: player.score || 0,
      connected: player.connected ?? true,
    },
    create: {
      roomId,
      accountId: player.accountId || null,
      socketId: player.id,
      name: player.name,
      score: player.score || 0,
      connected: player.connected ?? true,
    },
    select: { id: true },
  });
}

function scoreForPlayer(room, player) {
  if (room.gameType !== "ludo") return Number(player.score || 0);
  const finishedPieces = (room.pieces || []).filter((piece) => piece.playerId === player.id && piece.state === "finished").length;
  return Math.max(Number(player.score || 0), finishedPieces);
}

function getSummaryRanking(room) {
  const ranking = Array.isArray(room.ranking) && room.ranking.length
    ? room.ranking
    : Array.isArray(room.lastRoundResult?.ranking) && room.lastRoundResult.ranking.length
      ? room.lastRoundResult.ranking
      : [...(room.players || [])].sort((a, b) => scoreForPlayer(room, b) - scoreForPlayer(room, a));
  const scoreById = new Map((room.players || []).map((player) => [player.id, scoreForPlayer(room, player)]));
  return ranking.map((player, index) => ({
    ...player,
    rank: index + 1,
    score: scoreById.get(player.id) ?? Number(player.score || 0),
  }));
}

function getRoundsPlayed(room) {
  if (room.gameType === "stop") return (room.rounds || []).length || room.roundNumber || 0;
  if (room.gameType === "ludo") return room.status === "ludo-finished" ? 1 : 0;
  return room.roundNumber || 0;
}

async function persistMatchSummaries(room, roomId, sessionId) {
  if (!sessionId || !FINAL_ROOM_STATUSES.has(room.status)) return;
  const ranking = getSummaryRanking(room);
  const winnerId = ranking[0]?.id || null;
  const finishedAt = new Date();
  const roundsPlayed = getRoundsPlayed(room);

  for (const rankedPlayer of ranking) {
    const player = (room.players || []).find((item) => item.id === rankedPlayer.id) || rankedPlayer;
    if (!player.accountId) continue;

    await prisma.playerMatchSummary.upsert({
      where: {
        accountId_sessionId: {
          accountId: player.accountId,
          sessionId,
        },
      },
      update: {
        roomId,
        roomCode: room.code,
        gameType: room.gameType || "quiz",
        matchName: room.settings?.matchName || null,
        status: room.status,
        score: rankedPlayer.score,
        rank: rankedPlayer.rank,
        won: rankedPlayer.id === winnerId,
        roundsPlayed,
        finishedAt,
      },
      create: {
        accountId: player.accountId,
        sessionId,
        roomId,
        roomCode: room.code,
        gameType: room.gameType || "quiz",
        matchName: room.settings?.matchName || null,
        status: room.status,
        score: rankedPlayer.score,
        rank: rankedPlayer.rank,
        won: rankedPlayer.id === winnerId,
        roundsPlayed,
        finishedAt,
      },
    });
  }
}

async function syncPlayers(room, roomId) {
  for (const player of room.players) {
    await upsertPlayer(roomId, player);
  }
}

async function createSession(room, roomId) {
  const session = await prisma.gameSession.create({
    data: {
      roomId,
      gameType: room.gameType || "quiz",
      status: room.status,
      currentIndex: room.currentIndex ?? room.roundNumber ?? 0,
      deck: serializeDeck(room),
      settings: room.settings,
      history: serializeHistory(room),
      startedAt: dateFromTimestamp(room.roundStartedAt || room.currentRound?.startedAt),
    },
    select: { id: true },
  });

  room.dbSessionId = session.id;
  return session.id;
}

async function resolveSessionId(room, roomId) {
  if (room.dbSessionId) return room.dbSessionId;

  const session = await prisma.gameSession.findFirst({
    where: { roomId, finishedAt: null },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  if (session) {
    room.dbSessionId = session.id;
    return session.id;
  }

  if (!["stop", "ludo"].includes(room.gameType) && !room.questions.length) return null;
  return createSession(room, roomId);
}

export async function persistRoomCreated(room) {
  return persist("room:create", async () => {
    const roomId = await upsertRoom(room);
    await syncPlayers(room, roomId);
    return roomId;
  });
}

export async function persistPlayerJoined(room, player) {
  return persist("room:join", async () => {
    const roomId = await resolveRoomId(room);
    return upsertPlayer(roomId, player);
  });
}

export async function persistSettingsUpdated(room) {
  return persist("room:settings", async () => {
    await upsertRoom(room);
  });
}

export async function persistGameStarted(room) {
  return persist("game:start", async () => {
    const roomId = await upsertRoom(room);
    await syncPlayers(room, roomId);
    return createSession(room, roomId);
  });
}

export async function persistAnswerSubmitted(room, answer) {
  if (!answer) return null;

  return persist("answer:submit", async () => {
    const roomId = await resolveRoomId(room);
    const sessionId = await resolveSessionId(room, roomId);
    if (!sessionId) return null;

    const player =
      room.players.find((item) => item.id === answer.playerId) ||
      { id: answer.playerId, name: answer.playerName, score: 0, connected: true };
    const dbPlayer = await upsertPlayer(roomId, player);

    await prisma.$transaction([
      prisma.gameAnswer.create({
        data: {
          sessionId,
          playerId: dbPlayer.id,
          questionId: answer.questionId,
          selectedOption: answer.option,
          correct: answer.correct,
          points: answer.points,
          secondsLeft: answer.secondsLeft,
          answeredAt: dateFromTimestamp(answer.answeredAt) || new Date(),
        },
      }),
      prisma.player.update({
        where: { id: dbPlayer.id },
        data: {
          score: player.score || 0,
          connected: player.connected ?? true,
        },
      }),
    ]);

    return true;
  });
}

export async function persistGameProgress(room) {
  return persist("game:progress", async () => {
    const roomId = await resolveRoomId(room);
    await syncPlayers(room, roomId);

    const sessionId = await resolveSessionId(room, roomId);
    if (!sessionId) return null;

    await prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        status: room.status,
        currentIndex: room.currentIndex ?? room.roundNumber ?? 0,
        deck: serializeDeck(room),
        settings: room.settings,
        history: serializeHistory(room),
        finishedAt: FINAL_ROOM_STATUSES.has(room.status) ? new Date() : undefined,
      },
    });

    await persistMatchSummaries(room, roomId, sessionId);
    return true;
  });
}

export async function persistPlayerDisconnected(room, socketId) {
  return persist("player:disconnect", async () => {
    const roomId = await resolveRoomId(room);
    await prisma.player.updateMany({
      where: { roomId, socketId },
      data: { connected: false },
    });
    await upsertRoom(room);
  });
}

export async function persistRoomEmptied(room) {
  return persist("room:empty", async () => {
    const roomId = await resolveRoomId(room);
    await prisma.room.update({
      where: { id: roomId },
      data: { status: "empty" },
    });
  });
}

function restorePlayers(players = []) {
  return players.map((player) => ({
    id: player.socketId,
    socketId: null,
    accountId: player.accountId || null,
    name: player.name,
    score: player.score || 0,
    connected: false,
  }));
}

function getRestoredSession(roomRecord) {
  return Array.isArray(roomRecord.sessions) ? roomRecord.sessions[0] : null;
}

function baseRestoredRoom(roomRecord) {
  const players = restorePlayers(roomRecord.players || []);
  const session = getRestoredSession(roomRecord);
  return {
    code: roomRecord.code,
    gameType: roomRecord.gameType || "quiz",
    hostSocketId: roomRecord.hostSocketId,
    status: roomRecord.status,
    settings: roomRecord.settings || {},
    players,
    dbRoomId: roomRecord.id,
    dbSessionId: session?.id || null,
    emptySince: roomRecord.updatedAt?.getTime?.() || Date.now(),
    createdAt: roomRecord.createdAt?.getTime?.() || Date.now(),
  };
}

function restoreQuizRoom(roomRecord) {
  const session = getRestoredSession(roomRecord);
  const history = Array.isArray(session?.history) ? session.history : [];
  return {
    ...baseRestoredRoom(roomRecord),
    questions: Array.isArray(session?.deck) ? session.deck : [],
    currentIndex: session?.currentIndex || 0,
    currentAnswers: {},
    history,
    roundNumber: history.length ? 1 : 0,
    roundResults: [],
    lastRoundResult: null,
    usedQuestionIds: new Set(),
    roundStartedAt: session?.startedAt?.getTime?.() || null,
    roundEndsAt: null,
    revealAt: null,
  };
}

function restoreStopRoom(roomRecord) {
  const session = getRestoredSession(roomRecord);
  const deck = session?.deck && typeof session.deck === "object" ? session.deck : {};
  const rounds = Array.isArray(deck.rounds) ? deck.rounds : [];
  const currentRound = deck.currentRound || null;
  return {
    ...baseRestoredRoom(roomRecord),
    roundNumber: currentRound?.roundNumber || rounds.length || session?.currentIndex || 0,
    currentRound,
    rounds,
    usedLetters: Array.isArray(deck.usedLetters) ? deck.usedLetters : [],
    lastRoundResult: rounds.length ? {
      roundNumber: rounds[rounds.length - 1].roundNumber,
      letter: rounds[rounds.length - 1].letter,
      pointsByPlayer: rounds[rounds.length - 1].pointsByPlayer || {},
      ranking: [],
      finishedAt: rounds[rounds.length - 1].endedAt || Date.now(),
    } : null,
  };
}

function restoreLudoRoom(roomRecord) {
  const session = getRestoredSession(roomRecord);
  const deck = session?.deck && typeof session.deck === "object" ? session.deck : {};
  const history = session?.history && typeof session.history === "object" ? session.history : {};
  return {
    ...baseRestoredRoom(roomRecord),
    pieces: Array.isArray(deck.pieces) ? deck.pieces : [],
    currentTurnPlayerId: deck.currentTurnPlayerId || null,
    turnIndex: 0,
    dice: deck.dice || { value: null, rolled: false, rollingPlayerId: null },
    legalMoves: Array.isArray(deck.legalMoves) ? deck.legalMoves : [],
    turnSixStreak: 0,
    lastAction: deck.lastAction || history.lastAction || null,
    turnPhase: deck.turnPhase || null,
    turnDeadlineAt: deck.turnDeadlineAt || null,
    turnDurationMs: deck.turnDurationMs || null,
    turnActionCounter: 0,
    turnActionToken: null,
    winner: deck.winner || null,
    ranking: Array.isArray(history.ranking) ? history.ranking : [],
    reactions: Array.isArray(history.reactions) ? history.reactions : [],
    speechBubbles: history.speechBubbles || {},
  };
}

function restoreRoom(roomRecord) {
  if (roomRecord.gameType === "stop") return restoreStopRoom(roomRecord);
  if (roomRecord.gameType === "ludo") return restoreLudoRoom(roomRecord);
  return restoreQuizRoom(roomRecord);
}

export async function restoreActiveRooms({ maxAgeMs } = {}) {
  const cutoff = new Date(Date.now() - (maxAgeMs || 30 * 60 * 1000));
  return persist("room:restore", async () => {
    const roomRecords = await prisma.room.findMany({
      where: {
        status: { notIn: [...FINAL_ROOM_STATUSES] },
        updatedAt: { gte: cutoff },
      },
      include: {
        players: true,
        sessions: {
          where: { finishedAt: null },
          orderBy: { updatedAt: "desc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    });

    return roomRecords.map(restoreRoom);
  }, []);
}
