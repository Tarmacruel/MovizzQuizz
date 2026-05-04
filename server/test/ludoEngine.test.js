import test from "node:test";
import assert from "node:assert/strict";
import {
  LUDO_TEST_CONSTANTS,
  createLudoRoom,
  getPublicLudoRoom,
  moveLudoPiece,
  processLudoTurnTimeout,
  rollLudoDice,
  startLudoGame,
  syncLudoPlayers,
} from "../src/ludoEngine.js";

function makeRoom(playerCount = 2, configuredMaxPlayers = playerCount) {
  const room = createLudoRoom({
    code: "LUDO1",
    hostSocketId: "p1",
    playerName: "Ana",
    playerId: "p1",
    socketId: "p1",
    settings: { gameType: "ludo", maxPlayers: Math.min(6, Math.max(2, configuredMaxPlayers)), isPublic: false },
  });

  for (let index = 2; index <= playerCount; index += 1) {
    room.players.push({
      id: `p${index}`,
      socketId: `p${index}`,
      name: `P${index}`,
      score: 0,
      connected: true,
    });
  }

  syncLudoPlayers(room);
  return room;
}

function piece(room, playerId, index = 0) {
  return room.pieces.find((item) => item.playerId === playerId && item.pieceIndex === index);
}

function setPiece(room, playerId, index, progress, state = "active") {
  const target = piece(room, playerId, index);
  target.progress = progress;
  target.state = state;
  return target;
}

function progressToAbsoluteCell(room, playerId, targetCell) {
  const player = room.players.find((item) => item.id === playerId);
  const config = LUDO_TEST_CONSTANTS.getLudoBoardConfig(player.boardVariant);
  return (targetCell - player.startCell + config.trackSize) % config.trackSize;
}

function applyAutoMove(room, result) {
  assert.ok(result.autoMove);
  moveLudoPiece(room, {
    socketId: result.autoMove.playerId,
    pieceId: result.autoMove.pieceId,
    automatic: true,
  });
}

test("inicio bloqueado com menos de 2 jogadores", () => {
  const room = makeRoom(1);
  assert.throws(() => startLudoGame(room), /pelo menos 2/);
});

test("maximo de 6 jogadores", () => {
  const room = makeRoom(7);
  assert.throws(() => startLudoGame(room), /maximo 6/);
});

test("usa variante classica quando lobby esta configurado para ate 4 jogadores", () => {
  const room = makeRoom(2, 4);
  startLudoGame(room);
  const publicRoom = getPublicLudoRoom(room);
  assert.equal(room.boardVariant, "classic");
  assert.deepEqual(room.players.map((player) => player.startCell), [0, 13]);
  assert.equal(publicRoom.board.trackSize, 52);
  assert.equal(publicRoom.board.finishProgress, 57);
  assert.equal(publicRoom.board.homeEntryProgress, 51);
  assert.deepEqual(publicRoom.board.startCells, [0, 13, 26, 39]);
});

test("usa variante radial quando lobby esta configurado para 5 ou 6 jogadores", () => {
  const room = makeRoom(2, 5);
  startLudoGame(room);
  const publicRoom = getPublicLudoRoom(room);
  assert.equal(room.boardVariant, "sixPlayers");
  assert.deepEqual(room.players.map((player) => player.startCell), [0, 12]);
  assert.equal(publicRoom.board.trackSize, 72);
  assert.equal(publicRoom.board.finishProgress, 77);
  assert.equal(publicRoom.board.homeEntryProgress, 71);
  assert.deepEqual(publicRoom.board.startCells, [0, 12, 24, 36, 48, 60]);
});

