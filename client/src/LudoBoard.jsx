import {
  LUDO_CENTER,
  LUDO_COLORS,
  getClassicBaseRect,
  getClassicLaneRect,
  getClassicTrackRect,
  getBaseCenter,
  getCenterTrianglePath,
  getHexagonPoints,
  getHomeSlotPoints,
  getLanePoint,
  getLudoAngleForCell,
  getLudoBoardConfig,
  getLudoBoardSlots,
  getLudoBoardVariant,
  getLudoPiecePoint,
  getLudoTrackPoint,
  getSixHomePocketPath,
  getSixSlicePath,
  getSlotStartCell,
} from "./ludoBoardGeometry";

const cx = (...classes) => classes.filter(Boolean).join(" ");

function getSlotPlayer(players, slot) {
  return players.find((player) => player.ludoIndex === slot.ludoIndex) || null;
}

function getLatestForPlayer(items, playerId) {
  return items.findLast?.((item) => item.playerId === playerId)
    || [...items].reverse().find((item) => item.playerId === playerId)
    || null;
}

function getSlotColor(slot, player) {
  return player?.colorHex || slot.colorHex || LUDO_COLORS[player?.color] || "#f8fafc";
}

function getStarPoints(cx, cy, outerRadius = 9.5, innerRadius = 4.2) {
  return Array.from({ length: 10 }, (_, index) => {
    const radius = index % 2 === 0 ? outerRadius : innerRadius;
    const angle = -90 + index * 36;
    const radians = angle * (Math.PI / 180);
    return `${cx + Math.cos(radians) * radius},${cy + Math.sin(radians) * radius}`;
  }).join(" ");
}

function renderDefs() {
  return <defs>
    <filter id="pieceShadow" x="-40%" y="-40%" width="180%" height="180%">
      <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#000" floodOpacity=".32" />
    </filter>
    <filter id="boardLift" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="18" floodColor="#000" floodOpacity=".32" />
    </filter>
  </defs>;
}

function renderTrackCells({ variant, slots, safeCells, legalTargets, trackSize }) {
  const trackCells = Array.from({ length: trackSize }, (_, index) => index);

  return trackCells.map((cell) => {
    const point = getLudoTrackPoint(cell, variant);
    const startSlot = slots.find((slot) => getSlotStartCell(slot, variant) === cell);
    const isSafe = safeCells.has(cell);
    const isNeutralClassicSafe = variant === "classic" && isSafe && !startSlot;
    const className = cx(
      "ludo-cell",
      variant === "classic" && cell % 2 === 1 && "alt",
      isSafe && "safe",
      startSlot && "start",
      legalTargets.has(cell) && "legal-target"
    );
    const style = startSlot ? { "--player-color": startSlot.colorHex } : undefined;

    if (variant === "classic") {
      const rect = getClassicTrackRect(cell);
      return <g key={cell} className="ludo-cell-wrap">
        <rect
          x={rect.x}
          y={rect.y}
          width={rect.width}
          height={rect.height}
          rx="4"
          className={className}
          style={style}
          aria-label={`Casa ${cell + 1}${isNeutralClassicSafe ? " segura" : ""}`}
        />
        {isNeutralClassicSafe && <polygon
          points={getStarPoints(point.x, point.y)}
          className="ludo-safe-star"
          aria-hidden="true"
        />}
      </g>;
    }

    return <rect
      key={cell}
      x="-8.5"
      y="-8.5"
      width="17"
      height="17"
      rx="4.5"
      className={className}
      style={style}
      transform={`translate(${point.x} ${point.y}) rotate(${getLudoAngleForCell(cell) + 90})`}
      aria-label={`Casa ${cell + 1}`}
    />;
  });
}

function renderCenter(slots, variant) {
  return <g className={cx("ludo-center-mark", variant)}>
    {variant === "sixPlayers" && <polygon points={getHexagonPoints(84)} className="ludo-center-hex" />}
    {slots.map((slot) => <path
      key={slot.color}
      d={getCenterTrianglePath(slot, variant)}
      className="ludo-center-wedge"
      style={{ "--player-color": slot.colorHex }}
    />)}
    <circle cx={LUDO_CENTER.x} cy={LUDO_CENTER.y} r={variant === "classic" ? 39 : 43} className="ludo-center" />
    <text x={LUDO_CENTER.x} y={LUDO_CENTER.y + 7} textAnchor="middle" className="ludo-center-label">LUDO</text>
  </g>;
}

