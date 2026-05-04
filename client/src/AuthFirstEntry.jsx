import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import {
  ArrowRight,
  Gamepad2,
  Hash,
  LogIn,
  LogOut,
  Plus,
  Shield,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react";
import App from "./App.jsx";

const isLocalhost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV && isLocalhost ? "http://localhost:8001" : window.location.origin);
const PLAYER_ID_KEY = "movizz_player_id";
const ROOM_SESSION_KEY = "movizz_room_session";
const ACCOUNT_SESSION_KEY = "movizz_account_session";
const VISITOR_SESSION_KEY = "movizz_visitor_session";
const ACCESS_SESSION_KEY = "movizz_access_session";

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

const MODE_META = {
  quiz: ["🎬", "Quiz Cultura Pop", "Perguntas rapidas com ranking."],
  stop: ["✍️", "Stop / Adedanha", "Rodadas por letra e categorias."],
  ludo: ["🎲", "Ludo", "Tabuleiro, dado e disputa entre amigos."],
};

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

function writeJsonStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getInviteRoomCode(pathname = window.location.pathname) {
  const match = pathname.match(/^\/jogar\/([a-zA-Z0-9_-]+)\/?$/);
  return match ? match[1].toUpperCase() : "";
}

function clampNumber(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.max(min, Math.min(max, Math.round(number)));
}

function normalizeHandle(value) {
  return String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 24);
}

