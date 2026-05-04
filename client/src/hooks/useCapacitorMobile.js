import { useEffect, useMemo } from "react";

async function loadCapacitorModules() {
  try {
    const [{ Capacitor }, { App }, { Haptics, ImpactStyle }, { Network }, { StatusBar, Style }, { SplashScreen }] = await Promise.all([
      import("@capacitor/core"),
      import("@capacitor/app"),
      import("@capacitor/haptics"),
      import("@capacitor/network"),
      import("@capacitor/status-bar"),
      import("@capacitor/splash-screen"),
    ]);
    return { Capacitor, App, Haptics, ImpactStyle, Network, StatusBar, Style, SplashScreen };
  } catch {
    return null;
  }
}

export default function useCapacitorMobile() {
  const isNative = useMemo(() => {
    return Boolean(window.Capacitor?.isNativePlatform?.());
  }, []);

  useEffect(() => {
    let mounted = true;
    let networkListener = null;
    let backListener = null;

    async function bootNativeLayer() {
      const modules = await loadCapacitorModules();
      if (!mounted || !modules?.Capacitor?.isNativePlatform?.()) return;

      const { App, Network, StatusBar, Style, SplashScreen } = modules;

      await StatusBar.setStyle({ style: Style.Dark }).catch(() => null);
      await StatusBar.setBackgroundColor({ color: "#070713" }).catch(() => null);
      await SplashScreen.hide().catch(() => null);

      networkListener = await Network.addListener("networkStatusChange", (status) => {
        window.dispatchEvent(new CustomEvent(status.connected ? "movizz:online" : "movizz:offline", { detail: status }));
      });

      backListener = await App.addListener("backButton", ({ canGoBack }) => {
        const inRoom = Boolean(localStorage.getItem("movizz_room_session"));
        if (inRoom) {
          window.dispatchEvent(new CustomEvent("movizz:android-back"));
          return;
        }
        if (canGoBack) {
          window.history.back();
          return;
        }
        App.exitApp();
      });
    }

    bootNativeLayer();

    return () => {
      mounted = false;
      networkListener?.remove?.();
      backListener?.remove?.();
    };
  }, []);

  async function tap(style = "light") {
    const modules = await loadCapacitorModules();
    if (!modules?.Capacitor?.isNativePlatform?.()) return;
    const impactStyle = style === "heavy" ? modules.ImpactStyle.Heavy : style === "medium" ? modules.ImpactStyle.Medium : modules.ImpactStyle.Light;
    await modules.Haptics.impact({ style: impactStyle }).catch(() => null);
  }

  return { isNative, tap };
}
