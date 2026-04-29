import "dotenv/config";
import express from "express";
import http from "http";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { Server } from "socket.io";
import { customAlphabet } from "nanoid";
import { randomUUID } from "crypto";
import fallbackQuestions from "../data/questions.js";
import { prisma } from "./db.js";
import { DEFAULT_APP_SETTINGS, sanitizeAppSettings } from "./appSettings.js";
import { hashPassword, makeToken, verifyPassword } from "./security.js";
import {
  createRoom,
  getPublicRoom,
  joinRoom,
  removePlayerBySocket,
  startGame,
  submitAnswer,
  advanceRound,
  updateSettings,
} from "./gameEngine.js";
import {
  persistAnswerSubmitted,
  persistGameProgress,
  persistGameStarted,
  persistPlayerDisconnected,
  persistPlayerJoined,
  persistRoomCreated,
  persistRoomEmptied,
  persistSettingsUpdated,
} from "./persistence.js";

const PORT = process.env.PORT || 8001;
const DEFAULT_CLIENT_ORIGINS = [
  "http://localhost:5180",
  "http://localhost:8001",
  "https://quizz.sirel.com.br",
];
const CLIENT_ORIGINS = [
  ...new Set([
    ...DEFAULT_CLIENT_ORIGINS,
    ...(process.env.CLIENT_ORIGIN || "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  ]),
];
const makeCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 5);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDistPath = path.resolve(__dirname, "../../client/dist");

let questionBank = fallbackQuestions;
let questionSource = "local-fallback";
let appSettings = DEFAULT_APP_SETTINGS;
const adminSessions = new Map();

const app = express();
app.use(cors({
  origin(origin, callback) {
    if (!origin || CLIENT_ORIGINS.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
}));
app.use(express.json());

const rooms = new Map();

function getAuthToken(req) {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7) : "";
}

function requireAdmin(req, res, next) {
  const token = getAuthToken(req);
  const session = adminSessions.get(token);

  if (!session) {
    return res.status(401).json({ message: "Login admin obrigatório." });
  }

  req.admin = session;
  return next();
}

function getRoomSummary(room, { revealCode = true } = {}) {
  return {
    code: revealCode ? room.code : null,
    status: room.status,
    isPublic: room.settings.isPublic,
    playerCount: room.players.length,
    maxPlayers: room.settings.maxPlayers,
    totalQuestions: room.settings.totalQuestions,
    secondsPerQuestion: room.settings.secondsPerQuestion,
    roundLimit: room.settings.roundLimit,
    roundNumber: room.roundNumber,
    categories: room.settings.categories,
    difficulties: room.settings.difficulties,
    createdAt: room.createdAt,
  };
}

function normalizeQuestion(question) {
  return {
    id: question.id,
    category: question.category,
    difficulty: question.difficulty,
    question: question.question,
    options: Array.isArray(question.options) ? question.options : [],
    answer: question.answer,
  };
}

async function loadQuestionBank() {
  if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL nao configurada; usando fallback local de perguntas.");
    return { questions: fallbackQuestions, source: "local-fallback" };
  }

  try {
    const dbQuestions = await prisma.question.findMany({
      where: { active: true },
      orderBy: { id: "asc" },
    });

    if (dbQuestions.length > 0) {
      return {
        questions: dbQuestions.map(normalizeQuestion),
        source: "postgres",
      };
    }

    console.warn("Banco sem perguntas ativas; usando fallback local de perguntas.");
  } catch (error) {
    console.warn(`Usando fallback local de perguntas: ${error.message}`);
  }

  return { questions: fallbackQuestions, source: "local-fallback" };
}

async function loadAppSettings() {
  if (!process.env.DATABASE_URL) return DEFAULT_APP_SETTINGS;

  try {
    const settings = await prisma.appSetting.findUnique({
      where: { key: "game" },
    });

    return sanitizeAppSettings(settings?.value || DEFAULT_APP_SETTINGS);
  } catch (error) {
    console.warn(`Usando parâmetros padrão: ${error.message}`);
    return DEFAULT_APP_SETTINGS;
  }
}

async function refreshQuestionBank() {
  const loadedBank = await loadQuestionBank();
  questionBank = loadedBank.questions;
  questionSource = loadedBank.source;
}

function validateQuestionPayload(payload = {}) {
  const category = String(payload.category || "").trim().slice(0, 80);
  const difficulty = String(payload.difficulty || "").trim().slice(0, 40);
  const question = String(payload.question || "").trim().slice(0, 600);
  const options = Array.isArray(payload.options)
    ? payload.options.map((option) => String(option || "").trim()).filter(Boolean).slice(0, 4)
    : [];
  const answer = String(payload.answer || "").trim();
  const active = payload.active !== false;

  if (!category) throw new Error("Informe a categoria.");
  if (!difficulty) throw new Error("Informe a dificuldade.");
  if (!question) throw new Error("Informe o enunciado.");
  if (options.length !== 4 || new Set(options).size !== 4) throw new Error("Informe 4 alternativas únicas.");
  if (!options.includes(answer)) throw new Error("A resposta correta precisa estar entre as alternativas.");

  return { category, difficulty, question, options, answer, active };
}

function leaveRoom(socket, code) {
  const room = rooms.get(code);
  if (!room) return;

  const removed = removePlayerBySocket(room, socket.id);
  if (!removed) return;

  socket.leave(code);

  if (room.players.length === 0) {
    void (async () => {
      await persistPlayerDisconnected(room, socket.id);
      await persistRoomEmptied(room);
    })();
    rooms.delete(code);
    return;
  }

  if (room.hostSocketId === socket.id) {
    room.hostSocketId = room.players[0].id;
  }

  void persistPlayerDisconnected(room, socket.id);
  emitRoom(code);
}

app.get("/health", (_, res) => {
  res.json({
    ok: true,
    rooms: rooms.size,
    questions: questionBank.length,
    questionSource,
  });
});

app.get("/questions/meta", (_, res) => {
  const categories = [...new Set(questionBank.map((q) => q.category))];
  const difficulties = [...new Set(questionBank.map((q) => q.difficulty))];
  res.json({ total: questionBank.length, categories, difficulties, source: questionSource, settings: appSettings });
});

app.get("/app-settings", (_, res) => {
  res.json(appSettings);
});

app.get("/rooms", (_, res) => {
  const lobbyRooms = [...rooms.values()]
    .filter((room) => room.status === "lobby")
    .sort((a, b) => b.createdAt - a.createdAt);

  res.json({
    publicRooms: lobbyRooms
      .filter((room) => room.settings.isPublic)
      .map((room) => getRoomSummary(room)),
    privateRooms: lobbyRooms
      .filter((room) => !room.settings.isPublic)
      .map((room) => getRoomSummary(room, { revealCode: false })),
  });
});

app.post("/admin/login", async (req, res) => {
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ message: "Banco de dados indisponível para login admin." });
  }

  const username = String(req.body?.username || "").trim();
  const password = String(req.body?.password || "");
  const user = await prisma.adminUser.findUnique({ where: { username } });

  if (!user || !user.active || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ message: "Usuário ou senha inválidos." });
  }

  const token = makeToken();
  adminSessions.set(token, { id: user.id, username: user.username });
  res.json({ token, user: { id: user.id, username: user.username } });
});

