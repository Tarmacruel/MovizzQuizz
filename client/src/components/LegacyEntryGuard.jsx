import { useEffect } from "react";

const ROOM_SESSION_KEY = "movizz_room_session";
const LEGACY_ENTRY_SELECTOR = ".entry-grid";

function isAdminOrInviteRoute() {
  const pathname = window.location.pathname;
  return pathname.startsWith("/admin") || /^\/jogar\/([a-zA-Z0-9_-]+)\/?$/.test(pathname);
}

function hasLegacyEntry() {
  return Boolean(document.querySelector(LEGACY_ENTRY_SELECTOR));
}

export default function LegacyEntryGuard() {
  useEffect(() => {
    let lastDispatchAt = 0;

    function returnToNewHomeIfNeeded() {
      if (isAdminOrInviteRoute()) return;
      if (!hasLegacyEntry()) return;

      const now = Date.now();
      if (now - lastDispatchAt < 350) return;
      lastDispatchAt = now;

      localStorage.removeItem(ROOM_SESSION_KEY);
      window.history.replaceState({}, "", "/");
      window.dispatchEvent(new CustomEvent("movizz:return-home", {
        detail: { reason: "legacy-entry-visible" },
      }));
    }

    const observer = new MutationObserver(returnToNewHomeIfNeeded);
    observer.observe(document.body, { childList: true, subtree: true });

    const interval = window.setInterval(returnToNewHomeIfNeeded, 250);
    returnToNewHomeIfNeeded();

    return () => {
      observer.disconnect();
      window.clearInterval(interval);
    };
  }, []);

  return null;
}
