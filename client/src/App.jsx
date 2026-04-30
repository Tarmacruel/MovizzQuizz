import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import {
  Crown,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Flag,
  Gamepad2,
  Globe2,
  Hash,
  Home,
  ListChecks,
  Lock,
  LogIn,
  LogOut,
  MessageCircle,
  Play,
  Plus,
  RotateCcw,
  Save,
  Send,
  Settings,
  Shield,
  Sparkles,
  Timer,
  Trash2,
  Trophy,
  Users,
  Wifi,
  XCircle,
} from "lucide-react";

const isLocalhost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV && isLocalhost ? "http://localhost:8001" : window.location.origin);
const socket = io(API_URL, { autoConnect: true });
const PLAYER_ID_KEY = "movizz_player_id";
const ROOM_SESSION_KEY = "movizz_room_session";
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
  gameType: "quiz",
  categories: DEFAULT_CATEGORIES,
  difficulties: DEFAULT_DIFFICULTIES,
  totalQuestions: 20,
  secondsPerQuestion: 30,
  maxPlayers: 8,
  isPublic: true,
  roundLimit: 0,
};
const STOP_DEFAULT_CATEGORIES = ["Nome", "Cidade", "Animal", "Objeto", "Filme/Serie", "Personagem"];
const EASY_STOP_LETTERS = "ABCDEFGHIJLMNOPQRSTUVXZ";
const ALL_STOP_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const STOP_REVIEW_SECONDS = 60;
const DEFAULT_STOP_SETTINGS = {
  gameType: "stop",
  matchName: "Stop / Adedanha",
  roundSeconds: 90,
  totalRounds: 5,
  letters: EASY_STOP_LETTERS,
  categories: STOP_DEFAULT_CATEGORIES.map((name, index) => ({ id: `cat-${index + 1}`, name, order: index })),
  basePoints: 10,
  uniqueBonus: 5,
  allowDifficultLetters: false,
  manualValidation: true,
  maxPlayers: 8,
  isPublic: true,
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
const cleanCategoryName = (value) => String(value || "").trim().replace(/\s+/g, " ");
const normalizeClientText = (value) => String(value || "")
  .trim()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/\s+/g, " ")
  .toLowerCase();
const stopCategoryNames = (categories = []) => categories.map((category) => category.name || category);

function getReviewWordStyle(answer = "", index = 0) {
  const length = Math.max(1, String(answer || "-").length);
  const tilts = [-2.6, 1.4, -1.2, 2.2, -.7, 1.9, -1.8];
  const rises = [1, -7, 5, -3, 8, -5, 3];

  return {
    "--word-tilt": `${tilts[index % tilts.length]}deg`,
    "--word-rise": `${rises[index % rises.length]}px`,
    "--word-delay": `${index * 55}ms`,
    "--word-size": `${length > 24 ? 15 : length > 17 ? 17 : length > 11 ? 20 : 23}px`,
    "--word-width": `${Math.min(340, Math.max(140, length * 13 + 62))}px`,
  };
}

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

