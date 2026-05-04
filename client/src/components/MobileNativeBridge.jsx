import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import useCapacitorMobile from "../hooks/useCapacitorMobile";

export default function MobileNativeBridge() {
  const { isNative } = useCapacitorMobile();
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const markOnline = () => setOffline(false);
    const markOffline = () => setOffline(true);

    window.addEventListener("movizz:online", markOnline);
    window.addEventListener("movizz:offline", markOffline);
    window.addEventListener("online", markOnline);
    window.addEventListener("offline", markOffline);

    setOffline(!window.navigator.onLine);

    return () => {
      window.removeEventListener("movizz:online", markOnline);
      window.removeEventListener("movizz:offline", markOffline);
      window.removeEventListener("online", markOnline);
      window.removeEventListener("offline", markOffline);
    };
  }, []);

  if (!offline) return null;

  return (
    <aside className="mobile-offline-banner" role="status" aria-live="polite" data-native={isNative ? "true" : "false"}>
      <WifiOff size={16} />
      <span>Sem conexão. As partidas em tempo real serão retomadas quando a internet voltar.</span>
    </aside>
  );
}
