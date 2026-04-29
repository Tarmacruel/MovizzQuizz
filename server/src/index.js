import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import { customAlphabet } from "nanoid";
import questions from "../data/questions.json" assert { type: "json" };
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

const PORT = process.env.PORT || 3333;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const makeCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 5);

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

const rooms = new Map();

app.get("/health", (_, res) => {
  res.json({ ok: true, rooms: rooms.size, questions: questions.length });
});

app.get("/questions/meta", (_, res) => {
  const categories = [...new Set(questions.map((q) => q.category))];
  const difficulties = [...new Set(questions.map((q) => q.difficulty))];
  res.json({ total: questions.length, categories, difficulties });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGIN,
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
      questionBank: questions,
    });

    rooms.set(code, room);
    socket.join(code);
    socket.emit("room:joined", { roomCode: code, playerId: socket.id });
    emitRoom(code);
  });

  socket.on("room:join", ({ roomCode, playerName } = {}) => {
    const code = String(roomCode || "").trim().toUpperCase();
    const cleanName = String(playerName || "").trim().slice(0, 24);
    const room = rooms.get(code);

    if (!room) return emitError(socket, "Sala não encontrada.");
    if (!cleanName) return emitError(socket, "Informe o nome do jogador.");
    if (room.status !== "lobby") return emitError(socket, "Esta partida já começou.");

    joinRoom(room, { socketId: socket.id, playerName: cleanName });
    socket.join(code);
    socket.emit("room:joined", { roomCode: code, playerId: socket.id });
    emitRoom(code);
  });

  socket.on("room:settings", ({ roomCode, settings } = {}) => {
    const room = rooms.get(String(roomCode || "").toUpperCase());
    if (!room) return;
    if (room.hostSocketId !== socket.id) return emitError(socket, "Apenas o host pode alterar a partida.");
    updateSettings(room, settings, questions);
    emitRoom(room.code);
  });

  socket.on("game:start", ({ roomCode } = {}) => {
    const room = rooms.get(String(roomCode || "").toUpperCase());
    if (!room) return;
    if (room.hostSocketId !== socket.id) return emitError(socket, "Apenas o host pode iniciar a partida.");
    try {
      startGame(room, questions);
      emitRoom(room.code);
    } catch (error) {
      emitError(socket, error.message);
    }
  });

  socket.on("answer:submit", ({ roomCode, questionId, option } = {}) => {
    const room = rooms.get(String(roomCode || "").toUpperCase());
    if (!room) return;
    try {
      submitAnswer(room, { socketId: socket.id, questionId, option });
      emitRoom(room.code);

      const allAnswered = room.players.every((p) => room.currentAnswers[p.id]);
      if (allAnswered && room.status === "playing") {
        room.status = "reveal";
        room.revealAt = Date.now();
        emitRoom(room.code);
      }
    } catch (error) {
      emitError(socket, error.message);
    }
  });

  socket.on("game:next", ({ roomCode } = {}) => {
    const room = rooms.get(String(roomCode || "").toUpperCase());
    if (!room) return;
    if (room.hostSocketId !== socket.id) return emitError(socket, "Apenas o host pode avançar a rodada.");
    advanceRound(room);
    emitRoom(room.code);
  });

  socket.on("disconnect", () => {
    for (const [code, room] of rooms) {
      const removed = removePlayerBySocket(room, socket.id);
      if (!removed) continue;

      if (room.players.length === 0) {
        rooms.delete(code);
      } else {
        if (room.hostSocketId === socket.id) {
          room.hostSocketId = room.players[0].id;
        }
        emitRoom(code);
      }
    }
  });
});

setInterval(() => {
  for (const room of rooms.values()) {
    if (room.status !== "playing" || !room.roundEndsAt) continue;
    if (Date.now() >= room.roundEndsAt) {
      for (const player of room.players) {
        if (!room.currentAnswers[player.id]) {
          submitAnswer(room, {
            socketId: player.id,
            questionId: room.questions[room.currentIndex].id,
            option: null,
            timedOut: true,
          });
        }
      }
      room.status = "reveal";
      room.revealAt = Date.now();
      emitRoom(room.code);
    }
  }
}, 500);

server.listen(PORT, () => {
  console.log(`MovizzQuizz API running on http://localhost:${PORT}`);
});