test("timer inicia em roll ao comecar partida", () => {
  const room = makeRoom(2);
  startLudoGame(room, { now: 1000 });
  const publicRoom = getPublicLudoRoom(room);
  assert.equal(room.turnPhase, "roll");
  assert.equal(room.turnDeadlineAt, 1000 + LUDO_TEST_CONSTANTS.LUDO_TURN_DURATION_MS);
  assert.equal(publicRoom.turnPhase, "roll");
  assert.equal(publicRoom.turnDeadlineAt, room.turnDeadlineAt);
  assert.equal(publicRoom.turnDurationMs, LUDO_TEST_CONSTANTS.LUDO_TURN_DURATION_MS);
});

test("rolagem manual com multiplas pecas arma fase de movimento", () => {
  const room = makeRoom(2);
  startLudoGame(room, { now: 1000 });
  const result = rollLudoDice(room, { socketId: "p1", diceValue: 6, now: 2000 });
  assert.equal(result.legalMoves.length, 4);
  assert.equal(result.autoMove, undefined);
  assert.equal(room.turnPhase, "move");
  assert.equal(room.turnDeadlineAt, 2000 + LUDO_TEST_CONSTANTS.LUDO_TURN_DURATION_MS);
});

test("timeout em roll rola o dado automaticamente", () => {
  const room = makeRoom(2);
  startLudoGame(room, { now: 1000 });
  const result = processLudoTurnTimeout(room, { now: 31001, diceValue: 5 });
  assert.equal(result.type, "roll");
  assert.equal(room.lastAction.type, "roll");
  assert.equal(room.lastAction.automatic, true);
  assert.equal(room.lastAction.timeout, true);
  assert.equal(room.lastAction.value, 5);
  assert.equal(room.currentTurnPlayerId, "p2");
  assert.equal(room.turnPhase, "roll");
});

test("timeout em move escolhe melhor jogada para finalizar", () => {
  const room = makeRoom(2);
  startLudoGame(room, { now: 1000 });
  const config = LUDO_TEST_CONSTANTS.getLudoBoardConfig(room.boardVariant);
  setPiece(room, "p1", 0, config.finishProgress - 1);
  setPiece(room, "p1", 1, 4);
  rollLudoDice(room, { socketId: "p1", diceValue: 1, now: 2000 });
  assert.equal(room.legalMoves.length, 2);
  const result = processLudoTurnTimeout(room, { now: 32001 });
  assert.equal(result.type, "move");
  assert.equal(piece(room, "p1", 0).state, "finished");
  assert.equal(room.lastAction.type, "finish-piece");
  assert.equal(room.lastAction.automatic, true);
  assert.equal(room.lastAction.timeout, true);
});

test("timeout em move prioriza captura antes de avanco simples", () => {
  const room = makeRoom(2);
  startLudoGame(room, { now: 1000 });
  setPiece(room, "p1", 0, 1);
  setPiece(room, "p1", 1, 6);
  setPiece(room, "p2", 0, progressToAbsoluteCell(room, "p2", 4));
  rollLudoDice(room, { socketId: "p1", diceValue: 3, now: 2000 });
  assert.equal(room.legalMoves.length, 2);
  const result = processLudoTurnTimeout(room, { now: 32001 });
  assert.equal(result.type, "move");
  assert.equal(piece(room, "p1", 0).progress, 4);
  assert.equal(piece(room, "p2", 0).state, "home");
  assert.equal(room.lastAction.type, "capture");
  assert.equal(room.currentTurnPlayerId, "p1");
});

test("so entra na pista com 6", () => {
  const room = makeRoom(2);
  startLudoGame(room);
  const result = rollLudoDice(room, { socketId: "p1", diceValue: 5 });
  assert.equal(result.legalMoves.length, 0);
  assert.equal(piece(room, "p1").state, "home");
  assert.equal(room.lastAction.type, "roll");
  assert.equal(room.lastAction.value, 5);
  assert.equal(room.dice.rolled, false);
  assert.equal(room.currentTurnPlayerId, "p2");
});

test("6 concede turno extra apos mover", () => {
  const room = makeRoom(2);
  startLudoGame(room);
  rollLudoDice(room, { socketId: "p1", diceValue: 6 });
  moveLudoPiece(room, { socketId: "p1", pieceId: piece(room, "p1").id });
  assert.equal(room.currentTurnPlayerId, "p1");
  assert.equal(piece(room, "p1").progress, 0);
});

