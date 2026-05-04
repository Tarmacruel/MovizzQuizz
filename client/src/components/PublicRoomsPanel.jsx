import { ChevronDown, ChevronUp, Globe2, Users } from "lucide-react";
import { useState } from "react";

const GAME_LABELS = {
  quiz: "Quiz",
  stop: "Stop",
  ludo: "Ludo",
};

export default function PublicRoomsPanel({ rooms = [], loading = false, onJoin }) {
  const [expanded, setExpanded] = useState(false);
  const visibleRooms = expanded ? rooms : rooms.slice(0, 3);

  return (
    <section className="structured-public-rooms">
      <button type="button" className="structured-section-toggle" onClick={() => setExpanded((value) => !value)}>
        <span><Globe2 size={18} /> Salas publicas</span>
        <span className="structured-room-count">{loading ? "..." : rooms.length}</span>
        {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      <div className="structured-room-list">
        {visibleRooms.length === 0 && (
          <div className="structured-empty-state">
            {loading ? "Carregando salas..." : "Nenhuma sala publica disponivel agora."}
          </div>
        )}

        {visibleRooms.map((room) => (
          <article className="structured-room-card" key={room.code || `${room.gameType}-${room.createdAt}`}>
            <div>
              <strong>{room.matchName || GAME_LABELS[room.gameType] || "Partida"}</strong>
              <small>
                {GAME_LABELS[room.gameType] || "Jogo"} - {room.code || "Privada"} - {room.status || "lobby"}
              </small>
            </div>
            <span className="structured-room-players"><Users size={15} /> {room.playerCount || 0}/{room.maxPlayers || "?"}</span>
            <button type="button" className="structured-secondary compact" onClick={() => onJoin?.(room)}>
              Entrar
            </button>
          </article>
        ))}
      </div>

      {!expanded && rooms.length > 3 && (
        <button type="button" className="structured-link-button" onClick={() => setExpanded(true)}>
          Ver todas as salas
        </button>
      )}
    </section>
  );
}
