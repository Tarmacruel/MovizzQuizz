import { prisma } from "./db.js";

let warningShown = false;

function hasDatabase() {
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
      name: player.name,
      score: player.score || 0,
      connected: player.connected ?? true,
    },
    create: {
      roomId,
      socketId: player.id,
      name: player.name,
      score: player.score || 0,
      connected: player.connected ?? true,
    },
    select: { id: true },
  });
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
        finishedAt: ["round_finished", "finished", "stop-finished", "ludo-finished"].includes(room.status) ? new Date() : undefined,
      },
    });

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
