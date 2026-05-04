import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { Gamepad2, Hash, Plus, Shield, UserRound } from "lucide-react";
import App from "./App.jsx";
import CreateRoomWizard from "./components/CreateRoomWizard";
import GameModeCard from "./components/GameModeCard";
import JoinRoomModal from "./components/JoinRoomModal";
import PublicRoomsPanel from "./components/PublicRoomsPanel";
import ResumeSessionCard from "./components/ResumeSessionCard";
import Modal from "./components/Modal";

const isLocalhost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV && isLocalhost ? "http://localhost:8001" : window.location.origin);
const PLAYER_ID_KEY = "movizz_player_id";
const ROOM_SESSION_KEY = "movizz_room_session";
const ACCOUNT_SESSION_KEY = "movizz_account_session";

function makeBrowserPlayerId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `player-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getBrowserPlayerId() {
  const existing = localStorage.getItem(PLAYER_ID_KEY);
  if (existing) return existing;
  const created = makeBrowserPlayerId();
  localStorage.setItem(PLAYER_ID_KEY, created);
  return created;
}

function readJsonStorage(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
}

function saveRoomSession(session) {
  localStorage.setItem(ROOM_SESSION_KEY, JSON.stringify(session));
}

function getInviteRoomCode(pathname = window.location.pathname) {
  const match = pathname.match(/^\/jogar\/([a-zA-Z0-9_-]+)\/?$/);
  return match ? match[1].toUpperCase() : "";
}

export default function MovizzEntryShell() {
  const [handoffToApp, setHandoffToApp] = useState(Boolean(getInviteRoomCode()) || window.location.pathname.startsWith("/admin"));
  const [socket] = useState(() => io(API_URL, { autoConnect: true }));
  const [playerId] = useState(() => getBrowserPlayerId());
  const [playerName, setPlayerName] = useState(() => readJsonStorage(ROOM_SESSION_KEY)?.playerName || readJsonStorage(ACCOUNT_SESSION_KEY)?.account?.displayName || "");
  const [joinCode, setJoinCode] = useState("");
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [selectedMode, setSelectedMode] = useState("quiz");
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [roomSession, setRoomSession] = useState(() => readJsonStorage(ROOM_SESSION_KEY));
  const accountSession = useMemo(() => readJsonStorage(ACCOUNT_SESSION_KEY), []);

  useEffect(() => {
    if (handoffToApp) return undefined;
    let active = true;
    setRoomsLoading(true);

    fetch(`${API_URL}/rooms`)
      .then((response) => response.json())
      .then((payload) => {
        if (!active) return;
        setRooms(Array.isArray(payload.publicRooms) ? payload.publicRooms : []);
        setRoomsLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setRooms([]);
        setRoomsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [handoffToApp]);

  useEffect(() => {
    if (handoffToApp) return undefined;

    function handleJoined(payload = {}) {
      const roomCode = String(payload.roomCode || joinCode || "").toUpperCase();
      const nextPlayerId = payload.playerId || playerId;
      saveRoomSession({ roomCode, playerId: nextPlayerId, playerName });
      setRoomSession({ roomCode, playerId: nextPlayerId, playerName });
      setLoading(false);
      setError("");
      setHandoffToApp(true);
    }

    function handleError(payload = {}) {
      setLoading(false);
      setError(payload.message || "Nao foi possivel concluir a operacao.");
    }

    socket.on("room:joined", handleJoined);
    socket.on("room:error", handleError);

    return () => {
      socket.off("room:joined", handleJoined);
      socket.off("room:error", handleError);
    };
  }, [handoffToApp, joinCode, playerId, playerName, socket]);

  function openCreate(mode = selectedMode) {
    setSelectedMode(mode);
    setError("");
    setCreateOpen(true);
  }

  function createRoom(settings) {
    const cleanName = String(playerName || "").trim();
    if (!cleanName) {
      setError("Informe seu nome para criar a sala.");
      return;
    }

    setLoading(true);
    setError("");
    socket.emit("room:create", {
      playerName: cleanName,
      playerId,
      accountToken: accountSession?.token || "",
      settings,
    });
  }

  function joinRoom(event) {
    event?.preventDefault?.();
    const cleanName = String(playerName || "").trim();
    const code = String(joinCode || "").trim().toUpperCase();

    if (!cleanName) {
      setError("Informe seu nome para entrar.");
      return;
    }

    if (!code) {
      setError("Informe o codigo da sala.");
      return;
    }

    setLoading(true);
    setError("");
    socket.emit("room:join", {
      roomCode: code,
      playerName: cleanName,
      playerId,
      accountToken: accountSession?.token || "",
    });
  }

  function joinPublicRoom(room) {
    setJoinCode(String(room?.code || "").toUpperCase());
    setJoinOpen(true);
  }

  function resumeSession() {
    if (!roomSession?.roomCode) return;
    setHandoffToApp(true);
  }

  function clearSession() {
    localStorage.removeItem(ROOM_SESSION_KEY);
    setRoomSession(null);
  }

  if (handoffToApp) {
    return <App />;
  }

  return (
    <main className="structured-lobby-shell">
      <header className="structured-lobby-topbar">
        <a className="structured-brand" href="/" aria-label="MovizzQuizz">
          <span><Gamepad2 size={20} /></span>
          <strong>MovizzQuizz</strong>
        </a>
        <nav className="structured-top-actions">
          <a className="structured-secondary compact" href="/admin"><Shield size={16} /> Admin</a>
          <button type="button" className="structured-secondary compact" onClick={() => setAccountOpen(true)}>
            <UserRound size={16} /> {accountSession?.account?.displayName || "Conta"}
          </button>
        </nav>
      </header>

      <section className="structured-hero">
        <div>
          <span className="structured-eyebrow">Party game online</span>
          <h1>Jogue Quiz, Stop e Ludo com seus amigos.</h1>
          <p>Uma entrada mais direta: escolha o jogo, crie uma sala ou entre por codigo sem enfrentar a tela carregada de configuracoes.</p>
        </div>
        <div className="structured-hero-actions">
          <button type="button" className="structured-primary" onClick={() => openCreate(selectedMode)}>
            <Plus size={18} /> Criar partida
          </button>
          <button type="button" className="structured-secondary" onClick={() => { setError(""); setJoinOpen(true); }}>
            <Hash size={18} /> Entrar com codigo
          </button>
        </div>
      </section>

      <ResumeSessionCard session={roomSession} onResume={resumeSession} onClear={clearSession} />

      <section className="structured-lobby-grid">
        <div className="structured-main-panel">
          <div className="structured-section-head">
            <span className="structured-eyebrow">Escolha o modo</span>
            <h2>Comece pelo jogo, nao pelo formulario.</h2>
          </div>
          <div className="structured-mode-grid">
            {['quiz', 'stop', 'ludo'].map((mode) => (
              <GameModeCard key={mode} mode={mode} active={selectedMode === mode} onSelect={(nextMode) => { setSelectedMode(nextMode); openCreate(nextMode); }} />
            ))}
          </div>
        </div>

        <aside className="structured-side-panel">
          <PublicRoomsPanel rooms={rooms} loading={roomsLoading} onJoin={joinPublicRoom} />
        </aside>
      </section>

      <CreateRoomWizard
        open={createOpen}
        initialMode={selectedMode}
        playerName={playerName}
        loading={loading}
        error={error}
        onClose={() => setCreateOpen(false)}
        onPlayerNameChange={setPlayerName}
        onCreate={createRoom}
      />

      <JoinRoomModal
        open={joinOpen}
        playerName={playerName}
        roomCode={joinCode}
        loading={loading}
        error={error}
        onClose={() => setJoinOpen(false)}
        onPlayerNameChange={setPlayerName}
        onRoomCodeChange={setJoinCode}
        onSubmit={joinRoom}
      />

      <Modal open={accountOpen} title="Conta e sessoes" eyebrow="Perfil" onClose={() => setAccountOpen(false)}>
        <div className="structured-account-summary">
          <p>{accountSession?.account?.displayName ? `Conectado como ${accountSession.account.displayName}.` : "Login, criacao de conta e historico continuam disponiveis no fluxo original do app."}</p>
          <p>Esta etapa estrutural remove a conta da primeira dobra e prepara o terreno para um modal completo dedicado.</p>
          <button type="button" className="structured-primary" onClick={() => setHandoffToApp(true)}>
            Abrir fluxo original de conta
          </button>
        </div>
      </Modal>
    </main>
  );
}