test("tres 6 seguidos perde a vez", () => {
  const room = makeRoom(2);
  startLudoGame(room);
  rollLudoDice(room, { socketId: "p1", diceValue: 6 });
  moveLudoPiece(room, { socketId: "p1", pieceId: piece(room, "p1", 0).id });
  rollLudoDice(room, { socketId: "p1", diceValue: 6 });
  moveLudoPiece(room, { socketId: "p1", pieceId: piece(room, "p1", 1).id });
  rollLudoDice(room, { socketId: "p1", diceValue: 6 });
  assert.equal(room.currentTurnPlayerId, "p2");
  assert.equal(room.lastAction.type, "triple-six");
});

test("captura em casa nao segura", () => {
  const room = makeRoom(2);
  startLudoGame(room);
  setPiece(room, "p1", 0, 1);
  setPiece(room, "p2", 0, progressToAbsoluteCell(room, "p2", 4));
  const result = rollLudoDice(room, { socketId: "p1", diceValue: 3 });
  assert.equal(result.autoMove.pieceId, piece(room, "p1", 0).id);
  assert.equal(piece(room, "p1", 0).progress, 1);
  assert.equal(room.lastAction.type, "roll");
  applyAutoMove(room, result);
  assert.equal(piece(room, "p1", 0).progress, 4);
  assert.equal(piece(room, "p2", 0).state, "home");
  assert.equal(room.lastAction.type, "capture");
  assert.equal(room.lastAction.automatic, true);
  assert.equal(room.currentTurnPlayerId, "p1");
  assert.equal(room.dice.rolled, false);
});

test("casa segura nao captura", () => {
  const room = makeRoom(2);
  startLudoGame(room);
  setPiece(room, "p1", 0, 5);
  setPiece(room, "p2", 0, progressToAbsoluteCell(room, "p2", 8));
  const result = rollLudoDice(room, { socketId: "p1", diceValue: 3 });
  assert.equal(result.autoMove.pieceId, piece(room, "p1", 0).id);
  assert.equal(piece(room, "p1", 0).progress, 5);
  assert.equal(room.lastAction.type, "roll");
  applyAutoMove(room, result);
  assert.equal(piece(room, "p1", 0).progress, 8);
  assert.equal(piece(room, "p2", 0).state, "active");
  assert.equal(room.lastAction.type, "move");
  assert.equal(room.currentTurnPlayerId, "p2");
});

test("movimenta automaticamente quando so ha uma peca possivel", () => {
  const room = makeRoom(2);
  startLudoGame(room);
  setPiece(room, "p1", 0, 2);
  const result = rollLudoDice(room, { socketId: "p1", diceValue: 3 });
  assert.equal(result.autoMove.pieceId, piece(room, "p1", 0).id);
  assert.equal(Boolean(result.autoMove.actionToken), true);
  assert.equal(room.turnPhase, "move");
  assert.equal(room.turnDeadlineAt, null);
  assert.equal(result.legalMoves.length, 1);
  assert.equal(piece(room, "p1", 0).progress, 2);
  assert.equal(room.lastAction.type, "roll");
  applyAutoMove(room, result);
  assert.equal(piece(room, "p1", 0).progress, 5);
  assert.equal(room.lastAction.type, "move");
  assert.equal(room.lastAction.automatic, true);
  assert.equal(room.currentTurnPlayerId, "p2");
});