function readRoomSession() {
  try {
    return JSON.parse(localStorage.getItem(ROOM_SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

function saveRoomSession(session) {
  localStorage.setItem(ROOM_SESSION_KEY, JSON.stringify(session));
}

function clearRoomSession() {
  localStorage.removeItem(ROOM_SESSION_KEY);
}

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
  const restoredSessionRef = useRef(readRoomSession());
  const reconnectAttemptedRef = useRef(false);
  const letterBadgeRef = useRef(null);
  const firstStopAnswerRef = useRef(null);
  const reviewChatEndRef = useRef(null);
  const [playerName, setPlayerName] = useState(restoredSessionRef.current?.playerName || "");
  const [roomCodeInput, setRoomCodeInput] = useState(restoredSessionRef.current?.roomCode || "");
  const [roomCode, setRoomCode] = useState("");
  const [playerId, setPlayerId] = useState(restoredSessionRef.current?.playerId || getBrowserPlayerId());
  const [room, setRoom] = useState(null);
  const [error, setError] = useState("");
  const [selectedOption, setSelectedOption] = useState(null);
  const [selectedGameType, setSelectedGameType] = useState("quiz");
  const [stopSettings, setStopSettings] = useState(DEFAULT_STOP_SETTINGS);
  const [stopAnswers, setStopAnswers] = useState({});
  const [reviewVotes, setReviewVotes] = useState({});
  const [reviewChatDraft, setReviewChatDraft] = useState("");
  const [letterReveal, setLetterReveal] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [gameLimits, setGameLimits] = useState(DEFAULT_GAME_LIMITS);
  const [availableCategories, setAvailableCategories] = useState(DEFAULT_CATEGORIES);
  const [availableDifficulties, setAvailableDifficulties] = useState(DEFAULT_DIFFICULTIES);
  const [roomLists, setRoomLists] = useState({ publicRooms: [], privateRooms: [] });

  const isHost = room?.hostSocketId === playerId;
  const isStopRoom = room?.gameType === "stop";
  const hasAnswered = Boolean(room?.currentAnswers?.[playerId]);
  const currentQuestion = room?.currentQuestion;
  const isAdminRoute = window.location.pathname.startsWith("/admin");
  const activeStopSettings = stopSettings;
  const stopCategories = activeStopSettings?.categories || DEFAULT_STOP_SETTINGS.categories;
  const stopReviewFinished = Boolean(room?.currentRound?.reviewFinished);
  const stopReviewComplete = Boolean(room?.currentRound?.reviewComplete);
  const activeTimerEnd = isStopRoom && room?.status === "stop-review" && !stopReviewComplete
    ? room?.reviewEndsAt
    : room?.roundEndsAt;

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
          gameType: "quiz",
          categories,
          difficulties,
          totalQuestions: limits.defaultTotalQuestions,
          secondsPerQuestion: limits.defaultSecondsPerQuestion,
          maxPlayers: limits.defaultMaxPlayers,
        }));
        setStopSettings((prev) => ({
          ...prev,
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
      localStorage.setItem(PLAYER_ID_KEY, playerId);
      saveRoomSession({ roomCode, playerId, playerName });
      setError("");
    };
    const onLeft = () => {
      setRoomCode("");
      setPlayerId(getBrowserPlayerId());
      setRoom(null);
      setSelectedOption(null);
      clearRoomSession();
      setError("");
    };
    const onUpdate = (payload) => {
      setRoom(payload);
      if (payload.gameType === "stop") {
        setStopSettings(payload.settings);
      } else {
        setSettings(payload.settings);
      }
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
  }, [playerId, playerName, isAdminRoute]);

  useEffect(() => {
    if (isAdminRoute || room || reconnectAttemptedRef.current) return undefined;
    const session = restoredSessionRef.current;
    if (!session?.roomCode || !session?.playerId || !session?.playerName) return undefined;

    const reconnect = () => {
      reconnectAttemptedRef.current = true;
      socket.emit("room:join", {
        roomCode: session.roomCode,
        playerName: session.playerName,
        playerId: session.playerId,
      });
    };

    if (socket.connected) {
      reconnect();
      return undefined;
    }

    socket.once("connect", reconnect);
    return () => socket.off("connect", reconnect);
  }, [room, isAdminRoute]);

  useEffect(() => {
    setSelectedOption(null);
  }, [currentQuestion?.id]);

  useEffect(() => {
    if (!isStopRoom || !room?.currentRound || !playerId) return;
    const mine = room.currentAnswers?.[playerId] || {};
    const blank = Object.fromEntries((room.settings.categories || []).map((category) => [category.id, ""]));
    setStopAnswers({ ...blank, ...mine });
  }, [isStopRoom, room?.currentRound?.roundNumber, playerId]);

  useEffect(() => {
    if (!isStopRoom || room?.status !== "stop-playing" || !room?.currentRound?.roundNumber) return undefined;

    const timeout = setTimeout(() => {
      firstStopAnswerRef.current?.focus({ preventScroll: true });
    }, 120);

    return () => clearTimeout(timeout);
  }, [isStopRoom, room?.status, room?.currentRound?.roundNumber]);

  useEffect(() => {
    const interval = setInterval(() => setTimeLeft(msToSeconds(activeTimerEnd)), 250);
    return () => clearInterval(interval);
  }, [activeTimerEnd]);

  useEffect(() => {
    if (!isStopRoom || room?.status !== "stop-playing" || !room?.currentRound?.letter) return undefined;

    const timeout = setTimeout(() => {
      const rect = letterBadgeRef.current?.getBoundingClientRect();
      setLetterReveal({
        key: `${room.code}-${room.currentRound.roundNumber}-${room.currentRound.letter}`,
        letter: room.currentRound.letter,
        style: rect ? {
          "--letter-target-x": `${rect.left + rect.width / 2}px`,
          "--letter-target-y": `${rect.top + rect.height / 2}px`,
          "--letter-target-scale": `${Math.max(.32, rect.width / 230)}`,
        } : undefined,
      });
    }, 40);
    const clear = setTimeout(() => setLetterReveal(null), 3100);

    return () => {
      clearTimeout(timeout);
      clearTimeout(clear);
    };
  }, [isStopRoom, room?.status, room?.code, room?.currentRound?.roundNumber, room?.currentRound?.letter]);

  useEffect(() => {
    if (!isStopRoom || room?.status !== "stop-review") return;
    reviewChatEndRef.current?.scrollIntoView({ block: "end" });
  }, [isStopRoom, room?.status, room?.reviewChat?.length]);

  const answeredCount = useMemo(() => Object.keys(room?.currentAnswers || {}).length, [room?.currentAnswers]);

  function createRoom(gameType = selectedGameType) {
    const payload = gameType === "stop"
      ? { ...stopSettings, gameType: "stop" }
      : { ...settings, gameType: "quiz" };
    setSelectedGameType(gameType);
    socket.emit("room:create", { playerName, playerId, settings: payload });
  }

  function joinRoom(code = roomCodeInput) {
    socket.emit("room:join", { playerName, playerId, roomCode: code });
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
    if (roomCode && !isStopRoom) socket.emit("room:settings", { roomCode, settings: next });
  }

  function patchStopSettings(patch) {
    const next = { ...stopSettings, ...patch, gameType: "stop" };
    setStopSettings(next);
    if (roomCode && isStopRoom) socket.emit("stop:settings", { roomCode, settings: next });
  }

  function toggleSettingList(key, value) {
    const current = settings[key] || [];
    const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
    if (next.length) patchSettings({ [key]: next });
  }

  function addStopCategory() {
    const next = [
      ...stopCategories,
      { id: `cat-${Date.now()}`, name: `Tema ${stopCategories.length + 1}`, order: stopCategories.length },
    ];
    patchStopSettings({ categories: next });
  }

  function updateStopCategory(id, name) {
    const next = stopCategories.map((category) => (
      category.id === id ? { ...category, name } : category
    ));
    setStopSettings((prev) => ({ ...prev, categories: next }));
  }

  function syncStopSettings() {
    const next = {
      ...stopSettings,
      categories: stopCategories.map((category) => ({ ...category, name: cleanCategoryName(category.name) })),
    };
    patchStopSettings(next);
  }

  function removeStopCategory(id) {
    if (stopCategories.length <= 1) return;
    patchStopSettings({ categories: stopCategories.filter((category) => category.id !== id) });
  }

  function moveStopCategory(id, direction) {
    const index = stopCategories.findIndex((category) => category.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= stopCategories.length) return;
    const next = [...stopCategories];
    [next[index], next[target]] = [next[target], next[index]];
    patchStopSettings({ categories: next.map((category, order) => ({ ...category, order })) });
  }

  function toggleDifficultLetters(checked) {
    const letters = checked ? ALL_STOP_LETTERS : stopSettings.letters.replace(/[KWY]/g, "");
    patchStopSettings({ allowDifficultLetters: checked, letters });
  }

  function updateStopAnswer(categoryId, value) {
    const next = { ...stopAnswers, [categoryId]: value };
    setStopAnswers(next);
    socket.emit("stop:submitAnswers", { roomCode, answers: next });
  }

  function callStopNow() {
    socket.emit("stop:callStop", { roomCode });
  }

  function startStop() {
    socket.emit("stop:start", { roomCode });
  }

  function voteReviewResponse(response) {
    if (!response || response.lockedInvalid || stopReviewComplete || stopReviewFinished) return;
    const currentVote = reviewVotes[response.responseId];
    const nextVote = currentVote === false ? true : false;
    setReviewVotes((prev) => ({ ...prev, [response.responseId]: nextVote }));
    socket.emit("stop:validateAnswer", {
      roomCode,
      responseId: response.responseId,
      valid: nextVote,
    });
  }

  function markReviewReady() {
    if (stopReviewComplete || stopReviewFinished || room?.reviewReadyPlayerIds?.includes(playerId)) return;
    socket.emit("stop:reviewReady", { roomCode });
  }

  function sendReviewChat(event) {
    event?.preventDefault();
    const message = reviewChatDraft.trim();
    if (!message || room?.status !== "stop-review") return;
    socket.emit("stop:reviewChat", { roomCode, message });
    setReviewChatDraft("");
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
    const stopMode = summary.gameType === "stop";
    const modeLabel = stopMode ? "Stop / Adedanha" : "Quiz de Cultura Pop";
    const roundsLabel = stopMode
      ? `${summary.totalRounds || 0} rodadas de ${summary.roundSeconds || 0}s`
      : `${summary.totalQuestions} perguntas`;
    const categoryLine = stopMode
      ? `${summary.categories?.length || 0} temas: ${(summary.categories || []).slice(0, 3).join(", ")}`
      : (summary.categories || []).slice(0, 3).join(", ");
    return <div className="room-card" key={`${privateRoom ? "private" : "public"}-${summary.code || summary.createdAt}`}>
      <div>
        <div className="room-card-title">
          {privateRoom ? <Lock size={17} /> : <Globe2 size={17} />}
          {privateRoom ? "Sala privada" : `Sala ${summary.code}`}
        </div>
        <div className="meta-line">{modeLabel} - {summary.playerCount}/{summary.maxPlayers} jogadores - {roundsLabel}</div>
        <div className="meta-line">{categoryLine}{summary.categories?.length > 3 ? "..." : ""}</div>
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

  function renderGameModeCard(type, title, description, Icon) {
    const active = selectedGameType === type;
    return <div className={cx("mode-card", active && "active")} onClick={() => setSelectedGameType(type)}>
      <div className="mode-icon"><Icon size={22} /></div>
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <button className={cx(active ? "primary" : "secondary", "inline-action")} onClick={(event) => {
        event.stopPropagation();
        createRoom(type);
      }}>
        <Play size={17} /> Criar sala
      </button>
    </div>;
  }

  function renderStopLobby() {
    const normalized = stopCategories.map((category) => normalizeClientText(category.name)).filter(Boolean);
    const hasDuplicates = normalized.length !== new Set(normalized).size;
    const canStart = isHost && normalized.length > 0 && !hasDuplicates;

    return <section className="game-grid stop-lobby">
      <aside className="panel">
        <div className="panel-title"><Users /> Jogadores</div>
        <div className="round-meta"><div>Vagas</div><strong>{room.players.length}/{activeStopSettings.maxPlayers}</strong></div>
        <div className="round-meta"><div>Rodadas</div><strong>{activeStopSettings.totalRounds}</strong></div>
        <div className="round-meta"><div>Temas</div><strong>{stopCategories.length}</strong></div>
        <div className="players">{room.players.map((p) => <div className="player" key={p.id}><span>{p.name}</span>{p.id === room.hostSocketId && <Crown size={17} />}</div>)}</div>
        <button className="secondary big" onClick={leaveRoom}><LogOut size={19} /> Sair</button>
      </aside>

      <section className="panel stop-settings">
        <div className="panel-title"><ListChecks /> Configuracao Stop</div>
        <div className="form-grid">
          <label>Nome da partida<input disabled={!isHost} value={activeStopSettings.matchName || ""} onChange={(e) => patchStopSettings({ matchName: e.target.value })} /></label>
          <label>Tempo por rodada<input disabled={!isHost} type="number" min="15" max="300" value={activeStopSettings.roundSeconds} onChange={(e) => patchStopSettings({ roundSeconds: Number(e.target.value) })} /></label>
          <label>Quantidade de rodadas<input disabled={!isHost} type="number" min="1" max={gameLimits.maxRounds} value={activeStopSettings.totalRounds} onChange={(e) => patchStopSettings({ totalRounds: Number(e.target.value) })} /></label>
          <label>Participantes<input disabled={!isHost} type="number" min={room.players.length} max={gameLimits.maxPlayers} value={activeStopSettings.maxPlayers} onChange={(e) => patchStopSettings({ maxPlayers: Number(e.target.value) })} /></label>
          <label>Pontos base<input disabled={!isHost} type="number" min="0" max="100" value={activeStopSettings.basePoints} onChange={(e) => patchStopSettings({ basePoints: Number(e.target.value) })} /></label>
          <label>Bonus resposta unica<input disabled={!isHost} type="number" min="0" max="100" value={activeStopSettings.uniqueBonus} onChange={(e) => patchStopSettings({ uniqueBonus: Number(e.target.value) })} /></label>
        </div>
        <label>Letras permitidas<input disabled={!isHost} value={activeStopSettings.letters || ""} onChange={(e) => patchStopSettings({ letters: e.target.value.toUpperCase() })} /></label>
        <div className="switch-grid">
          <label className="check-row"><input disabled={!isHost} type="checkbox" checked={Boolean(activeStopSettings.allowDifficultLetters)} onChange={(e) => toggleDifficultLetters(e.target.checked)} /> Permitir K, W e Y</label>
          <label className="check-row"><input disabled={!isHost} type="checkbox" checked={Boolean(activeStopSettings.manualValidation)} onChange={(e) => patchStopSettings({ manualValidation: e.target.checked })} /> Validacao manual do host</label>
          <label className="check-row"><input disabled={!isHost} type="checkbox" checked={Boolean(activeStopSettings.isPublic)} onChange={(e) => patchStopSettings({ isPublic: e.target.checked })} /> Sala publica</label>
        </div>

        <div className="section-label">Temas personalizados</div>
        <div className="category-editor">
          {stopCategories.map((category, index) => <div className="category-row" key={category.id}>
            <button className="icon-button" title="Subir tema" disabled={!isHost || index === 0} onClick={() => moveStopCategory(category.id, -1)}><ArrowUp size={16} /></button>
            <button className="icon-button" title="Descer tema" disabled={!isHost || index === stopCategories.length - 1} onClick={() => moveStopCategory(category.id, 1)}><ArrowDown size={16} /></button>
            <input disabled={!isHost} value={category.name} onChange={(e) => updateStopCategory(category.id, e.target.value)} onBlur={syncStopSettings} />
            <button className="icon-button danger-action" title="Remover tema" disabled={!isHost || stopCategories.length <= 1} onClick={() => removeStopCategory(category.id)}><Trash2 size={16} /></button>
          </div>)}
        </div>
        {isHost && <button className="secondary inline-action add-category" onClick={addStopCategory}><Plus size={17} /> Adicionar tema</button>}
        {hasDuplicates && <div className="hint">Existem temas duplicados. Renomeie antes de iniciar.</div>}
        {isHost ? <button className="primary big" disabled={!canStart} onClick={startStop}><Play size={20} /> Iniciar Stop</button> : <div className="hint">Aguardando o host configurar e iniciar a partida.</div>}
      </section>
    </section>;
  }

  function renderStopPlaying() {
    const letter = room.currentRound?.letter || "?";
    const answeredIds = room.answeredPlayers || [];
    const allFilled = stopCategories.every((category) => String(stopAnswers[category.id] || "").trim());

    return <>
    {letterReveal && <div className="letter-cinema" key={letterReveal.key} style={letterReveal.style} aria-hidden="true">
      <div className="letter-cinema-vignette" />
      <div className="letter-cinema-die">
        <span>{letterReveal.letter}</span>
      </div>
      <div className="letter-cinema-caption">Letra da rodada</div>
    </div>}
    <section className="game-grid stop-play">
      <aside className="panel">
        <div className="panel-title"><Trophy /> Placar</div>
        <div className="players">{room.ranking.map((p, i) => <div className="player score" key={p.id}><span>{i + 1}. {p.name}</span><strong>{p.score}</strong></div>)}</div>
        <div className="round-meta"><div>Rodada</div><strong>{room.roundNumber}/{activeStopSettings.totalRounds}</strong></div>
        <div className="round-meta"><div>Respostas</div><strong>{answeredIds.length}/{room.players.length}</strong></div>
        <div className="section-label">Ja preencheram</div>
        <div className="players compact-list">{room.players.map((player) => <div className="player" key={player.id}><span>{player.name}</span><strong>{answeredIds.includes(player.id) ? "ok" : "..."}</strong></div>)}</div>
        <button className="secondary big" onClick={leaveRoom}><LogOut size={19} /> Sair</button>
      </aside>

      <section className="panel question-panel stop-round-panel">
        <div className="stop-round-head">
          <div>
            <div className="section-label">Letra da rodada</div>
            <div className="letter-badge" ref={letterBadgeRef} key={letter}>{letter}</div>
          </div>
          <div className={cx("timer", timeLeft <= 10 && "danger")}><Timer size={18} /> {timeLeft}s</div>
        </div>
        <div className="stop-answer-grid">
          {stopCategories.map((category, index) => <label key={category.id}>{category.name}
            <input ref={index === 0 ? firstStopAnswerRef : null} value={stopAnswers[category.id] || ""} disabled={room.status !== "stop-playing"} onChange={(e) => updateStopAnswer(category.id, e.target.value)} placeholder={`Resposta com ${letter}`} />
          </label>)}
        </div>
        <button className="stop-button" disabled={!allFilled || room.status !== "stop-playing"} onClick={callStopNow}><Flag size={24} /> STOP</button>
        <div className="hint">O primeiro STOP encerra a rodada para todo mundo e abre a revisao.</div>
      </section>
    </section>
    </>;
  }

  function renderReviewChat(compact = false) {
    const messages = room.reviewChat || [];

    return <aside className={cx("review-chat", compact && "compact-chat")}>
      <div className="review-chat-head">
        <div>
          <div className="panel-title chat-title"><MessageCircle size={20} /> Chat da revisao</div>
          <p>{messages.length ? `${messages.length} mensagens` : "Conversem sobre o tema"}</p>
        </div>
      </div>
      <div className="review-chat-messages">
        {messages.length ? messages.map((message) => {
          const mine = message.playerId === playerId;
          return <div className={cx("chat-bubble", mine && "mine")} key={message.id}>
            <div className="chat-meta">
              <strong>{mine ? "Voce" : message.playerName}</strong>
              {message.categoryName && <span>{message.categoryName}</span>}
            </div>
            <p>{message.text}</p>
          </div>;
        }) : <div className="chat-empty">Sem mensagens ainda.</div>}
        <div ref={reviewChatEndRef} />
      </div>
      <form className="review-chat-form" onSubmit={sendReviewChat}>
        <input
          value={reviewChatDraft}
          maxLength={220}
          disabled={room.status !== "stop-review"}
          onChange={(event) => setReviewChatDraft(event.target.value)}
          placeholder="Escreva no chat"
        />
        <button className="chat-send" type="submit" disabled={!reviewChatDraft.trim() || room.status !== "stop-review"} title="Enviar">
          <Send size={18} />
        </button>
      </form>
    </aside>;
  }

  function renderStopReview() {
    const round = room.currentRound || {};
    const activeCategory = room.activeReviewCategory || stopCategories[room.reviewCategoryIndex || 0];
    const reviewResponses = room.reviewResponses || [];
    const reviewRows = room.players.flatMap((player) => stopCategories.map((category) => {
      const entry = round.review?.[player.id]?.[category.id];
      return entry || {
        playerId: player.id,
        playerName: player.name,
        categoryId: category.id,
        categoryName: category.name,
        answer: "",
        autoValid: false,
        hostValid: null,
        finalValid: false,
        lockedInvalid: false,
        unique: false,
        points: 0,
        reason: "vazia",
      };
    }));
    const showPendingRoundPoints = !stopReviewFinished;
    const reviewRanking = [...(room.players || [])]
      .map((player) => {
        const roundPoints = round.pointsByPlayer?.[player.id] || 0;
        const displayScore = player.score + (showPendingRoundPoints ? roundPoints : 0);
        return { ...player, roundPoints, displayScore };
      })
      .sort((a, b) => b.displayScore - a.displayScore);
    const readyPlayerIds = room.reviewReadyPlayerIds || [];
    const readyCount = room.reviewReadyCount ?? readyPlayerIds.length;
    const readyTotal = room.reviewReadyTotal || room.players.filter((player) => player.connected !== false).length || room.players.length;
    const playerReady = readyPlayerIds.includes(playerId);

    if (!stopReviewComplete) {
      return <section className="review-live-layout" key={activeCategory?.id || "review"}>
        <div className="panel stop-review-panel review-stage">
          <div className="review-header">
            <div>
              <div className="badge"><Hash size={15} /> Letra {round.letter}</div>
              <h2>{activeCategory?.name || "Tema"}</h2>
              <p>Tema {(room.reviewCategoryIndex || 0) + 1}/{room.reviewCategoryTotal || stopCategories.length}</p>
            </div>
            <div className="review-live-actions">
              <div className={cx("timer", timeLeft <= 10 && "danger")}><Timer size={18} /> {timeLeft}s</div>
              <button className={cx("ready-button", playerReady && "ready")} disabled={playerReady} onClick={markReviewReady}>
                <CheckCircle2 size={18} /> Pronto
              </button>
              <span className="ready-count">{readyCount}/{readyTotal}</span>
            </div>
          </div>

          <div className="review-progress" style={{ "--progress": `${Math.max(0, Math.min(100, (timeLeft / STOP_REVIEW_SECONDS) * 100))}%` }} />

          <div className="topic-dots">
            {stopCategories.map((category, index) => <span key={category.id} className={cx(index === (room.reviewCategoryIndex || 0) && "active", index < (room.reviewCategoryIndex || 0) && "done")} />)}
          </div>

          <div className="word-board chalk-board">
            {reviewResponses.length ? reviewResponses.map((response, index) => {
              const myVote = reviewVotes[response.responseId];
              const state = response.lockedInvalid || myVote === false || response.voteSummary?.invalidated ? "invalid" : "valid";
              return <button
                key={response.responseId}
                className={cx("word-button", state, response.lockedInvalid && "locked")}
                style={getReviewWordStyle(response.answer, index)}
                disabled={response.lockedInvalid}
                onClick={() => voteReviewResponse(response)}
                title={response.lockedInvalid ? response.reason : "Votar"}
              >
                <span>{response.answer || "-"}</span>
                <small>{response.lockedInvalid ? response.reason : state === "valid" ? "valida" : "invalida"}</small>
              </button>;
            }) : <div className="empty-state">Nenhuma resposta para este tema.</div>}
          </div>

          <div className="hint">Votacao anonima em andamento. Todos prontos avancam o tema antes do tempo.</div>
        </div>
        {renderReviewChat()}
      </section>;
    }

    return <section className="panel stop-review-panel">
      <div className="review-header">
        <div>
          <div className="badge"><Hash size={15} /> Letra {round.letter}</div>
          <h2>Resultado da rodada {round.roundNumber}</h2>
          <p>{round.stoppedByPlayerName ? `STOP chamado por ${round.stoppedByPlayerName}` : "Tempo encerrado"}</p>
        </div>
        <div className="review-actions">
          {isHost && !stopReviewFinished && <button className="primary inline-action" onClick={() => socket.emit("stop:finishReview", { roomCode })}><CheckCircle2 size={18} /> Confirmar pontos</button>}
          {isHost && stopReviewFinished && room.status !== "stop-finished" && <button className="primary inline-action" onClick={() => socket.emit("stop:nextRound", { roomCode })}><Play size={18} /> Proxima rodada</button>}
          <button className="secondary inline-action" onClick={leaveRoom}><Home size={18} /> Sair</button>
        </div>
      </div>

      <div className="review-table">
        <div className="review-row review-head-row">
          <span>Jogador</span><span>Tema</span><span>Resposta</span><span>Status</span><span>Pontos</span><span>Votos</span>
        </div>
        {reviewRows.map((entry) => {
          const myVote = entry.votes?.[playerId];
          const voteSummary = entry.voteSummary || { yes: 0, no: 0, total: 0 };
          return <div className="review-row" key={`${entry.playerId}-${entry.categoryId}`}>
            <span>{entry.playerName}</span>
            <span>{entry.categoryName}</span>
            <strong>{entry.answer || "-"}</strong>
            <span className={cx("status-pill", entry.finalValid ? "valid" : "invalid")}>{entry.finalValid ? (entry.unique ? "unica" : "valida") : entry.reason}</span>
            <strong>{entry.points}</strong>
            <span className="validation-actions">
              <span>{voteSummary.total ? `${voteSummary.yes} sim / ${voteSummary.no} nao` : "auto"}</span>
            </span>
          </div>;
        })}
      </div>

      <div className="ranking review-ranking">
        {reviewRanking.map((player, index) => <div className="player score" key={player.id}>
          <span>{index + 1}. {player.name}</span>
          <strong>{player.displayScore} pts{showPendingRoundPoints && player.roundPoints ? ` +${player.roundPoints}` : ""}</strong>
        </div>)}
      </div>
      {renderReviewChat(true)}
      {!isHost && !stopReviewFinished && <div className="hint">Aguardando o host confirmar a pontuacao.</div>}
    </section>;
  }

  function renderStopFinal() {
    const ranking = room.ranking || [];

    return <section className="panel final">
      <Crown size={56} />
      <p>Ranking final</p>
      <h1>{ranking[0]?.name || "Sem vencedor"}</h1>
      <div className="ranking">{ranking.map((p, i) => <div className="player score" key={p.id}><span>{i + 1}. {p.name}</span><strong>{p.score} pts</strong></div>)}</div>
      <div className="final-actions">
        {isHost && <button className="primary" onClick={startStop}><RotateCcw size={19} /> Jogar novamente</button>}
        <button className="secondary" onClick={leaveRoom}><Home size={19} /> Voltar ao inicio</button>
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
          <div className="panel-title"><Gamepad2 /> Escolha o jogo</div>
          <label>Seu nome<input value={playerName} onChange={(e) => setPlayerName(e.target.value)} placeholder="Ex.: Jonatas" /></label>
          <div className="mode-grid">
            {renderGameModeCard("quiz", "Quiz de Cultura Pop", "Perguntas de multipla escolha com tempo, ranking e rodadas rapidas.", Gamepad2)}
            {renderGameModeCard("stop", "Stop / Adedanha", "Temas livres criados pelo host, letra sorteada, STOP e revisao de respostas.", ListChecks)}
          </div>
          <div className="section-label">Participantes</div>
          <label>Maximo: {selectedGameType === "stop" ? stopSettings.maxPlayers : settings.maxPlayers}<input type="range" min="1" max={gameLimits.maxPlayers} value={selectedGameType === "stop" ? stopSettings.maxPlayers : settings.maxPlayers} onChange={(e) => selectedGameType === "stop" ? patchStopSettings({ maxPlayers: Number(e.target.value) }) : patchSettings({ maxPlayers: Number(e.target.value) })} /></label>
          {selectedGameType === "quiz" && <>
            <div className="section-label">Rodadas</div>
            <div className="segmented">
              <button className={cx(settings.roundLimit === 0 && "active")} onClick={() => patchSettings({ roundLimit: 0 })}>Livres</button>
              <button className={cx(settings.roundLimit > 0 && "active")} onClick={() => patchSettings({ roundLimit: Math.max(1, settings.roundLimit || 3) })}>Pre-definidas</button>
            </div>
            {settings.roundLimit > 0 && <label>Quantidade: {settings.roundLimit}<input type="range" min="1" max={gameLimits.maxRounds} value={settings.roundLimit} onChange={(e) => patchSettings({ roundLimit: Number(e.target.value) })} /></label>}
          </>}
          {selectedGameType === "stop" && <div className="hint">A configuracao completa do Stop fica no lobby: temas, letras, tempo, rodadas e pontuacao.</div>}
          <div className="section-label">Privacidade</div>
          <div className="segmented">
            <button className={cx((selectedGameType === "stop" ? stopSettings.isPublic : settings.isPublic) && "active")} onClick={() => selectedGameType === "stop" ? patchStopSettings({ isPublic: true }) : patchSettings({ isPublic: true })}><Globe2 size={16} /> Publica</button>
            <button className={cx(!(selectedGameType === "stop" ? stopSettings.isPublic : settings.isPublic) && "active")} onClick={() => selectedGameType === "stop" ? patchStopSettings({ isPublic: false }) : patchSettings({ isPublic: false })}><Lock size={16} /> Privada</button>
          </div>
          <button className="primary big" onClick={() => createRoom(selectedGameType)}>Criar sala {selectedGameType === "stop" ? "Stop" : "Quiz"}</button>
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
        <div className="badge"><Wifi size={15} /> Sala {room.code} - {room.gameType === "stop" ? "Stop / Adedanha" : "Quiz"} - {room.settings.isPublic ? "Publica" : "Privada"}</div>
        <h2>{isStopRoom
          ? room.status === "lobby" ? "Lobby Stop" : room.status === "stop-review" ? "Revisao Stop" : room.status === "stop-finished" ? "Ranking final" : "Rodada Stop"
          : room.status === "lobby" ? "Lobby da partida" : room.status === "round_finished" ? "Fim da rodada" : room.status === "finished" ? "Resultado final" : "Partida"}</h2>
      </div>
      <div className="room-code">{room.code}</div>
    </header>

    {isStopRoom && room.status === "lobby" && renderStopLobby()}
    {isStopRoom && room.status === "stop-playing" && renderStopPlaying()}
    {isStopRoom && room.status === "stop-review" && renderStopReview()}
    {isStopRoom && room.status === "stop-finished" && renderStopFinal()}

    {!isStopRoom && room.status === "lobby" && <section className="game-grid">
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

    {!isStopRoom && ["playing", "reveal"].includes(room.status) && currentQuestion && <section className="game-grid">
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

    {!isStopRoom && room.status === "round_finished" && renderRoundSummary(false)}
    {!isStopRoom && room.status === "finished" && renderRoundSummary(true)}
    {error && <div className="toast error">{error}</div>}
  </main>;
}
