import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { Crown, Gamepad2, LogIn, Play, Settings, Sparkles, Timer, Trophy, Users, Wifi } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";
const socket = io(API_URL, { autoConnect: true });
const ALL_CATEGORIES = ["Marvel", "Star Wars", "DC", "O Senhor dos Anéis", "Cultura Pop"];
const ALL_DIFFICULTIES = ["Fácil", "Médio", "Difícil"];
const cx = (...classes) => classes.filter(Boolean).join(" ");
const msToSeconds = (end) => end ? Math.max(0, Math.ceil((end - Date.now()) / 1000)) : 0;

export default function App() {
  const [playerName, setPlayerName] = useState("");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [room, setRoom] = useState(null);
  const [error, setError] = useState("");
  const [selectedOption, setSelectedOption] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [settings, setSettings] = useState({ categories: ALL_CATEGORIES, difficulties: ALL_DIFFICULTIES, totalQuestions: 20, secondsPerQuestion: 30 });

  const isHost = room?.hostSocketId === playerId;
  const hasAnswered = Boolean(room?.currentAnswers?.[playerId]);
  const currentQuestion = room?.currentQuestion;

  useEffect(() => {
    const onJoined = ({ roomCode, playerId }) => { setRoomCode(roomCode); setPlayerId(playerId); setError(""); };
    const onUpdate = (payload) => {
      setRoom(payload);
      setSettings(payload.settings);
      setSelectedOption((prev) => payload.currentAnswers?.[playerId]?.option || prev);
    };
    const onError = ({ message }) => setError(message);
    socket.on("room:joined", onJoined);
    socket.on("room:update", onUpdate);
    socket.on("room:error", onError);
    return () => { socket.off("room:joined", onJoined); socket.off("room:update", onUpdate); socket.off("room:error", onError); };
  }, [playerId]);

  useEffect(() => {
    setSelectedOption(null);
  }, [currentQuestion?.id]);

  useEffect(() => {
    const interval = setInterval(() => setTimeLeft(msToSeconds(room?.roundEndsAt)), 250);
    return () => clearInterval(interval);
  }, [room?.roundEndsAt]);

  const answeredCount = useMemo(() => Object.keys(room?.currentAnswers || {}).length, [room?.currentAnswers]);

  function createRoom() { socket.emit("room:create", { playerName, settings }); }
  function joinRoom() { socket.emit("room:join", { playerName, roomCode: roomCodeInput }); }
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

  if (!room) {
    return <main className="page">
      <section className="hero">
        <div className="badge"><Sparkles size={16} /> Multiplayer em tempo real</div>
        <h1>MovizzQuizz</h1>
        <p>Crie uma sala, chame os amigos pelo código e jogue quizzes de filmes, séries e cultura pop com 30 segundos por pergunta.</p>
      </section>
      <section className="entry-grid">
        <div className="panel">
          <div className="panel-title"><Gamepad2 /> Criar partida</div>
          <label>Seu nome<input value={playerName} onChange={(e) => setPlayerName(e.target.value)} placeholder="Ex.: Jonatas" /></label>
          <button className="primary" onClick={createRoom}>Criar sala</button>
        </div>
        <div className="panel">
          <div className="panel-title"><LogIn /> Entrar em partida</div>
          <label>Seu nome<input value={playerName} onChange={(e) => setPlayerName(e.target.value)} placeholder="Ex.: Player 2" /></label>
          <label>Código da sala<input value={roomCodeInput} onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())} placeholder="ABCDE" /></label>
          <button className="secondary" onClick={joinRoom}>Entrar na sala</button>
        </div>
      </section>
      {error && <div className="toast error">{error}</div>}
    </main>;
  }

  return <main className="page">
    <header className="topbar">
      <div><div className="badge"><Wifi size={15} /> Sala {room.code}</div><h2>{room.status === "lobby" ? "Lobby da partida" : "Partida"}</h2></div>
      <div className="room-code">{room.code}</div>
    </header>

    {room.status === "lobby" && <section className="game-grid">
      <div className="panel"><div className="panel-title"><Users /> Jogadores</div><div className="players">{room.players.map((p) => <div className="player" key={p.id}><span>{p.name}</span>{p.id === room.hostSocketId && <Crown size={17} />}</div>)}</div></div>
      <div className="panel">
        <div className="panel-title"><Settings /> Configurações</div>
        <div className="section-label">Categorias</div><div className="chips">{ALL_CATEGORIES.map((c) => <button key={c} disabled={!isHost} onClick={() => toggleSettingList("categories", c)} className={cx("chip", settings.categories.includes(c) && "active")}>{c}</button>)}</div>
        <div className="section-label">Dificuldade</div><div className="chips">{ALL_DIFFICULTIES.map((d) => <button key={d} disabled={!isHost} onClick={() => toggleSettingList("difficulties", d)} className={cx("chip", settings.difficulties.includes(d) && "active-alt")}>{d}</button>)}</div>
        <div className="sliders"><label>Perguntas: {settings.totalQuestions}<input disabled={!isHost} type="range" min="5" max="50" value={settings.totalQuestions} onChange={(e) => patchSettings({ totalQuestions: Number(e.target.value) })} /></label><label>Tempo: {settings.secondsPerQuestion}s<input disabled={!isHost} type="range" min="10" max="60" value={settings.secondsPerQuestion} onChange={(e) => patchSettings({ secondsPerQuestion: Number(e.target.value) })} /></label></div>
        {isHost ? <button className="primary big" onClick={() => socket.emit("game:start", { roomCode })}><Play size={20} /> Iniciar partida</button> : <div className="hint">Aguardando o host iniciar a partida.</div>}
      </div>
    </section>}

    {["playing", "reveal"].includes(room.status) && currentQuestion && <section className="game-grid">
      <aside className="panel"><div className="panel-title"><Trophy /> Placar</div><div className="players">{room.ranking.map((p, i) => <div className="player score" key={p.id}><span>{i + 1}. {p.name}</span><strong>{p.score}</strong></div>)}</div><div className="round-meta"><div>Rodada</div><strong>{room.currentIndex + 1}/{room.totalQuestions}</strong></div><div className="round-meta"><div>Respostas</div><strong>{answeredCount}/{room.players.length}</strong></div></aside>
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

    {room.status === "finished" && <section className="panel final"><Crown size={56} /><p>Vencedor</p><h1>{room.ranking[0]?.name}</h1><div className="ranking">{room.ranking.map((p, i) => <div className="player score" key={p.id}><span>{i + 1}. {p.name}</span><strong>{p.score} pts</strong></div>)}</div></section>}
    {error && <div className="toast error">{error}</div>}
  </main>;
}
