import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import {
  Crown,
  Gamepad2,
  Globe2,
  Home,
  Lock,
  LogIn,
  LogOut,
  Play,
  RotateCcw,
  Save,
  Settings,
  Shield,
  Sparkles,
  Timer,
  Trophy,
  Users,
  Wifi,
} from "lucide-react";

const isLocalhost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV && isLocalhost ? "http://localhost:8001" : window.location.origin);
const socket = io(API_URL, { autoConnect: true });
const DEFAULT_CATEGORIES = ["Marvel", "Star Wars", "DC", "O Senhor dos Anéis", "Cultura Pop", "League of Legends"];
const DEFAULT_DIFFICULTIES = ["Fácil", "Médio", "Difícil"];
const DEFAULT_GAME_LIMITS = {
  minTotalQuestions: 5,
  defaultTotalQuestions: 20,
  maxTotalQuestions: 50,
  minSecondsPerQuestion: 10,
  defaultSecondsPerQuestion: 30,
  maxSecondsPerQuestion: 60,
  defaultMaxPlayers: 8,
  maxPlayers: 20,
  maxRounds: 20,
};
const DEFAULT_SETTINGS = {
  categories: DEFAULT_CATEGORIES,
  difficulties: DEFAULT_DIFFICULTIES,
  totalQuestions: 20,
  secondsPerQuestion: 30,
  maxPlayers: 8,
  isPublic: true,
  roundLimit: 0,
};
const emptyQuestionForm = {
  id: "",
  category: "League of Legends",
  difficulty: "Difícil",
  question: "",
  options: ["", "", "", ""],
  answerIndex: 0,
  active: true,
};
const cx = (...classes) => classes.filter(Boolean).join(" ");
const msToSeconds = (end) => end ? Math.max(0, Math.ceil((end - Date.now()) / 1000)) : 0;

function withAuth(token) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function normalizeQuestionForm(question) {
  const options = Array.isArray(question.options) ? question.options : ["", "", "", ""];
  const answerIndex = Math.max(0, options.indexOf(question.answer));
  return {
    id: question.id,
    category: question.category,
    difficulty: question.difficulty,
    question: question.question,
    options,
    answerIndex,
    active: question.active,
  };
}

