import { Hash, LogIn } from "lucide-react";
import Modal from "./Modal";

export default function JoinRoomModal({ open, playerName, roomCode, loading, error, onClose, onPlayerNameChange, onRoomCodeChange, onSubmit }) {
  return (
    <Modal open={open} title="Entrar com código" eyebrow="Sala existente" onClose={onClose} className="structured-join-modal">
      <form className="structured-form" onSubmit={onSubmit}>
        <label>
          <span>Seu nome</span>
          <input
            value={playerName}
            maxLength={24}
            autoComplete="nickname"
            placeholder="Ex.: Jonatas"
            onChange={(event) => onPlayerNameChange?.(event.target.value)}
          />
        </label>

        <label>
          <span>Código da sala</span>
          <div className="structured-input-icon">
            <Hash size={17} />
            <input
              value={roomCode}
              maxLength={8}
              autoCapitalize="characters"
              placeholder="ABCDE"
              onChange={(event) => onRoomCodeChange?.(event.target.value.toUpperCase())}
            />
          </div>
        </label>

        {error && <p className="structured-error">{error}</p>}

        <button type="submit" className="structured-primary" disabled={loading}>
          <LogIn size={18} />
          {loading ? "Entrando..." : "Entrar na sala"}
        </button>
      </form>
    </Modal>
  );
}
