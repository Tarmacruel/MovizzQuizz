const PRODUCTION_API_URL = "https://quizz.sirel.com.br";

export function isCapacitorRuntime() {
  return Boolean(window.Capacitor?.isNativePlatform?.());
}

export function resolveApiUrl() {
  const explicitUrl = import.meta.env.VITE_API_URL;
  if (explicitUrl) return explicitUrl.replace(/\/$/, "");

  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const isDevHost = ["localhost", "127.0.0.1", "0.0.0.0"].includes(hostname);
  const isCapacitorHost = isCapacitorRuntime() || hostname === "localhost" && protocol === "https:";

  if (isCapacitorHost) return PRODUCTION_API_URL;
  if (import.meta.env.DEV && isDevHost) return "http://localhost:8001";

  return window.location.origin.replace(/\/$/, "");
}

export const API_URL = resolveApiUrl();