test("acao manual antes do timeout impede automacao duplicada", () => {
  const room = makeRoom(2);
  startLudoGame(room, { now: 1000 });
  setPiece(room, "p1", 0, 2);
  setPiece(room, "p1", 1, 4);
  rollLudoDice(room, { socketId: "p1", diceValue: 2, now: 2000 });
  const oldDeadline = room.turnDeadlineAt;
  moveLudoPiece(room, { socketId: "p1", pieceId: piece(room, "p1", 1).id, now: 3000 });
  const beforeTimeout = {
    currentTurnPlayerId: room.currentTurnPlayerId,
    pieceProgress: piece(room, "p1", 0).progress,
  };
  const result = processLudoTurnTimeout(room, { now: oldDeadline + 1, diceValue: 6 });
  assert.equal(result, null);
  assert.equal(room.currentTurnPlayerId, beforeTimeout.currentTurnPlayerId);
  assert.equal(piece(room, "p1", 0).progress, beforeTimeout.pieceProgress);
});

test("entra na reta final sem andar casa externa extra", () => {
  const room = makeRoom(2);
  startLudoGame(room);
  const config = LUDO_TEST_CONSTANTS.getLudoBoardConfig(room.boardVariant);
  const homeEntryProgress = LUDO_TEST_CONSTANTS.getHomeEntryProgress(room.boardVariant);
  setPiece(room, "p1", 0, homeEntryProgress - 1);
  const result = rollLudoDice(room, { socketId: "p1", diceValue: 1 });
  assert.equal(result.autoMove.pieceId, piece(room, "p1", 0).id);
  applyAutoMove(room, result);
  assert.equal(piece(room, "p1", 0).progress, homeEntryProgress);
  assert.equal(piece(room, "p1", 0).absoluteCell, null);
  assert.equal(piece(room, "p1", 0).state, "active");
  assert.equal(config.trackSize, 52);
});

test("chegada exige numero exato", () => {
  const room = makeRoom(2);
  startLudoGame(room);
  const config = LUDO_TEST_CONSTANTS.getLudoBoardConfig(room.boardVariant);
  setPiece(room, "p1", 0, config.finishProgress - 2);
  const blocked = rollLudoDice(room, { socketId: "p1", diceValue: 3 });
  assert.equal(blocked.legalMoves.length, 0);
  assert.equal(piece(room, "p1", 0).progress, config.finishProgress - 2);
  assert.equal(room.lastAction.type, "roll");
  assert.equal(room.lastAction.value, 3);
  assert.equal(room.dice.rolled, false);

  room.currentTurnPlayerId = "p1";
  room.turnIndex = 0;
  room.dice = { value: null, rolled: false, rollingPlayerId: null };
  const exact = rollLudoDice(room, { socketId: "p1", diceValue: 2 });
  assert.equal(exact.autoMove.pieceId, piece(room, "p1", 0).id);
  assert.equal(exact.legalMoves.length, 1);
  assert.equal(piece(room, "p1", 0).progress, config.finishProgress - 2);
  assert.equal(room.lastAction.type, "roll");
  applyAutoMove(room, exact);
  assert.equal(piece(room, "p1", 0).progress, config.finishProgress);
  assert.equal(piece(room, "p1", 0).state, "finished");
  assert.equal(room.lastAction.type, "finish-piece");
  assert.equal(room.currentTurnPlayerId, "p1");
  assert.equal(room.dice.rolled, false);
});

test("vitoria ao finalizar 4 pecas", () => {
  const room = makeRoom(2);
  startLudoGame(room);
  const config = LUDO_TEST_CONSTANTS.getLudoBoardConfig(room.boardVariant);
  setPiece(room, "p1", 0, config.finishProgress, "finished");
  setPiece(room, "p1", 1, config.finishProgress, "finished");
  setPiece(room, "p1", 2, config.finishProgress, "finished");
  setPiece(room, "p1", 3, config.finishProgress - 1);
  const result = rollLudoDice(room, { socketId: "p1", diceValue: 1 });
  assert.equal(result.autoMove.pieceId, piece(room, "p1", 3).id);
  assert.equal(room.lastAction.type, "roll");
  applyAutoMove(room, result);
  assert.equal(room.status, "ludo-finished");
  assert.equal(room.winner.id, "p1");
});
