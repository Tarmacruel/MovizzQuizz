export const LUDO_CENTER = { x: 300, y: 300 };

export const LUDO_BOARD_CONFIGS = {
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

export const LUDO_COLORS = {
  red: "#ef4444",
  blue: "#3b82f6",
  green: "#22c55e",
  yellow: "#facc15",
  purple: "#a855f7",
  orange: "#f59e0b",
  teal: "#14b8a6",
};

export const LUDO_COLOR_SLOTS = [
  { color: "red", colorName: "Vermelho", colorHex: LUDO_COLORS.red, ludoIndex: 0 },
  { color: "blue", colorName: "Azul", colorHex: LUDO_COLORS.blue, ludoIndex: 1 },
  { color: "green", colorName: "Verde", colorHex: LUDO_COLORS.green, ludoIndex: 2 },
  { color: "yellow", colorName: "Amarelo", colorHex: LUDO_COLORS.yellow, ludoIndex: 3 },
  { color: "purple", colorName: "Roxo", colorHex: LUDO_COLORS.purple, ludoIndex: 4 },
  { color: "orange", colorName: "Laranja", colorHex: LUDO_COLORS.orange, ludoIndex: 5 },
];

const CLASSIC_COLOR_SLOTS = [
  LUDO_COLOR_SLOTS[0], // top-left
  LUDO_COLOR_SLOTS[1], // top-right
  LUDO_COLOR_SLOTS[3], // bottom-left
  LUDO_COLOR_SLOTS[2], // bottom-right
];

export const CLASSIC_GRID = {
  origin: 60,
  cellSize: 32,
  cellInset: 2,
  cells: 15,
};

const CLASSIC_BASE_CENTERS = [
  { x: 156, y: 156 },
  { x: 444, y: 156 },
  { x: 444, y: 444 },
  { x: 156, y: 444 },
];

const CLASSIC_BASE_GRID = [
  [0, 0],
  [0, 9],
  [9, 9],
  [9, 0],
];

const CLASSIC_TRACK_GRID_TEMPLATE = [
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6], [0, 7], [0, 8],
  [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14], [7, 14],
  [8, 14], [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8], [14, 7], [14, 6],
  [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0], [7, 0], [6, 0],
];

const CLASSIC_TRACK_GRID = CLASSIC_TRACK_GRID_TEMPLATE;

const CLASSIC_LANE_GRID = [
  [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6]],
  [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7]],
  [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9], [7, 8]],
  [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7], [8, 7]],
];

const PIECE_SPREAD = [
  { x: -34, y: -34 },
  { x: 34, y: -34 },
  { x: -34, y: 34 },
  { x: 34, y: 34 },
];

function classicGridPoint([row, col]) {
  return {
    x: CLASSIC_GRID.origin + col * CLASSIC_GRID.cellSize + CLASSIC_GRID.cellSize / 2,
    y: CLASSIC_GRID.origin + row * CLASSIC_GRID.cellSize + CLASSIC_GRID.cellSize / 2,
  };
}

function classicGridRect([row, col], cellsWide = 1, cellsHigh = 1, inset = CLASSIC_GRID.cellInset) {
  return {
    x: CLASSIC_GRID.origin + col * CLASSIC_GRID.cellSize + inset,
    y: CLASSIC_GRID.origin + row * CLASSIC_GRID.cellSize + inset,
    width: CLASSIC_GRID.cellSize * cellsWide - inset * 2,
    height: CLASSIC_GRID.cellSize * cellsHigh - inset * 2,
  };
}

const CLASSIC_TRACK_POINTS = CLASSIC_TRACK_GRID.map(classicGridPoint);
const CLASSIC_LANE_POINTS = CLASSIC_LANE_GRID.map((lane) => lane.map(classicGridPoint));

export function getLudoBoardVariant(playerCount = 0) {
  return Number(playerCount) < 5 ? "classic" : "sixPlayers";
}