function renderClassicHomes({ players, slots, bubbles, reactions, pieces, currentTurnPlayerId }) {
  return slots.map((slot) => {
    const player = getSlotPlayer(players, slot);
    const boardSlot = player || slot;
    const color = getSlotColor(slot, player);
    const base = getBaseCenter(boardSlot, "classic");
    const rect = getClassicBaseRect(boardSlot);
    const finished = player ? pieces.filter((piece) => piece.playerId === player.id && piece.state === "finished").length : 0;
    const bubble = player ? bubbles.find((item) => item.playerId === player.id) : null;
    const reaction = player ? getLatestForPlayer(reactions, player.id) : null;

    return <g key={player?.id || slot.color} className={cx("ludo-home classic", !player && "empty", player?.id === currentTurnPlayerId && "active")} style={{ "--player-color": color }}>
      <rect x={rect.x + 8} y={rect.y + 8} width={rect.width - 16} height={rect.height - 16} rx="22" className="ludo-home-panel" />
      <circle cx={base.x} cy={base.y} r="64" className="ludo-base" />
      {getHomeSlotPoints(base).map((point, index) => <circle key={index} cx={point.x} cy={point.y} r="15" className="ludo-home-slot" />)}
      {player && <>
        <text x={base.x} y={base.y + 5} textAnchor="middle" className="ludo-base-label">{player.name.slice(0, 2).toUpperCase()}</text>
        <text x={base.x} y={base.y + 82} textAnchor="middle" className="ludo-base-score">{finished}/4</text>
      </>}
      {reaction && <text x={base.x + 44} y={base.y - 54} textAnchor="middle" className="ludo-reaction">{reaction.emoji}</text>}
      {bubble && <g className="ludo-speech">
        <rect x={Math.max(20, Math.min(430, base.x - 72))} y={Math.max(20, base.y - 105)} width="144" height="44" rx="18" />
        <text x={Math.max(92, Math.min(502, base.x))} y={Math.max(47, base.y - 78)} textAnchor="middle">{bubble.text}</text>
      </g>}
    </g>;
  });
}

function renderSixHomes({ players, slots, bubbles, reactions, pieces, currentTurnPlayerId }) {
  return slots.map((slot) => {
    const player = getSlotPlayer(players, slot);
    const boardSlot = player || slot;
    const color = getSlotColor(slot, player);
    const base = getBaseCenter(boardSlot, "sixPlayers");
    const finished = player ? pieces.filter((piece) => piece.playerId === player.id && piece.state === "finished").length : 0;
    const bubble = player ? bubbles.find((item) => item.playerId === player.id) : null;
    const reaction = player ? getLatestForPlayer(reactions, player.id) : null;

    return <g key={player?.id || slot.color} className={cx("ludo-home six", !player && "empty", player?.id === currentTurnPlayerId && "active")} style={{ "--player-color": color }}>
      <path d={getSixHomePocketPath(boardSlot)} className="ludo-home-pocket" />
      <circle cx={base.x} cy={base.y} r="43" className="ludo-base" />
      {getHomeSlotPoints(base, [
        { x: -16, y: -16 },
        { x: 16, y: -16 },
        { x: -16, y: 16 },
        { x: 16, y: 16 },
      ]).map((point, index) => <circle key={index} cx={point.x} cy={point.y} r="10" className="ludo-home-slot" />)}
      {player && <>
        <text x={base.x} y={base.y + 5} textAnchor="middle" className="ludo-base-label">{player.name.slice(0, 2).toUpperCase()}</text>
        <text x={base.x} y={base.y + 55} textAnchor="middle" className="ludo-base-score">{finished}/4</text>
      </>}
      {reaction && <text x={base.x + 36} y={base.y - 40} textAnchor="middle" className="ludo-reaction">{reaction.emoji}</text>}
      {bubble && <g className="ludo-speech">
        <rect x={Math.max(20, Math.min(430, base.x - 72))} y={Math.max(20, base.y - 88)} width="144" height="44" rx="18" />
        <text x={Math.max(92, Math.min(502, base.x))} y={Math.max(47, base.y - 61)} textAnchor="middle">{bubble.text}</text>
      </g>}
    </g>;
  });
}

