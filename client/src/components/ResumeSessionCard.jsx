import { Play } from "lucide-react";

export default function ResumeSessionCard({ session, onResume, onClear }) {
  if (!session?.roomCode) return null;

  return (
    <article className="structured-resume-card">
      <div>
        <span className="structured-eyebrow">Partida em andamento</span>
        <strong>Continuar sala {String(session.roomCode).toUpperCase()}</strong>
        <small>{session.playerName ? `Jogando como ${session.playerName}` : "Sessao salva neste navegador"}</small>
      </div>
      <div className="structured-resume-actions">
        <button type="button" className="structured-primary compact" onClick={onResume}>
          <Play size={16} /> Continuar
        </button>
        {onClear && (
          <button type="button" className="structured-link-button danger" onClick={onClear}>
            Remover
          </button>
        )}
      </div>
    </article>
  );
}