app.get("/admin/me", requireAdmin, (req, res) => {
  res.json({ user: req.admin });
});

app.get("/admin/settings", requireAdmin, (_, res) => {
  res.json(appSettings);
});

app.put("/admin/settings", requireAdmin, async (req, res) => {
  const nextSettings = sanitizeAppSettings({ ...appSettings, ...req.body });
  await prisma.appSetting.upsert({
    where: { key: "game" },
    update: { value: nextSettings },
    create: { key: "game", value: nextSettings },
  });
  appSettings = nextSettings;
  res.json(appSettings);
});

app.get("/admin/questions", requireAdmin, async (req, res) => {
  const search = String(req.query.search || "").trim();
  const category = String(req.query.category || "").trim();
  const take = Math.max(1, Math.min(Number(req.query.take || 50), 100));
  const where = {
    ...(category ? { category } : {}),
    ...(search
      ? {
          OR: [
            { question: { contains: search, mode: "insensitive" } },
            { answer: { contains: search, mode: "insensitive" } },
            { category: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.question.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take,
    }),
    prisma.question.count({ where }),
  ]);

  res.json({ items, total });
});

app.post("/admin/questions", requireAdmin, async (req, res) => {
  try {
    const data = validateQuestionPayload(req.body);
    const question = await prisma.question.create({
      data: {
        id: `custom-${randomUUID()}`,
        ...data,
      },
    });
    await refreshQuestionBank();
    res.status(201).json(question);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.put("/admin/questions/:id", requireAdmin, async (req, res) => {
  try {
    const data = validateQuestionPayload(req.body);
    const question = await prisma.question.update({
      where: { id: req.params.id },
      data,
    });
    await refreshQuestionBank();
    res.json(question);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get("/admin/users", requireAdmin, async (_, res) => {
  const users = await prisma.adminUser.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, username: true, active: true, createdAt: true },
  });
  res.json({ users });
});

app.post("/admin/users", requireAdmin, async (req, res) => {
  const username = String(req.body?.username || "").trim();
  const password = String(req.body?.password || "");

  if (!username || password.length < 8) {
    return res.status(400).json({ message: "Informe usuário e senha com pelo menos 8 caracteres." });
  }

  try {
    const user = await prisma.adminUser.create({
      data: {
        username,
        passwordHash: hashPassword(password),
        active: true,
      },
      select: { id: true, username: true, active: true, createdAt: true },
    });

    res.status(201).json(user);
  } catch {
    res.status(400).json({ message: "Não foi possível criar o admin. Verifique se o usuário já existe." });
  }
});

if (process.env.NODE_ENV === "production") {
  app.use(express.static(clientDistPath));
  app.get("*", (_, res) => {
    res.sendFile(path.join(clientDistPath, "index.html"));
  });
}

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGINS,
    methods: ["GET", "POST"],
  },
});

function emitRoom(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return;
  io.to(roomCode).emit("room:update", getPublicRoom(room));
}

function emitError(socket, message) {
  socket.emit("room:error", { message });
}

io.on("connection", (socket) => {
  socket.on("room:create", ({ playerName, settings } = {}) => {
    const cleanName = String(playerName || "").trim().slice(0, 24);
    if (!cleanName) return emitError(socket, "Informe o nome do jogador.");

    let code = makeCode();
    while (rooms.has(code)) code = makeCode();

    const room = createRoom({
      code,
      hostSocketId: socket.id,
      playerName: cleanName,
      socketId: socket.id,
      settings,
      questionBank,
      appSettings,
    });

    rooms.set(code, room);
    socket.join(code);
    void persistRoomCreated(room);
    socket.emit("room:joined", { roomCode: code, playerId: socket.id });
    emitRoom(code);
  });

  socket.on("room:join", ({ roomCode, playerName } = {}) => {
    const code = String(roomCode || "").trim().toUpperCase();
    const cleanName = String(playerName || "").trim().slice(0, 24);
    const room = rooms.get(code);

    if (!room) return emitError(socket, "Sala nao encontrada.");
    if (!cleanName) return emitError(socket, "Informe o nome do jogador.");
    if (!["lobby", "round_finished"].includes(room.status)) return emitError(socket, "Esta partida já começou.");

    try {
      const player = joinRoom(room, { socketId: socket.id, playerName: cleanName });
      socket.join(code);
      void persistPlayerJoined(room, player);
      socket.emit("room:joined", { roomCode: code, playerId: socket.id });
      emitRoom(code);
    } catch (error) {
      emitError(socket, error.message);
    }
  });

  socket.on("room:settings", ({ roomCode, settings } = {}) => {
    const room = rooms.get(String(roomCode || "").toUpperCase());
    if (!room) return;
    if (room.hostSocketId !== socket.id) return emitError(socket, "Apenas o host pode alterar a partida.");
    updateSettings(room, settings, questionBank, appSettings);
    void persistSettingsUpdated(room);
    emitRoom(room.code);
  });

  socket.on("game:start", ({ roomCode } = {}) => {
    const room = rooms.get(String(roomCode || "").toUpperCase());
    if (!room) return;
    if (room.hostSocketId !== socket.id) return emitError(socket, "Apenas o host pode iniciar a partida.");
    try {
      startGame(room, questionBank);
      void persistGameStarted(room);
      emitRoom(room.code);
    } catch (error) {
      emitError(socket, error.message);
    }
  });

  socket.on("answer:submit", ({ roomCode, questionId, option } = {}) => {
    const room = rooms.get(String(roomCode || "").toUpperCase());
    if (!room) return;
    try {
      const answer = submitAnswer(room, { socketId: socket.id, questionId, option });
      void persistAnswerSubmitted(room, answer);
      emitRoom(room.code);

      const allAnswered = room.players.every((p) => room.currentAnswers[p.id]);
      if (allAnswered && room.status === "playing") {
        room.status = "reveal";
        room.revealAt = Date.now();
        void persistGameProgress(room);
        emitRoom(room.code);
      }
    } catch (error) {
      emitError(socket, error.message);
    }
  });

  socket.on("game:next", ({ roomCode } = {}) => {
    const room = rooms.get(String(roomCode || "").toUpperCase());
    if (!room) return;
    if (room.hostSocketId !== socket.id) return emitError(socket, "Apenas o host pode avancar a rodada.");
    advanceRound(room);
    void persistGameProgress(room);
    emitRoom(room.code);
  });

  socket.on("room:leave", ({ roomCode } = {}) => {
    const code = String(roomCode || "").toUpperCase();
    leaveRoom(socket, code);
    socket.emit("room:left", { roomCode: code });
  });

  socket.on("disconnect", () => {
    for (const [code, room] of rooms) {
      leaveRoom(socket, code);
    }
  });
});

setInterval(() => {
  for (const room of rooms.values()) {
    if (room.status !== "playing" || !room.roundEndsAt) continue;
    if (Date.now() >= room.roundEndsAt) {
      for (const player of room.players) {
        if (!room.currentAnswers[player.id]) {
          const answer = submitAnswer(room, {
            socketId: player.id,
            questionId: room.questions[room.currentIndex].id,
            option: null,
            timedOut: true,
          });
          void persistAnswerSubmitted(room, answer);
        }
      }
      room.status = "reveal";
      room.revealAt = Date.now();
      void persistGameProgress(room);
      emitRoom(room.code);
    }
  }
}, 500);

async function bootstrap() {
  appSettings = await loadAppSettings();
  await refreshQuestionBank();

  server.listen(PORT, () => {
    console.log(`MovizzQuizz API running on http://localhost:${PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error("Erro ao iniciar o MovizzQuizz:", error);
  process.exit(1);
});
