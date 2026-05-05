import { useEffect, useRef } from "react";

const API_URL = import.meta.env.VITE_API_URL || window.location.origin;
const ROOM_SESSION_KEY = "movizz_room_session";
const PLAYER_ID_KEY = "movizz_player_id";
const ACCOUNT_SESSION_KEY = "movizz_account_session";
const VISITOR_SESSION_KEY = "movizz_visitor_session";

function roomCodeOf(room = {}) {
  return String(room.code || room.roomCode || room.id || "").trim().toUpperCase();
}

async function fetchPublicRooms() {
  try {
    const response = await fetch(`${API_URL}/rooms`, { cache: "no-store" });
    const payload = await response.json().catch(() => ({}));
    return Array.isArray(payload.publicRooms) ? payload.publicRooms : [];
  } catch {
    return [];
  }
}

function readJsonStorage(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
}

function currentPlayerName() {
  const accountSession = readJsonStorage(ACCOUNT_SESSION_KEY);
  if (accountSession?.account?.displayName) return accountSession.account.displayName;

  const visitorSession = readJsonStorage(VISITOR_SESSION_KEY);
  if (visitorSession?.displayName) return visitorSession.displayName;

  return "Jogador";
}

function isCreateRoomButton(target) {
  const button = target?.closest?.("button");
  if (!button) return false;
  const text = button.textContent?.toLowerCase?.() || "";
  return text.includes("criar sala") || text.includes("criando");
}

function alreadyInsideRoom() {
  return window.location.pathname.startsWith("/jogar/") || Boolean(document.querySelector(".room-shell, .game-shell, .ludo-board"));
}

export default function CreateRoomFallbackGuard() {
  const snapshotRef = useRef({ at: 0, codes: new Set() });
  const runningRef = useRef(false);

  useEffect(() => {
    async function captureSnapshot(event) {
      if (!isCreateRoomButton(event.target) || alreadyInsideRoom()) return;
      const rooms = await fetchPublicRooms();
      snapshotRef.current = {
        at: Date.now(),
        codes: new Set(rooms.map(roomCodeOf).filter(Boolean)),
      };
    }

    async function recoverNavigation(event) {
      if (!isCreateRoomButton(event.target) || alreadyInsideRoom() || runningRef.current) return;
      runningRef.current = true;

      const snapshot = snapshotRef.current;
      const knownCodes = snapshot?.codes || new Set();
      const playerId = localStorage.getItem(PLAYER_ID_KEY) || "";
      const playerName = currentPlayerName();

      for (let attempt = 0; attempt < 12; attempt += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, attempt === 0 ? 900 : 550));
        if (alreadyInsideRoom()) {
          runningRef.current = false;
          return;
        }

        const rooms = await fetchPublicRooms();
        const createdRoom = rooms.find((room) => {
          const code = roomCodeOf(room);
          return code && !knownCodes.has(code);
        });

        const roomCode = roomCodeOf(createdRoom);
        if (roomCode) {
          localStorage.setItem(ROOM_SESSION_KEY, JSON.stringify({ roomCode, playerId, playerName }));
          window.location.assign(`/jogar/${roomCode}`);
          return;
        }
      }

      runningRef.current = false;
    }

    document.addEventListener("pointerdown", captureSnapshot, true);
    document.addEventListener("click", recoverNavigation, true);

    return () => {
      document.removeEventListener("pointerdown", captureSnapshot, true);
      document.removeEventListener("click", recoverNavigation, true);
    };
  }, []);

  return null;
}
