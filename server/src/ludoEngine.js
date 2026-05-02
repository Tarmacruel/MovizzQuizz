import { randomUUID } from "crypto";
import { DEFAULT_APP_SETTINGS } from "./appSettings.js";

const PIECES_PER_PLAYER = 4;
const MAX_LUDO_PLAYERS = 6;
const MIN_LUDO_PLAYERS = 2;
const SPEECH_MS = 4200;
const REACTION_MS = 2600;
const MAX_REACTIONS = 24;
const ALLOWED_REACTIONS = new Set(["😀", "😂", "😮", "👏", "🔥", "🎲", "😎", "😭"]);
const PLAYER_COLORS = [
  { id: "red", name: "Vermelho", hex: "#ef4444" },
  { id: "blue", name: "Azul", hex: "#3b82f6" },
  { id: "green", name: "Verde", hex: "#22c55e" },
  { id: "yellow", name: "Amarelo", hex: "#facc15" },
  { id: "purple", name: "Roxo", hex: "#a855f7" },
  { id: "orange", name: "Laranja", hex: "#f59e0b" },
];
const BOARD_CONFIGS = {
  classic: {
    variant: "classic",
    trackSize: 52,
    homeStretch: 6,
    finishProgress: 57,
    startCells: [0, 13, 26, 39],
  },
  sixPlayers: {
    variant: "sixPlayers",
    trackSize: 72,
    homeStretch: 6,
    finishProgress: 77,
    startCells: [0, 12, 24, 36, 48, 60],
  },
};

export function getLudoBoardVariant(playerCount = 0) {
  return Number(playerCount) < 5 ? "classic" : "sixPlayers";
}

export function getLudoBoardConfig(variant = "sixPlayers") {
  return BOARD_CONFIGS[variant] || BOARD_CONFIGS.sixPlayers;
}

function getStartCellsForVariant(variant) {
  return [...getLudoBoardConfig(variant).startCells];
}

function getSafeCellsForVariant(variant) {
  const config = getLudoBoardConfig(variant);
  return new Set(config.startCells.flatMap((start) => {
    return [start, (start + 8) % config.trackSize];
  }));
}

const SAFE_CELLS = getSafeCellsForVariant("sixPlayers");