export default function AuthFirstEntry() {
  const [handoffToApp, setHandoffToApp] = useState(Boolean(getInviteRoomCode()) || window.location.pathname.startsWith("/admin"));
  const [socket] = useState(() => io(API_URL, { autoConnect: true }));
  const [playerId] = useState(() => getBrowserPlayerId());
  const [accessSession, setAccessSession] = useState(() => readJsonStorage(ACCESS_SESSION_KEY));
  const [accountSession, setAccountSession] = useState(() => readJsonStorage(ACCOUNT_SESSION_KEY));
  const [visitorSession, setVisitorSession] = useState(() => readJsonStorage(VISITOR_SESSION_KEY));
  const [authMode, setAuthMode] = useState("login");
  const [loginForm, setLoginForm] = useState({ handle: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ handle: "", displayName: "", password: "" });
  const [visitorName, setVisitorName] = useState(visitorSession?.displayName || "");
  const [selectedMode, setSelectedMode] = useState("quiz");
  const [settings, setSettings] = useState(DEFAULT_SETTINGS_BY_MODE.quiz);
  const [joinCode, setJoinCode] = useState(getInviteRoomCode());
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [roomSession, setRoomSession] = useState(() => readJsonStorage(ROOM_SESSION_KEY));

  const activeIdentity = useMemo(() => {
    if (accessSession?.type === "account" && accountSession?.account) {
      return {
        type: "account",
        name: accountSession.account.displayName,
        handle: accountSession.account.handle,
        token: accountSession.token,
      };
    }
    if (accessSession?.type === "visitor" && visitorSession?.displayName) {
      return {
        type: "visitor",
        name: visitorSession.displayName,
        handle: "visitante",
        token: "",
      };
    }
    return null;
  }, [accessSession, accountSession, visitorSession]);

  useEffect(() => {
    if (handoffToApp || !activeIdentity) return undefined;
    let active = true;
    fetch(`${API_URL}/rooms`)
      .then((response) => response.json())
      .then((payload) => {
        if (!active) return;
        setRooms(Array.isArray(payload.publicRooms) ? payload.publicRooms : []);
      })
      .catch(() => {
        if (active) setRooms([]);
      });
    return () => {
      active = false;
    };
  }, [activeIdentity, handoffToApp]);

  useEffect(() => {
    if (handoffToApp || !activeIdentity) return undefined;

    function handleJoined(payload = {}) {
      const roomCode = String(payload.roomCode || joinCode || "").toUpperCase();
      const nextPlayerId = payload.playerId || playerId;
      const session = { roomCode, playerId: nextPlayerId, playerName: activeIdentity.name };
      writeJsonStorage(ROOM_SESSION_KEY, session);
      setRoomSession(session);
      setLoading(false);
      setMessage("");
      setHandoffToApp(true);
    }

    function handleError(payload = {}) {
      setLoading(false);
      setMessage(payload.message || "Nao foi possivel concluir a operacao.");
    }

    socket.on("room:joined", handleJoined);
    socket.on("room:error", handleError);
    return () => {
      socket.off("room:joined", handleJoined);
      socket.off("room:error", handleError);
    };
  }, [activeIdentity, handoffToApp, joinCode, playerId, socket]);

  useEffect(() => {
    if (!handoffToApp) return undefined;
    if (window.location.pathname.startsWith("/admin") || getInviteRoomCode()) return undefined;

    const returnToNewHomeIfLegacyEntryAppears = () => {
      const savedRoom = readJsonStorage(ROOM_SESSION_KEY);
      const legacyEntryVisible = Boolean(document.querySelector(".entry-grid"));

      if (!savedRoom?.roomCode || legacyEntryVisible) {
        setRoomSession(savedRoom?.roomCode ? savedRoom : null);
        setHandoffToApp(false);
      }
    };

    const interval = window.setInterval(returnToNewHomeIfLegacyEntryAppears, 250);
    window.addEventListener("movizz:return-home", returnToNewHomeIfLegacyEntryAppears);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("movizz:return-home", returnToNewHomeIfLegacyEntryAppears);
    };
  }, [handoffToApp]);

  function selectMode(mode) {
    setSelectedMode(mode);
    setSettings({ ...(DEFAULT_SETTINGS_BY_MODE[mode] || DEFAULT_SETTINGS_BY_MODE.quiz) });
  }

  async function doAccountAuth(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const isRegister = authMode === "register";
    const body = isRegister
      ? {
          handle: normalizeHandle(registerForm.handle),
          displayName: registerForm.displayName.trim() || registerForm.handle.trim(),
          password: registerForm.password,
        }
      : {
          handle: normalizeHandle(loginForm.handle),
          password: loginForm.password,
        };

    try {
      const response = await fetch(`${API_URL}/auth/${isRegister ? "register" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || "Falha no acesso.");
      writeJsonStorage(ACCOUNT_SESSION_KEY, payload);
      writeJsonStorage(ACCESS_SESSION_KEY, { type: "account" });
      setAccountSession(payload);
      setAccessSession({ type: "account" });
      setMessage("");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  function enterAsVisitor(event) {
    event.preventDefault();
    const displayName = visitorName.trim().slice(0, 24);
    if (!displayName) {
      setMessage("Informe um nome para entrar como visitante.");
      return;
    }
    const session = { displayName, createdAt: Date.now() };
    writeJsonStorage(VISITOR_SESSION_KEY, session);
    writeJsonStorage(ACCESS_SESSION_KEY, { type: "visitor" });
    setVisitorSession(session);
    setAccessSession({ type: "visitor" });
    setMessage("");
  }

  function logout() {
    localStorage.removeItem(ACCESS_SESSION_KEY);
    localStorage.removeItem(ACCOUNT_SESSION_KEY);
    localStorage.removeItem(VISITOR_SESSION_KEY);
    localStorage.removeItem(ROOM_SESSION_KEY);
    setAccessSession(null);
    setAccountSession(null);
    setVisitorSession(null);
    setRoomSession(null);
    setHandoffToApp(false);
  }

  function createRoom() {
    if (!activeIdentity) return;
    setLoading(true);
    setMessage("");
    socket.emit("room:create", {
      playerName: activeIdentity.name,
      playerId,
      accountToken: activeIdentity.token || "",
      settings,
    });
  }

  function joinRoom(event) {
    event.preventDefault();
    if (!activeIdentity) return;
    const code = joinCode.trim().toUpperCase();
    if (!code) {
      setMessage("Informe o codigo da sala.");
      return;
    }
    setLoading(true);
    setMessage("");
    socket.emit("room:join", {
      roomCode: code,
      playerName: activeIdentity.name,
      playerId,
      accountToken: activeIdentity.token || "",
    });
  }

  if (handoffToApp) {
    return <App />;
  }

  if (!activeIdentity) {
    return (
      <main className="auth-first-page mobile-safe-page">
        <section className="auth-first-card">
          <div className="auth-brand-block">
            <span className="auth-logo"><Gamepad2 size={26} /></span>
            <span className="auth-kicker">MovizzQuizz</span>
            <h1>Entre para jogar.</h1>
            <p>A tela inicial agora e o acesso. Escolha uma conta, entre como visitante ou acesse a area admin.</p>
          </div>

          <div className="access-choice-grid">
            <button type="button" className={authMode === "login" ? "access-choice active" : "access-choice"} onClick={() => { setAuthMode("login"); setMessage(""); }}>
              <UserRound size={18} /> Conta
            </button>
            <button type="button" className={authMode === "visitor" ? "access-choice active" : "access-choice"} onClick={() => { setAuthMode("visitor"); setMessage(""); }}>
              <Users size={18} /> Visitante
            </button>
            <a className="access-choice" href="/admin">
              <Shield size={18} /> Admin
            </a>
          </div>

          {authMode !== "visitor" && (
            <form className="auth-form" onSubmit={doAccountAuth}>
              <div className="auth-mode-tabs">
                <button type="button" className={authMode === "login" ? "active" : ""} onClick={() => setAuthMode("login")}>Entrar</button>
                <button type="button" className={authMode === "register" ? "active" : ""} onClick={() => setAuthMode("register")}>Criar conta</button>
              </div>

              {authMode === "register" && (
                <label>
                  Nome exibido
                  <input value={registerForm.displayName} maxLength={24} placeholder="Ex.: Jonatas" onChange={(event) => setRegisterForm({ ...registerForm, displayName: event.target.value })} />
                </label>
              )}

              <label>
                Login
                <input value={authMode === "register" ? registerForm.handle : loginForm.handle} autoCapitalize="none" placeholder="seu_login" onChange={(event) => authMode === "register" ? setRegisterForm({ ...registerForm, handle: event.target.value }) : setLoginForm({ ...loginForm, handle: event.target.value })} />
              </label>

              <label>
                Senha
                <input type="password" value={authMode === "register" ? registerForm.password : loginForm.password} placeholder="Senha" onChange={(event) => authMode === "register" ? setRegisterForm({ ...registerForm, password: event.target.value }) : setLoginForm({ ...loginForm, password: event.target.value })} />
              </label>

              {message && <div className="auth-message">{message}</div>}

              <button type="submit" className="auth-primary" disabled={loading}>
                <LogIn size={18} /> {loading ? "Validando..." : authMode === "register" ? "Criar conta e entrar" : "Entrar"}
              </button>
            </form>
          )}

          {authMode === "visitor" && (
            <form className="auth-form" onSubmit={enterAsVisitor}>
              <label>
                Nome de visitante
                <input value={visitorName} maxLength={24} placeholder="Nome para a partida" onChange={(event) => setVisitorName(event.target.value)} />
              </label>
              {message && <div className="auth-message">{message}</div>}
              <button type="submit" className="auth-primary">
                <ArrowRight size={18} /> Continuar como visitante
              </button>
            </form>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="new-home-page mobile-safe-page">
      <header className="new-home-topbar">
        <a className="new-home-brand" href="/">
          <span><Gamepad2 size={21} /></span>
          <strong>MovizzQuizz</strong>
        </a>
        <div className="new-home-user">
          <span>{activeIdentity.type === "visitor" ? "Visitante" : `@${activeIdentity.handle}`}</span>
          <strong>{activeIdentity.name}</strong>
          <button type="button" onClick={logout}><LogOut size={16} /> Sair</button>
        </div>
      </header>

      <section className="new-home-hero">
        <div>
          <span className="auth-kicker">Tela inicial renovada</span>
          <h1>Escolha o jogo e comece.</h1>
          <p>A tela antiga foi removida da entrada. A experiencia agora parte de login, visitante ou admin.</p>
        </div>
        <div className="home-actions-card">
          <button type="button" className="auth-primary" onClick={createRoom} disabled={loading}>
            <Plus size={18} /> {loading ? "Criando..." : "Criar sala"}
          </button>
          {roomSession?.roomCode && (
            <button type="button" className="auth-secondary" onClick={() => setHandoffToApp(true)}>
              <Sparkles size={18} /> Continuar sala {roomSession.roomCode}
            </button>
          )}
        </div>
      </section>

      <section className="new-home-grid">
        <div className="game-mode-panel">
          <h2>Modos de jogo</h2>
          <div className="game-mode-selector">
            {Object.entries(MODE_META).map(([mode, meta]) => (
              <button key={mode} type="button" className={selectedMode === mode ? "game-mode-card active" : "game-mode-card"} onClick={() => selectMode(mode)}>
                <span>{meta[0]}</span>
                <strong>{meta[1]}</strong>
                <small>{meta[2]}</small>
              </button>
            ))}
          </div>

          <div className="settings-panel">
            <label>
              Nome da partida
              <input value={settings.matchName || ""} onChange={(event) => setSettings({ ...settings, matchName: event.target.value })} />
            </label>
            <label>
              Maximo de jogadores
              <input type="number" min="2" max={selectedMode === "ludo" ? 6 : 20} value={settings.maxPlayers || 2} onChange={(event) => setSettings({ ...settings, maxPlayers: clampNumber(event.target.value, 2, selectedMode === "ludo" ? 6 : 20) })} />
            </label>
            {selectedMode === "quiz" && (
              <>
                <label>
                  Perguntas
                  <input type="number" min="5" max="50" value={settings.totalQuestions || 20} onChange={(event) => setSettings({ ...settings, totalQuestions: clampNumber(event.target.value, 5, 50) })} />
                </label>
                <label>
                  Segundos por pergunta
                  <input type="number" min="10" max="60" value={settings.secondsPerQuestion || 30} onChange={(event) => setSettings({ ...settings, secondsPerQuestion: clampNumber(event.target.value, 10, 60) })} />
                </label>
              </>
            )}
            {selectedMode === "stop" && (
              <>
                <label>
                  Rodadas
                  <input type="number" min="1" max="20" value={settings.totalRounds || 5} onChange={(event) => setSettings({ ...settings, totalRounds: clampNumber(event.target.value, 1, 20) })} />
                </label>
                <label>
                  Segundos por rodada
                  <input type="number" min="30" max="180" value={settings.roundSeconds || 90} onChange={(event) => setSettings({ ...settings, roundSeconds: clampNumber(event.target.value, 30, 180) })} />
                </label>
              </>
            )}
          </div>
        </div>

        <aside className="join-panel">
          <form onSubmit={joinRoom}>
            <h2>Entrar com codigo</h2>
            <label>
              Codigo da sala
              <input value={joinCode} maxLength={8} placeholder="ABCDE" onChange={(event) => setJoinCode(event.target.value.toUpperCase())} />
            </label>
            <button type="submit" className="auth-secondary" disabled={loading}>
              <Hash size={18} /> Entrar
            </button>
          </form>

          <div className="public-rooms-list">
            <h2>Salas publicas</h2>
            {rooms.length === 0 && <p>Nenhuma sala publica aberta agora.</p>}
            {rooms.slice(0, 5).map((room) => (
              <button key={room.code} type="button" className="public-room-row" onClick={() => setJoinCode(room.code)}>
                <strong>{room.matchName || room.gameType}</strong>
                <small>{room.code} - {room.playerCount}/{room.maxPlayers}</small>
              </button>
            ))}
          </div>
          {message && <div className="auth-message">{message}</div>}
        </aside>
      </section>
    </main>
  );
}