export function getLudoBoardConfig(variant = "sixPlayers") {
  return LUDO_BOARD_CONFIGS[variant] || LUDO_BOARD_CONFIGS.sixPlayers;
}

export function getLudoBoardSlots(variant) {
  return variant === "classic" ? CLASSIC_COLOR_SLOTS : LUDO_COLOR_SLOTS;
}

export function getLudoStartStep(variant) {
  const config = getLudoBoardConfig(variant);
  return config.trackSize / config.startCells.length;
}

export function getSlotStartCell(slot, variant) {
  if (Number.isFinite(slot?.startCell)) return slot.startCell;
  const config = getLudoBoardConfig(variant);
  return config.startCells[slot?.ludoIndex || 0] || 0;
}

export function getPlayerStartCell(player, variant) {
  return getSlotStartCell(player, variant);
}

export function getLudoAngleForCell(cell) {
  const trackSize = LUDO_BOARD_CONFIGS.sixPlayers.trackSize;
  return -90 + (cell % trackSize) * (360 / trackSize);
}

export function ludoPolarPoint(radius, angleDeg, center = LUDO_CENTER) {
  const angle = angleDeg * (Math.PI / 180);
  return {
    x: center.x + Math.cos(angle) * radius,
    y: center.y + Math.sin(angle) * radius,
  };
}

export function getSixTrackPoint(cell, radius = 202) {
  return ludoPolarPoint(radius, getLudoAngleForCell(cell));
}

export function getClassicTrackPoint(cell) {
  const trackSize = LUDO_BOARD_CONFIGS.classic.trackSize;
  return CLASSIC_TRACK_POINTS[((cell % trackSize) + trackSize) % trackSize];
}

export function getClassicTrackRect(cell) {
  const trackSize = LUDO_BOARD_CONFIGS.classic.trackSize;
  return classicGridRect(CLASSIC_TRACK_GRID[((cell % trackSize) + trackSize) % trackSize]);
}

export function getClassicLaneRect(slot, laneIndex) {
  const lane = CLASSIC_LANE_GRID[slot?.ludoIndex || 0] || CLASSIC_LANE_GRID[0];
  return classicGridRect(lane[laneIndex] || lane[0]);
}

export function getClassicBaseRect(slot) {
  const origin = CLASSIC_BASE_GRID[(slot?.ludoIndex || 0) % 4] || CLASSIC_BASE_GRID[0];
  return classicGridRect(origin, 6, 6, 0);
}

export function getLudoTrackPoint(cell, variant) {
  return variant === "classic" ? getClassicTrackPoint(cell) : getSixTrackPoint(cell);
}

export function getClassicBaseCenter(slot) {
  return CLASSIC_BASE_CENTERS[(slot?.ludoIndex || 0) % 4] || CLASSIC_BASE_CENTERS[0];
}

export function getSixBaseCenter(slot, radius = 255) {
  return ludoPolarPoint(radius, getLudoAngleForCell(getSlotStartCell(slot, "sixPlayers")));
}

export function getBaseCenter(slot, variant) {
  return variant === "classic" ? getClassicBaseCenter(slot) : getSixBaseCenter(slot);
}

export function getHomeSlotPoints(center, spread = PIECE_SPREAD) {
  return spread.map((point) => ({ x: center.x + point.x, y: center.y + point.y }));
}

export function getLanePoint(slot, variant, laneIndex) {
  if (variant === "classic") {
    return CLASSIC_LANE_POINTS[slot?.ludoIndex || 0]?.[laneIndex] || LUDO_CENTER;
  }

  const start = getLudoTrackPoint(getSlotStartCell(slot, variant), variant);
  const ratio = (laneIndex + 1) / 7;
  return {
    x: start.x + (LUDO_CENTER.x - start.x) * ratio,
    y: start.y + (LUDO_CENTER.y - start.y) * ratio,
  };
}