function AdminPanel() {
  const [token, setToken] = useState(localStorage.getItem("movizz_admin_token") || "");
  const [login, setLogin] = useState({ username: "Tarmac", password: "" });
  const [message, setMessage] = useState("");
  const [settings, setSettings] = useState(DEFAULT_GAME_LIMITS);
  const [questionForm, setQuestionForm] = useState(emptyQuestionForm);
  const [questions, setQuestions] = useState([]);
  const [questionSearch, setQuestionSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ username: "", password: "" });

  const isLogged = Boolean(token);

  async function adminFetch(path, options = {}) {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...withAuth(token),
        ...(options.headers || {}),
      },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.message || "Falha na operação admin.");
    return payload;
  }

  async function loadAdminData() {
    if (!token) return;
    try {
      const [settingsPayload, questionsPayload, usersPayload] = await Promise.all([
        adminFetch("/admin/settings"),
        adminFetch(`/admin/questions?take=30&search=${encodeURIComponent(questionSearch)}`),
        adminFetch("/admin/users"),
      ]);
      setSettings(settingsPayload);
      setQuestions(questionsPayload.items || []);
      setUsers(usersPayload.users || []);
    } catch (error) {
      setMessage(error.message);
    }
  }

  useEffect(() => {
    loadAdminData();
  }, [token]);

  async function doLogin(event) {
    event.preventDefault();
    setMessage("");
    try {
      const response = await fetch(`${API_URL}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(login),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || "Login inválido.");
      localStorage.setItem("movizz_admin_token", payload.token);
      setToken(payload.token);
      setMessage("Login efetuado.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  function logout() {
    localStorage.removeItem("movizz_admin_token");
    setToken("");
    setQuestions([]);
    setUsers([]);
  }

  async function saveSettings(event) {
    event.preventDefault();
    try {
      const payload = await adminFetch("/admin/settings", {
        method: "PUT",
        body: JSON.stringify(settings),
      });
      setSettings(payload);
      setMessage("Parâmetros atualizados.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function saveQuestion(event) {
    event.preventDefault();
    const options = questionForm.options.map((option) => option.trim());
    const body = {
      category: questionForm.category,
      difficulty: questionForm.difficulty,
      question: questionForm.question,
      options,
      answer: options[questionForm.answerIndex],
      active: questionForm.active,
    };
    const editing = Boolean(questionForm.id);

    try {
      await adminFetch(editing ? `/admin/questions/${questionForm.id}` : "/admin/questions", {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify(body),
      });
      setQuestionForm(emptyQuestionForm);
      setMessage(editing ? "Pergunta atualizada." : "Pergunta criada.");
      await loadAdminData();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function createAdminUser(event) {
    event.preventDefault();
    try {
      await adminFetch("/admin/users", {
        method: "POST",
        body: JSON.stringify(newUser),
      });
      setNewUser({ username: "", password: "" });
      setMessage("Novo admin criado.");
      await loadAdminData();
    } catch (error) {
      setMessage(error.message);
    }
  }

  if (!isLogged) {
    return <main className="page admin-page">
      <section className="hero compact-hero">
        <div className="badge"><Shield size={16} /> Admin</div>
        <h1>MovizzQuizz Admin</h1>
      </section>
      <section className="panel admin-login">
        <form onSubmit={doLogin}>
          <label>Usuário<input value={login.username} onChange={(e) => setLogin({ ...login, username: e.target.value })} /></label>
          <label>Senha<input type="password" value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} /></label>
          <button className="primary"><LogIn size={18} /> Entrar</button>
        </form>
        {message && <div className="hint">{message}</div>}
      </section>
    </main>;
  }

  return <main className="page admin-page">
    <header className="topbar">
      <div>
        <div className="badge"><Shield size={15} /> Admin</div>
        <h2>Painel</h2>
      </div>
      <div className="toolbar">
        <a className="secondary inline-action" href="/"><Home size={17} /> Jogo</a>
        <button className="secondary inline-action" onClick={logout}><LogOut size={17} /> Sair</button>
      </div>
    </header>

    {message && <div className="hint admin-message">{message}</div>}

    <section className="admin-grid">
      <form className="panel" onSubmit={saveSettings}>
        <div className="panel-title"><Settings /> Parâmetros</div>
        <div className="form-grid">
          <label>Perguntas mínimas<input type="number" value={settings.minTotalQuestions} onChange={(e) => setSettings({ ...settings, minTotalQuestions: Number(e.target.value) })} /></label>
          <label>Perguntas padrão<input type="number" value={settings.defaultTotalQuestions} onChange={(e) => setSettings({ ...settings, defaultTotalQuestions: Number(e.target.value) })} /></label>
          <label>Perguntas máximas<input type="number" value={settings.maxTotalQuestions} onChange={(e) => setSettings({ ...settings, maxTotalQuestions: Number(e.target.value) })} /></label>
          <label>Tempo mínimo<input type="number" value={settings.minSecondsPerQuestion} onChange={(e) => setSettings({ ...settings, minSecondsPerQuestion: Number(e.target.value) })} /></label>
          <label>Tempo padrão<input type="number" value={settings.defaultSecondsPerQuestion} onChange={(e) => setSettings({ ...settings, defaultSecondsPerQuestion: Number(e.target.value) })} /></label>
          <label>Tempo máximo<input type="number" value={settings.maxSecondsPerQuestion} onChange={(e) => setSettings({ ...settings, maxSecondsPerQuestion: Number(e.target.value) })} /></label>
          <label>Jogadores padrão<input type="number" value={settings.defaultMaxPlayers} onChange={(e) => setSettings({ ...settings, defaultMaxPlayers: Number(e.target.value) })} /></label>
          <label>Jogadores máximos<input type="number" value={settings.maxPlayers} onChange={(e) => setSettings({ ...settings, maxPlayers: Number(e.target.value) })} /></label>
          <label>Rodadas máximas<input type="number" value={settings.maxRounds} onChange={(e) => setSettings({ ...settings, maxRounds: Number(e.target.value) })} /></label>
        </div>
        <button className="primary"><Save size={18} /> Salvar parâmetros</button>
      </form>

      <form className="panel" onSubmit={createAdminUser}>
        <div className="panel-title"><Users /> Admins</div>
        <div className="players admin-list">{users.map((user) => <div className="player" key={user.id}><span>{user.username}</span><strong>{user.active ? "ativo" : "inativo"}</strong></div>)}</div>
        <label>Novo usuário<input value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} /></label>
        <label>Senha<input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} /></label>
        <button className="secondary"><Shield size={18} /> Criar admin</button>
      </form>
    </section>

    <section className="admin-grid">
      <form className="panel" onSubmit={saveQuestion}>
        <div className="panel-title"><Gamepad2 /> {questionForm.id ? "Editar pergunta" : "Nova pergunta"}</div>
        <div className="form-grid">
          <label>Categoria<input value={questionForm.category} onChange={(e) => setQuestionForm({ ...questionForm, category: e.target.value })} /></label>
          <label>Dificuldade<input value={questionForm.difficulty} onChange={(e) => setQuestionForm({ ...questionForm, difficulty: e.target.value })} /></label>
        </div>
        <label>Enunciado<input value={questionForm.question} onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })} /></label>
        <div className="form-grid">
          {questionForm.options.map((option, index) => <label key={index}>Alternativa {index + 1}
            <input value={option} onChange={(e) => {
              const options = [...questionForm.options];
              options[index] = e.target.value;
              setQuestionForm({ ...questionForm, options });
            }} />
          </label>)}
        </div>
        <label>Alternativa correta
          <select value={questionForm.answerIndex} onChange={(e) => setQuestionForm({ ...questionForm, answerIndex: Number(e.target.value) })}>
            {questionForm.options.map((_, index) => <option key={index} value={index}>Alternativa {index + 1}</option>)}
          </select>
        </label>
        <label className="check-row"><input type="checkbox" checked={questionForm.active} onChange={(e) => setQuestionForm({ ...questionForm, active: e.target.checked })} /> Ativa</label>
        <button className="primary"><Save size={18} /> {questionForm.id ? "Salvar pergunta" : "Criar pergunta"}</button>
      </form>

      <div className="panel">
        <div className="panel-title"><Sparkles /> Perguntas</div>
        <div className="search-row">
          <input value={questionSearch} onChange={(e) => setQuestionSearch(e.target.value)} placeholder="Buscar pergunta, resposta ou categoria" />
          <button className="secondary inline-action" onClick={loadAdminData}>Buscar</button>
        </div>
        <div className="question-list">
          {questions.map((question) => <button className="question-row" key={question.id} onClick={() => setQuestionForm(normalizeQuestionForm(question))}>
            <strong>{question.category} · {question.difficulty}</strong>
            <span>{question.question}</span>
            <small>{question.active ? "ativa" : "inativa"} · resposta: {question.answer}</small>
          </button>)}
        </div>
      </div>
    </section>
  </main>;
}

export default function App() {
  const [playerName, setPlayerName] = useState("");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [room, setRoom] = useState(null);
  const [error, setError] = useState("");
  const [selectedOption, setSelectedOption] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [gameLimits, setGameLimits] = useState(DEFAULT_GAME_LIMITS);
  const [availableCategories, setAvailableCategories] = useState(DEFAULT_CATEGORIES);
  const [availableDifficulties, setAvailableDifficulties] = useState(DEFAULT_DIFFICULTIES);
  const [roomLists, setRoomLists] = useState({ publicRooms: [], privateRooms: [] });

  const isHost = room?.hostSocketId === playerId;
  const hasAnswered = Boolean(room?.currentAnswers?.[playerId]);
  const currentQuestion = room?.currentQuestion;
  const isAdminRoute = window.location.pathname.startsWith("/admin");

  useEffect(() => {
    if (isAdminRoute) return undefined;
    let active = true;

    fetch(`${API_URL}/questions/meta`)
      .then((response) => response.json())
      .then((meta) => {
        if (!active) return;
        const categories = meta.categories?.length ? meta.categories : DEFAULT_CATEGORIES;
        const difficulties = meta.difficulties?.length ? meta.difficulties : DEFAULT_DIFFICULTIES;
        const limits = meta.settings || DEFAULT_GAME_LIMITS;
        setGameLimits(limits);
        setAvailableCategories(categories);
        setAvailableDifficulties(difficulties);
        setSettings((prev) => ({
          ...prev,
          categories,
          difficulties,
          totalQuestions: limits.defaultTotalQuestions,
          secondsPerQuestion: limits.defaultSecondsPerQuestion,
          maxPlayers: limits.defaultMaxPlayers,
        }));
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [isAdminRoute]);

  useEffect(() => {
    if (isAdminRoute || room) return undefined;
    let active = true;

    async function loadRooms() {
      try {
        const response = await fetch(`${API_URL}/rooms`);
        const payload = await response.json();
        if (active) setRoomLists(payload);
      } catch {
        if (active) setRoomLists({ publicRooms: [], privateRooms: [] });
      }
    }

    loadRooms();
    const interval = setInterval(loadRooms, 3000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [room, isAdminRoute]);

  useEffect(() => {
    if (isAdminRoute) return undefined;
    const onJoined = ({ roomCode, playerId }) => {
      setRoomCode(roomCode);
      setPlayerId(playerId);
      setError("");
    };
    const onLeft = () => {
      setRoomCode("");
      setPlayerId("");
      setRoom(null);
      setSelectedOption(null);
      setError("");
    };
    const onUpdate = (payload) => {
      setRoom(payload);
      setSettings(payload.settings);
      setSelectedOption((prev) => payload.currentAnswers?.[playerId]?.option || prev);
    };
    const onError = ({ message }) => setError(message);
    socket.on("room:joined", onJoined);
    socket.on("room:left", onLeft);
    socket.on("room:update", onUpdate);
    socket.on("room:error", onError);
    return () => {
      socket.off("room:joined", onJoined);
      socket.off("room:left", onLeft);
      socket.off("room:update", onUpdate);
      socket.off("room:error", onError);
    };
  }, [playerId, isAdminRoute]);

  useEffect(() => {
    setSelectedOption(null);
  }, [currentQuestion?.id]);

  useEffect(() => {
    const interval = setInterval(() => setTimeLeft(msToSeconds(room?.roundEndsAt)), 250);
    return () => clearInterval(interval);
  }, [room?.roundEndsAt]);

  const answeredCount = useMemo(() => Object.keys(room?.currentAnswers || {}).length, [room?.currentAnswers]);

  function createRoom() {
    socket.emit("room:create", { playerName, settings });
  }

  function joinRoom(code = roomCodeInput) {
    socket.emit("room:join", { playerName, roomCode: code });
  }

  function leaveRoom() {
    if (roomCode) {
      socket.emit("room:leave", { roomCode });
    } else {
      setRoom(null);
    }
  }

  function patchSettings(patch) {
    const next = { ...settings, ...patch };
    setSettings(next);
    if (roomCode) socket.emit("room:settings", { roomCode, settings: next });
  }

  function toggleSettingList(key, value) {
    const current = settings[key] || [];
    const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
    if (next.length) patchSettings({ [key]: next });
  }

  function submit(option) {
    if (!currentQuestion || hasAnswered) return;
    setSelectedOption(option);
    socket.emit("answer:submit", { roomCode, questionId: currentQuestion.id, option });
  }

  function startRound() {
    socket.emit("game:start", { roomCode });
  }

  function renderRoomCard(summary, privateRoom = false) {
    const isFull = summary.playerCount >= summary.maxPlayers;
    return <div className="room-card" key={`${privateRoom ? "private" : "public"}-${summary.code || summary.createdAt}`}>
      <div>
        <div className="room-card-title">
          {privateRoom ? <Lock size={17} /> : <Globe2 size={17} />}
          {privateRoom ? "Sala privada" : `Sala ${summary.code}`}
        </div>
        <div className="meta-line">{summary.playerCount}/{summary.maxPlayers} jogadores · {summary.totalQuestions} perguntas · {summary.roundLimit ? `${summary.roundLimit} rodadas` : "rodadas livres"}</div>
        <div className="meta-line">{summary.categories.slice(0, 3).join(", ")}{summary.categories.length > 3 ? "..." : ""}</div>
      </div>
      {privateRoom
        ? <span className="room-chip">Código obrigatório</span>
        : <button className="mini-button" disabled={isFull} onClick={() => joinRoom(summary.code)}>{isFull ? "Lotada" : "Entrar"}</button>}
    </div>;
  }

  function renderRoundSummary(final = false) {
    const result = room.lastRoundResult;
    const ranking = result?.ranking || room.ranking || [];

    return <section className="panel final">
      <Crown size={56} />
      <p>{final ? "Partida encerrada" : `Rodada ${room.roundNumber} encerrada`}</p>
      <h1>{result?.winner?.name || ranking[0]?.name || "Sem vencedor"}</h1>
      <div className="ranking">{ranking.map((p, i) => <div className="player score" key={p.id}><span>{i + 1}. {p.name}</span><strong>{p.score} pts</strong></div>)}</div>
      <div className="final-actions">
        {!final && isHost && <button className="primary" onClick={startRound}><Play size={19} /> Próxima rodada</button>}
        {final && isHost && <button className="primary" onClick={startRound}><RotateCcw size={19} /> Jogar novamente</button>}
        <button className="secondary" onClick={leaveRoom}><Home size={19} /> Voltar ao início</button>
      </div>
    </section>;
  }

  if (isAdminRoute) return <AdminPanel />;

  if (!room) {
    return <main className="page">
      <section className="hero">
        <div className="badge"><Sparkles size={16} /> Multiplayer em tempo real</div>
        <h1>MovizzQuizz</h1>
        <p>Crie uma sala, chame os amigos pelo código e jogue quizzes de filmes, séries, cultura pop e League of Legends com rodadas rápidas.</p>
      </section>

      <section className="entry-grid">
        <div className="panel">
          <div className="panel-title"><Gamepad2 /> Criar partida</div>
          <label>Seu nome<input value={playerName} onChange={(e) => setPlayerName(e.target.value)} placeholder="Ex.: Jonatas" /></label>
          <div className="section-label">Participantes</div>
          <label>Máximo: {settings.maxPlayers}<input type="range" min="1" max={gameLimits.maxPlayers} value={settings.maxPlayers} onChange={(e) => patchSettings({ maxPlayers: Number(e.target.value) })} /></label>
          <div className="section-label">Rodadas</div>
          <div className="segmented">
            <button className={cx(settings.roundLimit === 0 && "active")} onClick={() => patchSettings({ roundLimit: 0 })}>Livres</button>
            <button className={cx(settings.roundLimit > 0 && "active")} onClick={() => patchSettings({ roundLimit: Math.max(1, settings.roundLimit || 3) })}>Pré-definidas</button>
          </div>
          {settings.roundLimit > 0 && <label>Quantidade: {settings.roundLimit}<input type="range" min="1" max={gameLimits.maxRounds} value={settings.roundLimit} onChange={(e) => patchSettings({ roundLimit: Number(e.target.value) })} /></label>}
          <div className="section-label">Privacidade</div>
          <div className="segmented">
            <button className={cx(settings.isPublic && "active")} onClick={() => patchSettings({ isPublic: true })}><Globe2 size={16} /> Pública</button>
            <button className={cx(!settings.isPublic && "active")} onClick={() => patchSettings({ isPublic: false })}><Lock size={16} /> Privada</button>
          </div>
          <button className="primary big" onClick={createRoom}>Criar sala</button>
        </div>

        <div className="panel">
          <div className="panel-title"><LogIn /> Entrar em partida</div>
          <label>Seu nome<input value={playerName} onChange={(e) => setPlayerName(e.target.value)} placeholder="Ex.: Player 2" /></label>
          <label>Código da sala<input value={roomCodeInput} onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())} placeholder="ABCDE" /></label>
          <button className="secondary" onClick={() => joinRoom()}>Entrar na sala</button>
          <div className="hint">Salas privadas aparecem na lista, mas exigem o código enviado pelo host.</div>
        </div>
      </section>

      <section className="room-browser">
        <div className="panel">
          <div className="panel-title"><Globe2 /> Salas públicas</div>
          <div className="room-list">
            {roomLists.publicRooms?.length ? roomLists.publicRooms.map((summary) => renderRoomCard(summary)) : <div className="empty-state">Nenhuma sala pública no lobby.</div>}
          </div>
        </div>
        <div className="panel">
          <div className="panel-title"><Lock /> Salas privadas</div>
          <div className="room-list">
            {roomLists.privateRooms?.length ? roomLists.privateRooms.map((summary) => renderRoomCard(summary, true)) : <div className="empty-state">Nenhuma sala privada no lobby.</div>}
          </div>
        </div>
      </section>

      {error && <div className="toast error">{error}</div>}
    </main>;
  }

  return <main className="page">
    <header className="topbar">
      <div>
        <div className="badge"><Wifi size={15} /> Sala {room.code} · {room.settings.isPublic ? "Pública" : "Privada"}</div>
        <h2>{room.status === "lobby" ? "Lobby da partida" : room.status === "round_finished" ? "Fim da rodada" : room.status === "finished" ? "Resultado final" : "Partida"}</h2>
      </div>
      <div className="room-code">{room.code}</div>
    </header>

    {room.status === "lobby" && <section className="game-grid">
      <div className="panel">
        <div className="panel-title"><Users /> Jogadores</div>
        <div className="round-meta"><div>Vagas</div><strong>{room.players.length}/{room.settings.maxPlayers}</strong></div>
        <div className="round-meta"><div>Rodadas</div><strong>{room.settings.roundLimit ? `${room.settings.roundLimit}` : "Livres"}</strong></div>
        <div className="players">{room.players.map((p) => <div className="player" key={p.id}><span>{p.name}</span>{p.id === room.hostSocketId && <Crown size={17} />}</div>)}</div>
        <button className="secondary big" onClick={leaveRoom}><LogOut size={19} /> Sair</button>
      </div>

      <div className="panel">
        <div className="panel-title"><Settings /> Configurações</div>
        <div className="section-label">Categorias</div>
        <div className="chips">{availableCategories.map((c) => <button key={c} disabled={!isHost} onClick={() => toggleSettingList("categories", c)} className={cx("chip", settings.categories?.includes(c) && "active")}>{c}</button>)}</div>
        <div className="section-label">Dificuldade</div>
        <div className="chips">{availableDifficulties.map((d) => <button key={d} disabled={!isHost} onClick={() => toggleSettingList("difficulties", d)} className={cx("chip", settings.difficulties?.includes(d) && "active-alt")}>{d}</button>)}</div>
        <div className="sliders">
          <label>Perguntas: {settings.totalQuestions}<input disabled={!isHost} type="range" min={gameLimits.minTotalQuestions} max={gameLimits.maxTotalQuestions} value={settings.totalQuestions} onChange={(e) => patchSettings({ totalQuestions: Number(e.target.value) })} /></label>
          <label>Tempo: {settings.secondsPerQuestion}s<input disabled={!isHost} type="range" min={gameLimits.minSecondsPerQuestion} max={gameLimits.maxSecondsPerQuestion} value={settings.secondsPerQuestion} onChange={(e) => patchSettings({ secondsPerQuestion: Number(e.target.value) })} /></label>
          <label>Participantes: {settings.maxPlayers}<input disabled={!isHost} type="range" min={room.players.length} max={gameLimits.maxPlayers} value={settings.maxPlayers} onChange={(e) => patchSettings({ maxPlayers: Number(e.target.value) })} /></label>
        </div>
        <div className="section-label">Rodadas</div>
        <div className="segmented">
          <button disabled={!isHost} className={cx(settings.roundLimit === 0 && "active")} onClick={() => patchSettings({ roundLimit: 0 })}>Livres</button>
          <button disabled={!isHost} className={cx(settings.roundLimit > 0 && "active")} onClick={() => patchSettings({ roundLimit: Math.max(1, settings.roundLimit || 3) })}>Pré-definidas</button>
        </div>
        {settings.roundLimit > 0 && <label>Quantidade: {settings.roundLimit}<input disabled={!isHost} type="range" min="1" max={gameLimits.maxRounds} value={settings.roundLimit} onChange={(e) => patchSettings({ roundLimit: Number(e.target.value) })} /></label>}
        <div className="section-label">Privacidade</div>
        <div className="segmented">
          <button disabled={!isHost} className={cx(settings.isPublic && "active")} onClick={() => patchSettings({ isPublic: true })}><Globe2 size={16} /> Pública</button>
          <button disabled={!isHost} className={cx(!settings.isPublic && "active")} onClick={() => patchSettings({ isPublic: false })}><Lock size={16} /> Privada</button>
        </div>
        {isHost ? <button className="primary big" onClick={startRound}><Play size={20} /> Iniciar partida</button> : <div className="hint">Aguardando o host iniciar a partida.</div>}
      </div>
    </section>}

    {["playing", "reveal"].includes(room.status) && currentQuestion && <section className="game-grid">
      <aside className="panel">
        <div className="panel-title"><Trophy /> Placar</div>
        <div className="players">{room.ranking.map((p, i) => <div className="player score" key={p.id}><span>{i + 1}. {p.name}</span><strong>{p.score}</strong></div>)}</div>
        <div className="round-meta"><div>Rodada</div><strong>{room.roundNumber}{room.settings.roundLimit ? `/${room.settings.roundLimit}` : ""}</strong></div>
        <div className="round-meta"><div>Pergunta</div><strong>{room.currentIndex + 1}/{room.totalQuestions}</strong></div>
        <div className="round-meta"><div>Respostas</div><strong>{answeredCount}/{room.players.length}</strong></div>
        <button className="secondary big" onClick={leaveRoom}><LogOut size={19} /> Sair</button>
      </aside>
      <section className="panel question-panel">
        <div className="question-head"><div className="chips"><span className="chip active">{currentQuestion.category}</span><span className="chip active-alt">{currentQuestion.difficulty}</span></div><div className={cx("timer", timeLeft <= 10 && "danger")}><Timer size={18} /> {timeLeft}s</div></div>
        <h1 className="question">{currentQuestion.question}</h1>
        <div className="answers">{currentQuestion.options.map((option) => {
          const isCorrect = room.status === "reveal" && option === room.correctAnswer;
          const isMine = selectedOption === option || room.currentAnswers?.[playerId]?.option === option;
          const isWrongMine = room.status === "reveal" && isMine && !isCorrect;
          return <button key={option} disabled={hasAnswered || room.status === "reveal"} onClick={() => submit(option)} className={cx("answer", isMine && "mine", isCorrect && "correct", isWrongMine && "wrong")}>{option}</button>;
        })}</div>
        {hasAnswered && room.status === "playing" && <div className="hint">Resposta registrada. Aguardando os demais participantes.</div>}
        {room.status === "reveal" && <div className="reveal"><div>Resposta correta: <strong>{room.correctAnswer}</strong></div>{isHost ? <button className="primary" onClick={() => socket.emit("game:next", { roomCode })}>Próxima pergunta</button> : <span>Aguardando o host avançar.</span>}</div>}
      </section>
    </section>}

    {room.status === "round_finished" && renderRoundSummary(false)}
    {room.status === "finished" && renderRoundSummary(true)}
    {error && <div className="toast error">{error}</div>}
  </main>;
}
