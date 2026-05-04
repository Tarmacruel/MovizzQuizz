import test from "node:test";
import assert from "node:assert/strict";
import { disconnectPlayerBySocket, joinRoom } from "../src/gameEngine.js";
import { normalizeHandle, validatePin } from "../src/playerAccounts.js";
import { createStopRoom, startStopGame, submitStopAnswers } from "../src/stopEngine.js";

function makeStopRoom() {
  const room = createStopRoom({
    code: "STOP1",
    hostSocketId: "p1",
    playerName: "Ana",
    playerId: "p1",
    socketId: "socket-1",
    accountId: "acc-1",
    settings: {
      gameType: "stop",
      maxPlayers: 4,
      totalRounds: 2,
      roundSeconds: 60,
      categories: [{ id: "cat-1", name: "Nome", order: 0 }],
    },
  });

  joinRoom(room, {
    socketId: "socket-2",
    playerName: "Beto",
    playerId: "p2",
    accountId: "acc-2",
  });

  return room;
}

test("normaliza apelido e valida PIN de conta leve", () => {
  assert.equal(normalizeHandle(" João Silva! "), "joao_silva");
  assert.equal(validatePin("1234"), true);
  assert.equal(validatePin("12345678"), true);
  assert.equal(validatePin("123"), false);
  assert.equal(validatePin("1234a"), false);
});

test("jogador Stop criado com accountId preserva identidade da partida", () => {
  const room = makeStopRoom();
  assert.equal(room.players[0].id, "p1");
  assert.equal(room.players[0].accountId, "acc-1");
  assert.equal(room.players[1].id, "p2");
  assert.equal(room.players[1].accountId, "acc-2");
});

test("conta retoma a mesma vaga durante rodada Stop mesmo sem playerId local", () => {
  const room = makeStopRoom();
  startStopGame(room);

  const disconnected = disconnectPlayerBySocket(room, "socket-1");
  assert.equal(disconnected.id, "p1");
  assert.equal(disconnected.accountId, "acc-1");
  assert.equal(disconnected.connected, false);

  const reconnected = joinRoom(room, {
    socketId: "socket-new",
    playerName: "Ana voltou",
    playerId: null,
    accountId: "acc-1",
  });

  assert.equal(reconnected.id, "p1");
  assert.equal(reconnected.accountId, "acc-1");
  assert.equal(reconnected.socketId, "socket-new");
  assert.equal(reconnected.connected, true);
  assert.equal(room.players.length, 2);

  const submit = submitStopAnswers(room, {
    socketId: "socket-new",
    answers: { "cat-1": "Ana" },
  });
  assert.equal(submit.playerId, "p1");
  assert.deepEqual(room.currentRound.answers.p1, { "cat-1": "Ana" });
});

test("fallback por playerId continua funcionando para convidados", () => {
  const room = createStopRoom({
    code: "STOP2",
    hostSocketId: "guest-1",
    playerName: "Convidado",
    playerId: "guest-1",
    socketId: "socket-guest",
    settings: { gameType: "stop", maxPlayers: 4 },
  });

  disconnectPlayerBySocket(room, "socket-guest");
  const reconnected = joinRoom(room, {
    socketId: "socket-guest-new",
    playerName: "Convidado",
    playerId: "guest-1",
  });

  assert.equal(reconnected.id, "guest-1");
  assert.equal(reconnected.accountId, null);
  assert.equal(room.players.length, 1);
});

test("conta diferente nao reocupa vaga vinculada por playerId antigo", () => {
  const room = makeStopRoom();
  const joined = joinRoom(room, {
    socketId: "socket-3",
    playerName: "Carla",
    playerId: "p1",
    accountId: "acc-3",
  });

  assert.notEqual(joined.id, "p1");
  assert.equal(joined.accountId, "acc-3");
  assert.equal(room.players.find((player) => player.id === "p1").accountId, "acc-1");
  assert.equal(room.players.length, 3);
});