function renderHomeLanes(slots, variant) {
  return slots.map((slot) => {
    if (variant === "classic") {
      return <g key={slot.color} className="ludo-home-lane-group classic" style={{ "--player-color": slot.colorHex }}>
        {Array.from({ length: 6 }, (_, index) => {
          const rect = getClassicLaneRect(slot, index);
          return <rect
            key={index}
            x={rect.x}
            y={rect.y}
            width={rect.width}
            height={rect.height}
            rx="4"
            className="ludo-lane-dot"
          />;
        })}
      </g>;
    }

    const start = variant === "classic"
      ? getLanePoint(slot, variant, 0)
      : getLudoTrackPoint(getSlotStartCell(slot, variant), variant);
    const end = variant === "classic" ? getLanePoint(slot, variant, 5) : LUDO_CENTER;
    return <g key={slot.color} className={cx("ludo-home-lane-group", variant)} style={{ "--player-color": slot.colorHex }}>
      <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} className="ludo-lane-bed" />
      <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} className="ludo-home-lane" />
      {Array.from({ length: 6 }, (_, index) => {
        const point = getLanePoint(slot, variant, index);
        const angle = variant === "classic" ? 0 : getLudoAngleForCell(getSlotStartCell(slot, variant)) + 45;
        const size = variant === "classic" ? 21 : 18;
        return <rect
          key={index}
          x={-size / 2}
          y={-size / 2}
          width={size}
          height={size}
          rx={variant === "classic" ? 4 : 5}
          className="ludo-lane-dot"
          transform={`translate(${point.x} ${point.y}) rotate(${angle})`}
        />;
      })}
    </g>;
  });
}

function renderPieces({ pieces, players, legalPieceIds, variant, movePiece, lastAction }) {
  return pieces.map((piece) => {
    const point = getLudoPiecePoint(piece, players, variant);
    const player = players.find((item) => item.id === piece.playerId) || {};
    const color = player.colorHex || LUDO_COLORS[piece.color] || "#fff";
    const legal = legalPieceIds.has(piece.id);
    const moving = lastAction?.pieceId === piece.id && ["move", "capture", "finish-piece"].includes(lastAction.type);
    const captured = (lastAction?.capturedPieceIds || []).includes(piece.id);
    const pieceRadius = variant === "classic"
      ? legal ? 15.5 : 13.2
      : legal ? 17 : 14.5;

    return <g
      key={piece.id}
      className={cx("ludo-piece", variant, legal && "legal", moving && "moving", captured && "captured", piece.state === "finished" && "finished")}
      style={{ "--player-color": color, transform: `translate(${point.x}px, ${point.y}px)` }}
      onClick={() => legal && movePiece(piece.id)}
      onKeyDown={(event) => {
        if (!legal || !["Enter", " "].includes(event.key)) return;
        event.preventDefault();
        movePiece(piece.id);
      }}
      tabIndex={legal ? 0 : undefined}
      role={legal ? "button" : "img"}
      aria-label={`Peca ${piece.pieceIndex + 1} de ${player.name || ""}`}
    >
      {(moving || captured || piece.state === "finished") && <circle cx="0" cy="0" r={pieceRadius + 13} className="ludo-piece-burst" />}
      <ellipse cx="0" cy={pieceRadius + 5} rx={pieceRadius * .86} ry="5" className="ludo-piece-ground" />
      <circle cx="0" cy="0" r={pieceRadius + 4} className="ludo-piece-ring" />
      <circle cx="0" cy="0" r={pieceRadius} className="ludo-piece-body" filter="url(#pieceShadow)" />
      <circle cx="-5" cy="-6" r={Math.max(3.6, pieceRadius * .3)} className="ludo-piece-shine" />
      <path
        d={`M ${-pieceRadius * .56} ${pieceRadius * .28} C ${-pieceRadius * .18} ${pieceRadius * .7}, ${pieceRadius * .42} ${pieceRadius * .62}, ${pieceRadius * .63} ${pieceRadius * .12}`}
        className="ludo-piece-depth"
      />
      <text x="0" y="5" textAnchor="middle">{piece.pieceIndex + 1}</text>
    </g>;
  });
}

