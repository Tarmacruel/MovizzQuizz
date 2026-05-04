import { ArrowLeft, ArrowRight, Play } from "lucide-react";
import { useMemo, useState } from "react";
import GameModeCard, { MODE_META } from "./GameModeCard";
import Modal from "./Modal";

const DEFAULT_SETTINGS_BY_MODE = {
  quiz: {
    gameType: "quiz",
    matchName: "Quiz Cultura Pop",
    maxPlayers: 8,
    isPublic: true,
    totalQuestions: 20,
    secondsPerQuestion: 30,
    categories: ["Marvel", "Star Wars", "DC", "O Senhor dos Aneis", "Cultura Pop", "League of Legends"],
    difficulties: ["Facil", "Medio", "Dificil"],
  },
  stop: {
    gameType: "stop",
    matchName: "Stop / Adedanha",
    maxPlayers: 8,
    isPublic: true,
    totalRounds: 5,
    roundSeconds: 90,
  },
  ludo: {
    gameType: "ludo",
    matchName: "Ludo",
    maxPlayers: 6,
    isPublic: true,
  },
};

function clampNumber(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.max(min, Math.min(max, Math.round(number)));
}

export default function CreateRoomWizard({ open, initialMode = "quiz", playerName, loading, error, onClose, onPlayerNameChange, onCreate }) {
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState(initialMode || "quiz");
  const [settings, setSettings] = useState(DEFAULT_SETTINGS_BY_MODE[initialMode || "quiz"] || DEFAULT_SETTINGS_BY_MODE.quiz);

  const title = useMemo(() => {
    if (step === 1) return "Escolha o jogo";
    if (step === 2) return "Configuracoes basicas";
    return `Ajustes de ${MODE_META[mode]?.title || "partida"}`;
  }, [step, mode]);

  function selectMode(nextMode) {
    setMode(nextMode);
    setSettings({ ...(DEFAULT_SETTINGS_BY_MODE[nextMode] || DEFAULT_SETTINGS_BY_MODE.quiz) });
  }

  function updateSetting(key, value) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  function submit(event) {
    event.preventDefault();
    onCreate?.({ ...settings, gameType: mode });
  }

  return (
    <Modal open={open} title={title} eyebrow={`Etapa ${step} de 3`} onClose={onClose} className="structured-create-modal">
      <form className="structured-wizard" onSubmit={submit}>
        {step === 1 && (
          <div className="structured-mode-grid">
            {Object.keys(MODE_META).map((item) => (
              <GameModeCard key={item} mode={item} active={mode === item} onSelect={selectMode} />
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="structured-form-grid two">
            <label>
              <span>Seu nome</span>
              <input value={playerName} maxLength={24} placeholder="Nome do jogador" onChange={(event) => onPlayerNameChange?.(event.target.value)} />
            </label>
            <label>
              <span>Nome da partida</span>
              <input value={settings.matchName || ""} maxLength={40} onChange={(event) => updateSetting("matchName", event.target.value)} />
            </label>
            <label>
              <span>Maximo de jogadores</span>
              <input type="number" min={2} max={mode === "ludo" ? 6 : 20} value={settings.maxPlayers || 2} onChange={(event) => updateSetting("maxPlayers", clampNumber(event.target.value, 2, mode === "ludo" ? 6 : 20))} />
            </label>
            <label className="structured-check-row">
              <input type="checkbox" checked={settings.isPublic !== false} onChange={(event) => updateSetting("isPublic", event.target.checked)} />
              <span>Sala publica</span>
            </label>
          </div>
        )}

        {step === 3 && mode === "quiz" && (
          <div className="structured-form-grid two">
            <label>
              <span>Total de perguntas</span>
              <input type="number" min={5} max={50} value={settings.totalQuestions || 20} onChange={(event) => updateSetting("totalQuestions", clampNumber(event.target.value, 5, 50))} />
            </label>
            <label>
              <span>Tempo por pergunta</span>
              <input type="number" min={10} max={60} value={settings.secondsPerQuestion || 30} onChange={(event) => updateSetting("secondsPerQuestion", clampNumber(event.target.value, 10, 60))} />
            </label>
          </div>
        )}

        {step === 3 && mode === "stop" && (
          <div className="structured-form-grid two">
            <label>
              <span>Rodadas</span>
              <input type="number" min={1} max={20} value={settings.totalRounds || 5} onChange={(event) => updateSetting("totalRounds", clampNumber(event.target.value, 1, 20))} />
            </label>
            <label>
              <span>Tempo por rodada</span>
              <input type="number" min={30} max={180} value={settings.roundSeconds || 90} onChange={(event) => updateSetting("roundSeconds", clampNumber(event.target.value, 30, 180))} />
            </label>
          </div>
        )}

        {step === 3 && mode === "ludo" && (
          <div className="structured-ludo-note">
            <strong>Ludo configurado para {settings.maxPlayers || 6} jogadores.</strong>
            <p>O tabuleiro sera selecionado conforme a quantidade maxima de jogadores. Use 2 a 6 jogadores para evitar salas superlotadas.</p>
          </div>
        )}

        {error && <p className="structured-error">{error}</p>}

        <footer className="structured-wizard-footer">
          <button type="button" className="structured-secondary compact" disabled={step === 1} onClick={() => setStep((value) => Math.max(1, value - 1))}>
            <ArrowLeft size={16} /> Voltar
          </button>
          {step < 3 ? (
            <button type="button" className="structured-primary compact" onClick={() => setStep((value) => Math.min(3, value + 1))}>
              Proximo <ArrowRight size={16} />
            </button>
          ) : (
            <button type="submit" className="structured-primary compact" disabled={loading}>
              <Play size={16} /> {loading ? "Criando..." : "Criar sala"}
            </button>
          )}
        </footer>
      </form>
    </Modal>
  );
}
