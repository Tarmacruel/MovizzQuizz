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

export const SIX_LUDO_GEOMETRY = {
  BOARD_SIZE: 600,
  CENTER: LUDO_CENTER,
  OUTER_RADIUS: 292,
  SECTOR_OUTER_RADIUS: 284,
  SECTOR_INNER_RADIUS: 66,
  TRACK_RADIUS: 218,
  TRACK_CELL_WIDTH: 17,
  TRACK_CELL_HEIGHT: 23.5,
  TRACK_CELL_RADIUS: 4.5,
  TRACK_CELLS_PER_SECTOR: 12,
  HOME_RADIUS: 263,
  BASE_SIZE: 96,
  BASE_WIDTH: 96,
  BASE_HEIGHT: 54,
  HOME_SLOT_RADIUS: 8.4,
  FINAL_CELL_SIZE: 21,
  FINAL_CELL_RADIUS: 5,
  FINAL_LANE_START_RADIUS: 184,
  FINAL_LANE_STEP: 23,
  CENTER_RADIUS: 36,
  CENTER_WEDGE_RADIUS: 64,
  STROKE_WIDTH: 2,
  PIECE_SIZE: 22,
};

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

export function getLudoHomeEntryProgress(variant) {
  return getLudoBoardConfig(variant).trackSize - 1;
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

function angleVector(angleDeg) {
  const angle = angleDeg * (Math.PI / 180);
  return { x: Math.cos(angle), y: Math.sin(angle) };
}

function pointFromBasis(center, radialAngle, tangentOffset = 0, radialOffset = 0) {
  const tangent = angleVector(radialAngle + 90);
  const radial = angleVector(radialAngle);
  return {
    x: center.x + tangent.x * tangentOffset + radial.x * radialOffset,
    y: center.y + tangent.y * tangentOffset + radial.y * radialOffset,
  };
}

function normalizeTrackCell(cell, trackSize = LUDO_BOARD_CONFIGS.sixPlayers.trackSize) {
  return ((cell % trackSize) + trackSize) % trackSize;
}

export function getSixSectorAngle(slotOrIndex = 0) {
  if (Number.isFinite(slotOrIndex)) {
    return getLudoAngleForCell((slotOrIndex % 6) * SIX_LUDO_GEOMETRY.TRACK_CELLS_PER_SECTOR);
  }
  return getLudoAngleForCell(getSlotStartCell(slotOrIndex, "sixPlayers"));
}

function getSixTrackSegment(cell, radius = SIX_LUDO_GEOMETRY.TRACK_RADIUS) {
  const normalized = normalizeTrackCell(cell);
  const sector = Math.floor(normalized / SIX_LUDO_GEOMETRY.TRACK_CELLS_PER_SECTOR);
  const index = normalized % SIX_LUDO_GEOMETRY.TRACK_CELLS_PER_SECTOR;
  const startAngle = getSixSectorAngle(sector);
  const start = ludoPolarPoint(radius, startAngle);
  const end = ludoPolarPoint(radius, startAngle + 60);
  const ratio = index / SIX_LUDO_GEOMETRY.TRACK_CELLS_PER_SECTOR;

  return {
    point: {
      x: start.x + (end.x - start.x) * ratio,
      y: start.y + (end.y - start.y) * ratio,
    },
    angle: startAngle + 120,
    sector,
    index,
  };
}

export function getSixTrackPoint(cell, radius = SIX_LUDO_GEOMETRY.TRACK_RADIUS) {
  return getSixTrackSegment(cell, radius).point;
}

export function getSixTrackTransform(cell) {
  const segment = getSixTrackSegment(cell);
  return `translate(${segment.point.x} ${segment.point.y}) rotate(${segment.angle})`;
}

export function getSixTrackRect(cell) {
  return {
    x: -SIX_LUDO_GEOMETRY.TRACK_CELL_WIDTH / 2,
    y: -SIX_LUDO_GEOMETRY.TRACK_CELL_HEIGHT / 2,
    width: SIX_LUDO_GEOMETRY.TRACK_CELL_WIDTH,
    height: SIX_LUDO_GEOMETRY.TRACK_CELL_HEIGHT,
    rx: SIX_LUDO_GEOMETRY.TRACK_CELL_RADIUS,
    transform: getSixTrackTransform(cell),
  };
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

export function getSixBaseCenter(slot, radius = SIX_LUDO_GEOMETRY.HOME_RADIUS) {
  return ludoPolarPoint(radius, getSixSectorAngle(slot));
}

export function getSixBaseArea(slot) {
  const angle = getSixSectorAngle(slot);
  const center = getSixBaseCenter(slot);
  return {
    angle,
    center,
    width: SIX_LUDO_GEOMETRY.BASE_WIDTH,
    height: SIX_LUDO_GEOMETRY.BASE_HEIGHT,
    rx: 19,
    transform: `rotate(${angle + 90} ${center.x} ${center.y})`,
    labelPoint: pointFromBasis(center, angle, 0, 22),
    scorePoint: pointFromBasis(center, angle, 0, -27),
  };
}

export function getSixBaseSlotPoints(slot) {
  const angle = getSixSectorAngle(slot);
  const center = getSixBaseCenter(slot);
  const offsets = [
    { tangent: -18.5, radial: 8 },
    { tangent: 18.5, radial: 8 },
    { tangent: -18.5, radial: -17 },
    { tangent: 18.5, radial: -17 },
  ];

  return offsets.map((offset) => pointFromBasis(center, angle, offset.tangent, offset.radial));
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

  return getSixFinalLanePoint(slot, laneIndex);
}

export function getSixFinalLanePoint(slot, laneIndex) {
  const radius = SIX_LUDO_GEOMETRY.FINAL_LANE_START_RADIUS - laneIndex * SIX_LUDO_GEOMETRY.FINAL_LANE_STEP;
  return ludoPolarPoint(radius, getSixSectorAngle(slot));
}

export function getSixFinalLaneRect(slot, laneIndex) {
  const point = getSixFinalLanePoint(slot, laneIndex);
  const angle = getSixSectorAngle(slot) + 90;
  const size = SIX_LUDO_GEOMETRY.FINAL_CELL_SIZE;
  return {
    x: -size / 2,
    y: -size / 2,
    width: size,
    height: size,
    rx: SIX_LUDO_GEOMETRY.FINAL_CELL_RADIUS,
    transform: `translate(${point.x} ${point.y}) rotate(${angle})`,
  };
}

export function getSixFinalLaneGuide(slot) {
  const angle = getSixSectorAngle(slot);
  return {
    start: ludoPolarPoint(SIX_LUDO_GEOMETRY.FINAL_LANE_START_RADIUS + 15, angle),
    end: ludoPolarPoint(SIX_LUDO_GEOMETRY.CENTER_WEDGE_RADIUS + 2, angle),
  };
}

export function getSixFinishedPiecePoint(slot, pieceIndex = 0) {
  const angle = getSixSectorAngle(slot);
  const base = ludoPolarPoint(44, angle);
  const offsets = [
    { tangent: -5.2, radial: 3.6 },
    { tangent: 5.2, radial: 3.6 },
    { tangent: -5.2, radial: -6 },
    { tangent: 5.2, radial: -6 },
  ];
  const offset = offsets[pieceIndex] || { tangent: 0, radial: 0 };
  return pointFromBasis(base, angle, offset.tangent, offset.radial);
}

export function getPieceOffset(pieceIndex = 0, scale = 1) {
  const point = PIECE_SPREAD[pieceIndex] || { x: 0, y: 0 };
  return { x: point.x * scale, y: point.y * scale };
}

export function getLudoPiecePoint(piece, players = [], variant) {
  const config = getLudoBoardConfig(variant);
  const player = players.find((item) => item.id === piece.playerId) || {};
  const startCell = getPlayerStartCell(player, variant);
  const activeOffsetScale = variant === "sixPlayers" ? 0.14 : 0.22;
  const offset = getPieceOffset(piece.pieceIndex || 0, piece.state === "home" ? 1 : activeOffsetScale);
  const homeEntryProgress = getLudoHomeEntryProgress(variant);

  if (piece.state === "home" || piece.progress < 0) {
    if (variant === "sixPlayers") {
      const slots = getSixBaseSlotPoints(player);
      return slots[piece.pieceIndex || 0] || getSixBaseCenter(player);
    }

    const slots = getHomeSlotPoints(getBaseCenter(player, variant));
    return slots[piece.pieceIndex || 0] || getBaseCenter(player, variant);
  }

  if (piece.state === "finished" || piece.progress >= config.finishProgress) {
    if (variant === "sixPlayers") {
      return getSixFinishedPiecePoint(player, piece.pieceIndex || 0);
    }

    const finishedOffset = getPieceOffset(piece.pieceIndex || 0, 0.24);
    return { x: LUDO_CENTER.x + finishedOffset.x, y: LUDO_CENTER.y + finishedOffset.y };
  }

  if (piece.progress >= homeEntryProgress) {
    const laneIndex = Math.min(config.homeStretch - 1, Math.max(0, piece.progress - homeEntryProgress));
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

export function getSixSlicePath(
  slot,
  innerRadius = SIX_LUDO_GEOMETRY.SECTOR_INNER_RADIUS,
  outerRadius = SIX_LUDO_GEOMETRY.SECTOR_OUTER_RADIUS
) {
  const center = getSixSectorAngle(slot);
  return ludoArcPath(innerRadius, outerRadius, center - 29, center + 29);
}

export function getSixHomePocketPath(slot) {
  const center = getSixSectorAngle(slot);
  const outerTip = ludoPolarPoint(286, center);
  const outerLeft = ludoPolarPoint(252, center - 24);
  const outerRight = ludoPolarPoint(252, center + 24);
  const innerRight = ludoPolarPoint(228, center + 14);
  const innerLeft = ludoPolarPoint(228, center - 14);
  return `M ${outerTip.x} ${outerTip.y} L ${outerRight.x} ${outerRight.y} L ${innerRight.x} ${innerRight.y} L ${innerLeft.x} ${innerLeft.y} L ${outerLeft.x} ${outerLeft.y} Z`;
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

  return getSixCenterWedgePath(slot);
}

export function getSixCenterWedgePath(slot) {
  const angle = getSixSectorAngle(slot);
  const left = ludoPolarPoint(SIX_LUDO_GEOMETRY.CENTER_WEDGE_RADIUS, angle - 30);
  const right = ludoPolarPoint(SIX_LUDO_GEOMETRY.CENTER_WEDGE_RADIUS, angle + 30);
  return `M ${LUDO_CENTER.x} ${LUDO_CENTER.y} L ${left.x} ${left.y} L ${right.x} ${right.y} Z`;
}
