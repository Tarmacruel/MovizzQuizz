import { useEffect, useMemo, useState } from "react";
import { Download, Smartphone, X } from "lucide-react";

const DISMISSED_KEY = "movizz_pwa_install_dismissed_at";
const DISMISS_TTL_MS = 1000 * 60 * 60 * 24 * 7;

function isStandalone() {
  return window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone === true;
}

function wasRecentlyDismissed() {
  const dismissedAt = Number(localStorage.getItem(DISMISSED_KEY) || 0);
  return dismissedAt && Date.now() - dismissedAt < DISMISS_TTL_MS;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [iosHintVisible, setIosHintVisible] = useState(false);

  const isIos = useMemo(() => /iphone|ipad|ipod/i.test(window.navigator.userAgent), []);

  useEffect(() => {
    if (isStandalone() || wasRecentlyDismissed()) return undefined;

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    if (isIos) {
      const timeout = window.setTimeout(() => setIosHintVisible(true), 1400);
      return () => {
        window.clearTimeout(timeout);
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      };
    }

    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, [isIos]);

  async function install() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice.catch(() => null);
    setVisible(false);
    setDeferredPrompt(null);
  }

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setVisible(false);
    setIosHintVisible(false);
  }

  if (!visible && !iosHintVisible) return null;

  return (
    <aside className="pwa-install-card" role="status" aria-live="polite">
      <div className="pwa-install-icon"><Smartphone size={22} /></div>
      <div className="pwa-install-copy">
        <strong>Instale o MovizzQuizz</strong>
        {deferredPrompt ? (
          <small>Adicione o app à tela inicial para abrir em tela cheia e receber atualizações automáticas.</small>
        ) : (
          <small>No iPhone/iPad, toque em compartilhar e escolha “Adicionar à Tela de Início”.</small>
        )}
      </div>
      {deferredPrompt && (
        <button type="button" className="pwa-install-action" onClick={install}>
          <Download size={16} /> Instalar
        </button>
      )}
      <button type="button" className="pwa-install-close" onClick={dismiss} aria-label="Fechar aviso de instalação">
        <X size={16} />
      </button>
    </aside>
  );
}