export function getPieceOffset(pieceIndex = 0, scale = 1) {
  const point = PIECE_SPREAD[pieceIndex] || { x: 0, y: 0 };
  return { x: point.x * scale, y: point.y * scale };
}

export function getLudoPiecePoint(piece, players = [], variant) {
  const config = getLudoBoardConfig(variant);
  const player = players.find((item) => item.id === piece.playerId) || {};
  const startCell = getPlayerStartCell(player, variant);
  const offset = getPieceOffset(piece.pieceIndex || 0, piece.state === "home" ? 1 : 0.22);

  if (piece.state === "home" || piece.progress < 0) {
    const slots = getHomeSlotPoints(getBaseCenter(player, variant));
    return slots[piece.pieceIndex || 0] || getBaseCenter(player, variant);
  }

  if (piece.progress >= config.trackSize) {
    const laneIndex = Math.min(config.homeStretch - 1, Math.max(0, piece.progress - config.trackSize));
    const point = getLanePoint(player, variant, laneIndex);
    return { x: point.x + offset.x, y: point.y + offset.y };
  }

  const point = getLudoTrackPoint((startCell + piece.progress) % config.trackSize, variant);
  return { x: point.x + offset.x, y: point.y + offset.y };
}

export function ludoArcPath(innerRadius, outerRadius, startDeg, endDeg) {
  const outerStart = ludoPolarPoint(outerRadius, startDeg);
  const outerEnd = ludoPolarPoint(outerRadius, endDeg);
  const innerEnd = ludoPolarPoint(innerRadius, endDeg);
  const innerStart = ludoPolarPoint(innerRadius, startDeg);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    "Z",
  ].join(" ");
}

export function getSixSlicePath(slot, innerRadius = 84, outerRadius = 286) {
  const center = getLudoAngleForCell(getSlotStartCell(slot, "sixPlayers"));
  return ludoArcPath(innerRadius, outerRadius, center - 27, center + 27);
}

export function getSixHomePocketPath(slot) {
  const center = getLudoAngleForCell(getSlotStartCell(slot, "sixPlayers"));
  const left = ludoPolarPoint(278, center - 20);
  const right = ludoPolarPoint(278, center + 20);
  const point = ludoPolarPoint(188, center);
  return `M ${left.x} ${left.y} L ${right.x} ${right.y} L ${point.x} ${point.y} Z`;
}

export function getHexagonPoints(radius = 292) {
  return Array.from({ length: 6 }, (_, index) => {
    const point = ludoPolarPoint(radius, -90 + index * 60);
    return `${point.x},${point.y}`;
  }).join(" ");
}

export function getCenterTrianglePath(slot, variant) {
  if (variant === "classic") {
    const center = `${LUDO_CENTER.x} ${LUDO_CENTER.y}`;
    const left = CLASSIC_GRID.origin + 6 * CLASSIC_GRID.cellSize;
    const top = CLASSIC_GRID.origin + 6 * CLASSIC_GRID.cellSize;
    const right = CLASSIC_GRID.origin + 9 * CLASSIC_GRID.cellSize;
    const bottom = CLASSIC_GRID.origin + 9 * CLASSIC_GRID.cellSize;
    const triangles = [
      `${center} L ${left} ${bottom} L ${left} ${top}`,
      `${center} L ${left} ${top} L ${right} ${top}`,
      `${center} L ${right} ${top} L ${right} ${bottom}`,
      `${center} L ${right} ${bottom} L ${left} ${bottom}`,
    ];
    return `M ${triangles[slot?.ludoIndex || 0] || triangles[0]} Z`;
  }

  const angle = variant === "classic"
    ? 0
    : getLudoAngleForCell(getSlotStartCell(slot, variant));
  const left = ludoPolarPoint(78, angle - 26);
  const right = ludoPolarPoint(78, angle + 26);
  return `M ${LUDO_CENTER.x} ${LUDO_CENTER.y} L ${left.x} ${left.y} L ${right.x} ${right.y} Z`;
}