export const DEFAULT_LUDO_SETTINGS = {
  gameType: "ludo",
  matchName: "Ludo",
  maxPlayers: MAX_LUDO_PLAYERS,
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

function findPlayer(room, socketId) {
  return room.players.find((player) => player.socketId === socketId || player.id === socketId);
}

function getPlayerStartIndex(player) {
  if (Number.isFinite(player?.startCell)) return player.startCell;
  const variant = player?.boardVariant || "sixPlayers";
  return getLudoBoardConfig(variant).startCells[player?.ludoIndex || 0] || 0;
}

function getAbsoluteCell(piece, player) {
  const config = getLudoBoardConfig(player?.boardVariant);
  if (!piece || !player || piece.progress < 0 || piece.progress >= config.trackSize) return null;
  return (getPlayerStartIndex(player) + piece.progress) % config.trackSize;
}

function makePlayerPieces(player) {
  return Array.from({ length: PIECES_PER_PLAYER }, (_, index) => ({
    id: `${player.id}-piece-${index + 1}`,
    playerId: player.id,
    color: player.color,
    colorName: player.colorName,
    colorIndex: player.ludoIndex,
    pieceIndex: index,
    progress: -1,
    state: "home",
    absoluteCell: null,
  }));
}

function normalizePiece(piece, player) {
  const progress = Number.isFinite(piece.progress) ? piece.progress : -1;
  const config = getLudoBoardConfig(player.boardVariant);
  return {
    ...piece,
    playerId: player.id,
    color: player.color,
    colorName: player.colorName,
    colorIndex: player.ludoIndex,
    progress,
    state: progress < 0 ? "home" : progress >= config.finishProgress ? "finished" : "active",
    absoluteCell: getAbsoluteCell({ ...piece, progress }, player),
  };
}

function refreshPiecesForPlayers(room) {
  const currentPieces = new Map((room.pieces || []).map((piece) => [piece.id, piece]));
  room.pieces = room.players.flatMap((player) => {
    const defaultPieces = makePlayerPieces(player);
    return defaultPieces.map((piece) => normalizePiece(currentPieces.get(piece.id) || piece, player));
  });
}

export function sanitizeLudoSettings(settings = {}, appSettings = DEFAULT_APP_SETTINGS) {
  const appMax = Math.min(appSettings.maxPlayers || MAX_LUDO_PLAYERS, MAX_LUDO_PLAYERS);
  return {
    gameType: "ludo",
    matchName: cleanText(settings.matchName || DEFAULT_LUDO_SETTINGS.matchName, 60),
    maxPlayers: clamp(settings.maxPlayers || DEFAULT_LUDO_SETTINGS.maxPlayers, MIN_LUDO_PLAYERS, appMax),
    isPublic: settings.isPublic !== false,
  };
}

export function syncLudoPlayers(room) {
  const variant = getLudoBoardVariant(room.settings?.maxPlayers || room.players.length);
  const config = getLudoBoardConfig(variant);
  room.boardVariant = variant;
  room.players = room.players.map((player, index) => {
    const color = PLAYER_COLORS[index % PLAYER_COLORS.length];
    const startCell = config.startCells[index] || 0;
    return {
      ...player,
      ludoIndex: index,
      startCell,
      boardVariant: variant,
      color: color.id,
      colorName: color.name,
      colorHex: color.hex,
      score: getFinishedPieces(room, player.id),
    };
  });
  room.settings.maxPlayers = Math.max(room.players.length, room.settings.maxPlayers);
  refreshPiecesForPlayers(room);
}

export function createLudoRoom({ code, hostSocketId, playerName, playerId, socketId, settings, appSettings }) {
  const id = playerId || socketId;
  const room = {
    code,
    gameType: "ludo",
    hostSocketId: hostSocketId || id,
    status: "lobby",
    settings: sanitizeLudoSettings(settings, appSettings),
    players: [{ id, socketId, name: playerName, score: 0, connected: true }],
    pieces: [],
    currentTurnPlayerId: null,
    turnIndex: 0,
    dice: { value: null, rolled: false, rollingPlayerId: null },
    legalMoves: [],
    turnSixStreak: 0,
    lastAction: null,
    winner: null,
    reactions: [],
    speechBubbles: {},
    emptySince: null,
    createdAt: Date.now(),
  };
  syncLudoPlayers(room);
  return room;
}

export function updateLudoSettings(room, settings, appSettings) {
  if (room.status !== "lobby") {
    throw new Error("As configuracoes do Ludo so podem ser alteradas no lobby.");
  }
  room.settings = sanitizeLudoSettings({ ...room.settings, ...settings }, appSettings);
  room.settings.maxPlayers = Math.max(room.players.length, room.settings.maxPlayers);
  room.boardVariant = getLudoBoardVariant(room.settings.maxPlayers);
}

function getFinishedPieces(room, playerId) {
  return (room.pieces || []).filter((piece) => piece.playerId === playerId && piece.state === "finished").length;
}

function getProgressScore(room, playerId) {
  return (room.pieces || [])
    .filter((piece) => piece.playerId === playerId)
    .reduce((sum, piece) => sum + Math.max(0, piece.progress), 0);
}

function getActivePlayerIds(room) {
  return room.players.map((player) => player.id);
}

function getPlayerById(room, playerId) {
  return room.players.find((player) => player.id === playerId);
}

function getCurrentPlayer(room) {
  return getPlayerById(room, room.currentTurnPlayerId);
}

function advanceTurn(room) {
  const playerIds = getActivePlayerIds(room);
  if (!playerIds.length) return;
  const currentIndex = Math.max(0, playerIds.indexOf(room.currentTurnPlayerId));
  room.turnIndex = (currentIndex + 1) % playerIds.length;
  room.currentTurnPlayerId = playerIds[room.turnIndex];
  room.dice = { value: null, rolled: false, rollingPlayerId: null };
  room.legalMoves = [];
  room.turnSixStreak = 0;
}

function keepTurn(room) {
  room.dice = { value: null, rolled: false, rollingPlayerId: null };
  room.legalMoves = [];
}

function getLegalMovesForDice(room, player, diceValue) {
  if (!player || !diceValue) return [];
  const config = getLudoBoardConfig(player.boardVariant);
  return room.pieces
    .filter((piece) => piece.playerId === player.id && piece.state !== "finished")
    .map((piece) => {
      if (piece.state === "home") {
        if (diceValue !== 6) return null;
        return {
          pieceId: piece.id,
          from: piece.progress,
          to: 0,
          targetCell: getPlayerStartIndex(player),
          leavesHome: true,
          finishes: false,
        };
      }

      const to = piece.progress + diceValue;
      if (to > config.finishProgress) return null;
      return {
        pieceId: piece.id,
        from: piece.progress,
        to,
        targetCell: to < config.trackSize ? (getPlayerStartIndex(player) + to) % config.trackSize : null,
        leavesHome: false,
        finishes: to === config.finishProgress,
      };
    })
    .filter(Boolean);
}

function applyCapture(room, movingPiece, player) {
  const targetCell = getAbsoluteCell(movingPiece, player);
  if (targetCell === null || getSafeCellsForVariant(room.boardVariant || getLudoBoardVariant(room.settings?.maxPlayers || room.players.length)).has(targetCell)) return [];

  const captured = [];
  for (const piece of room.pieces) {
    if (piece.playerId === player.id || piece.state !== "active") continue;
    const opponent = getPlayerById(room, piece.playerId);
    if (getAbsoluteCell(piece, opponent) !== targetCell) continue;
    piece.progress = -1;
    piece.state = "home";
    piece.absoluteCell = null;
    captured.push(piece.id);
  }
  return captured;
}

function updatePlayerScores(room) {
  room.players = room.players.map((player) => ({ ...player, score: getFinishedPieces(room, player.id) }));
}

function computeRanking(room) {
  return [...room.players]
    .map((player) => ({
      ...player,
      finishedPieces: getFinishedPieces(room, player.id),
      progressScore: getProgressScore(room, player.id),
    }))
    .sort((a, b) => b.finishedPieces - a.finishedPieces || b.progressScore - a.progressScore);
}

function finishIfWon(room, player) {
  if (getFinishedPieces(room, player.id) < PIECES_PER_PLAYER) return false;
  room.status = "ludo-finished";
  room.winner = player;
  room.ranking = computeRanking(room);
  room.legalMoves = [];
  room.dice = { value: null, rolled: false, rollingPlayerId: null };
  room.lastAction = {
    type: "win",
    playerId: player.id,
    playerName: player.name,
    createdAt: Date.now(),
  };
  return true;
}

export function startLudoGame(room) {
  if (!["lobby", "ludo-finished"].includes(room.status)) {
    throw new Error("A partida Ludo ja esta em andamento.");
  }
  if (room.players.length < MIN_LUDO_PLAYERS) {
    throw new Error("O Ludo precisa de pelo menos 2 jogadores.");
  }
  if (room.players.length > MAX_LUDO_PLAYERS) {
    throw new Error("O Ludo permite no maximo 6 jogadores.");
  }

  room.pieces = [];
  syncLudoPlayers(room);
  room.status = "ludo-playing";
  room.turnIndex = 0;
  room.currentTurnPlayerId = room.players[0].id;
  room.dice = { value: null, rolled: false, rollingPlayerId: null };
  room.legalMoves = [];
  room.turnSixStreak = 0;
  room.lastAction = { type: "start", playerId: room.currentTurnPlayerId, createdAt: Date.now() };
  room.winner = null;
  room.reactions = [];
  room.speechBubbles = {};
  room.ranking = computeRanking(room);
  refreshPiecesForPlayers(room);
}

export function rollLudoDice(room, { socketId, diceValue } = {}) {
  if (room.status !== "ludo-playing") throw new Error("A partida Ludo nao esta em andamento.");
  const player = findPlayer(room, socketId);
  if (!player) throw new Error("Jogador nao encontrado.");
  if (player.id !== room.currentTurnPlayerId) throw new Error("Aguarde sua vez.");
  if (room.dice?.rolled) throw new Error("Escolha uma peca antes de rolar novamente.");

  const value = clamp(diceValue || Math.floor(Math.random() * 6) + 1, 1, 6);
  room.turnSixStreak = value === 6 ? room.turnSixStreak + 1 : 0;
  room.dice = { value, rolled: true, rollingPlayerId: player.id };
  room.lastAction = {
    type: "roll",
    playerId: player.id,
    playerName: player.name,
    value,
    createdAt: Date.now(),
  };

  if (room.turnSixStreak >= 3) {
    room.legalMoves = [];
    room.lastAction = {
      type: "triple-six",
      playerId: player.id,
      playerName: player.name,
      value,
      createdAt: Date.now(),
    };
    advanceTurn(room);
    return { value, legalMoves: [] };
  }

  room.legalMoves = getLegalMovesForDice(room, player, value);
  if (!room.legalMoves.length) {
    if (value === 6) {
      keepTurn(room);
    } else {
      advanceTurn(room);
    }
  } else if (room.legalMoves.length === 1) {
    const [automaticMove] = room.legalMoves;
    return {
      value,
      legalMoves: room.legalMoves,
      autoMove: {
        ...automaticMove,
        playerId: player.id,
      },
    };
  }

  return { value, legalMoves: room.legalMoves };
}

export function moveLudoPiece(room, { socketId, pieceId, automatic = false }) {
  if (room.status !== "ludo-playing") throw new Error("A partida Ludo nao esta em andamento.");
  const player = findPlayer(room, socketId);
  if (!player) throw new Error("Jogador nao encontrado.");
  if (player.id !== room.currentTurnPlayerId) throw new Error("Aguarde sua vez.");
  if (!room.dice?.rolled) throw new Error("Role o dado antes de mover.");

  const move = room.legalMoves.find((item) => item.pieceId === pieceId);
  if (!move) throw new Error("Movimento invalido para esta peca.");

  const piece = room.pieces.find((item) => item.id === pieceId);
  if (!piece || piece.playerId !== player.id) throw new Error("Peca nao encontrada.");

  piece.progress = move.to;
  piece.state = move.finishes ? "finished" : "active";
  piece.absoluteCell = getAbsoluteCell(piece, player);
  const capturedPieceIds = piece.state === "active" ? applyCapture(room, piece, player) : [];
  updatePlayerScores(room);

  const actionType = move.finishes ? "finish-piece" : capturedPieceIds.length ? "capture" : "move";
  room.lastAction = {
    type: actionType,
    playerId: player.id,
    playerName: player.name,
    pieceId,
    dice: room.dice.value,
    from: move.from,
    to: move.to,
    capturedPieceIds,
    automatic,
    createdAt: Date.now(),
  };

  if (finishIfWon(room, player)) return;

  if (room.dice.value === 6 || capturedPieceIds.length || move.finishes) {
    keepTurn(room);
  } else {
    advanceTurn(room);
  }
  room.ranking = computeRanking(room);
}

export function addLudoReaction(room, { socketId, emoji }) {
  if (!["lobby", "ludo-playing", "ludo-finished"].includes(room.status)) return;
  const player = findPlayer(room, socketId);
  if (!player) throw new Error("Jogador nao encontrado.");
  const reaction = ALLOWED_REACTIONS.has(emoji) ? emoji : "😀";
  const now = Date.now();
  room.reactions = [
    ...(room.reactions || []),
    {
      id: `reaction-${randomUUID()}`,
      playerId: player.id,
      playerName: player.name,
      emoji: reaction,
      createdAt: now,
      expiresAt: now + REACTION_MS,
    },
  ].slice(-MAX_REACTIONS);
}

export function addLudoSpeech(room, { socketId, message }) {
  if (!["lobby", "ludo-playing", "ludo-finished"].includes(room.status)) return;
  const player = findPlayer(room, socketId);
  if (!player) throw new Error("Jogador nao encontrado.");
  const text = cleanText(message, 70);
  if (!text) throw new Error("Digite uma mensagem.");
  const now = Date.now();
  room.speechBubbles = {
    ...(room.speechBubbles || {}),
    [player.id]: {
      id: `speech-${randomUUID()}`,
      playerId: player.id,
      playerName: player.name,
      text,
      createdAt: now,
      expiresAt: now + SPEECH_MS,
    },
  };
}

export function pruneLudoEphemera(room, now = Date.now()) {
  if (room.gameType !== "ludo") return false;
  const previousReactions = room.reactions || [];
  const reactions = previousReactions.filter((reaction) => reaction.expiresAt > now);
  const previousBubbles = room.speechBubbles || {};
  const speechBubbles = Object.fromEntries(
    Object.entries(previousBubbles).filter(([, bubble]) => bubble.expiresAt > now)
  );
  const changed = reactions.length !== previousReactions.length
    || Object.keys(speechBubbles).length !== Object.keys(previousBubbles).length;
  room.reactions = reactions;
  room.speechBubbles = speechBubbles;
  return changed;
}

export function getPublicLudoRoom(room) {
  pruneLudoEphemera(room);
  updatePlayerScores(room);
  const variant = getLudoBoardVariant(room.settings?.maxPlayers || room.players.length);
  const config = getLudoBoardConfig(variant);
  return {
    code: room.code,
    gameType: "ludo",
    hostSocketId: room.hostSocketId,
    status: room.status,
    settings: room.settings,
    players: room.players,
    pieces: room.pieces || [],
    currentTurnPlayerId: room.currentTurnPlayerId,
    dice: room.dice,
    legalMoves: room.legalMoves || [],
    lastAction: room.lastAction,
    winner: room.winner,
    ranking: room.status === "ludo-finished" ? (room.ranking || computeRanking(room)) : computeRanking(room),
    reactions: room.reactions || [],
    speechBubbles: Object.values(room.speechBubbles || {}),
    board: {
      variant,
      trackSize: config.trackSize,
      homeStretch: config.homeStretch,
      finishProgress: config.finishProgress,
      startCells: getStartCellsForVariant(variant),
      safeCells: [...getSafeCellsForVariant(variant)],
      colors: PLAYER_COLORS,
    },
  };
}

export const LUDO_TEST_CONSTANTS = {
  BOARD_CONFIGS,
  PLAYER_COLORS,
  SAFE_CELLS,
  getLudoBoardVariant,
  getLudoBoardConfig,
  getSafeCellsForVariant,
};