function ClassicLudoBoard(props) {
  const { slots, players, safeCells, bubbles, reactions, pieces, legalPieceIds, legalTargets, currentTurnPlayerId, movePiece, trackSize } = props;

  return <svg className="ludo-board classic" viewBox="0 0 600 600" role="img" aria-label="Tabuleiro Ludo classico">
    {renderDefs()}
    <rect x="18" y="18" width="564" height="564" rx="36" className="ludo-board-plate" filter="url(#boardLift)" />
    <rect x="46" y="46" width="508" height="508" rx="34" className="ludo-classic-field" />
    {renderClassicHomes({ players, slots, bubbles, reactions, pieces, currentTurnPlayerId })}
    {renderTrackCells({ variant: "classic", slots, safeCells, legalTargets, trackSize })}
    {renderHomeLanes(slots, "classic")}
    {renderCenter(slots, "classic")}
    {renderPieces({ pieces, players, legalPieceIds, variant: "classic", movePiece, lastAction: props.lastAction })}
  </svg>;
}

function SixPlayerLudoBoard(props) {
  const { slots, players, safeCells, bubbles, reactions, pieces, legalPieceIds, legalTargets, currentTurnPlayerId, movePiece, trackSize } = props;

  return <svg className="ludo-board six-players" viewBox="0 0 600 600" role="img" aria-label="Tabuleiro Ludo 6 jogadores">
    {renderDefs()}
    <polygon points={getHexagonPoints(292)} className="ludo-board-plate" filter="url(#boardLift)" />
    <circle cx="300" cy="300" r="248" className="ludo-radial-field" />
    <g className="ludo-pizza">
      {slots.map((slot) => {
        const player = getSlotPlayer(players, slot);
        const color = getSlotColor(slot, player);
        return <path key={slot.color} d={getSixSlicePath(slot)} className={cx("ludo-slice", !player && "empty")} style={{ "--player-color": color }} />;
      })}
    </g>
    <circle cx="300" cy="300" r="202" className="ludo-track-ring" />
    {renderTrackCells({ variant: "sixPlayers", slots, safeCells, legalTargets, trackSize })}
    {renderHomeLanes(slots, "sixPlayers")}
    {renderSixHomes({ players, slots, bubbles, reactions, pieces, currentTurnPlayerId })}
    {renderCenter(slots, "sixPlayers")}
    {renderPieces({ pieces, players, legalPieceIds, variant: "sixPlayers", movePiece, lastAction: props.lastAction })}
  </svg>;
}

export default function LudoBoard({ room, now, movePiece }) {
  const players = room.players || [];
  const variant = room.board?.variant || getLudoBoardVariant(room.settings?.maxPlayers || players.length);
  const boardConfig = { ...getLudoBoardConfig(variant), ...(room.board || {}) };
  const slots = getLudoBoardSlots(variant);
  const pieces = room.pieces || [];
  const legalPieceIds = new Set((room.legalMoves || []).map((move) => move.pieceId));
  const legalTargets = new Set((room.legalMoves || []).map((move) => move.targetCell).filter(Number.isFinite));
  const safeCells = new Set(room.board?.safeCells || []);
  const bubbles = (room.speechBubbles || []).filter((bubble) => bubble.expiresAt > now);
  const reactions = (room.reactions || []).filter((reaction) => reaction.expiresAt > now);
  const props = { slots, players, safeCells, bubbles, reactions, pieces, legalPieceIds, legalTargets, currentTurnPlayerId: room.currentTurnPlayerId, movePiece, trackSize: boardConfig.trackSize, lastAction: room.lastAction };

  return variant === "classic"
    ? <ClassicLudoBoard {...props} />
    : <SixPlayerLudoBoard {...props} />;
}
