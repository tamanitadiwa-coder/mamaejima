"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { InstallSheet } from "./InstallSheet";

// Install states are only ever set from real browser signals:
//  - `appinstalled` event (Chromium/Android/desktop)
//  - launching in standalone display mode (all platforms, incl. iOS)
// iOS has no install event, so the customer can mark it done manually;
// we then show verification guidance, not a success claim.

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export type Platform = "ios-safari" | "ios-other" | "android" | "desktop";
export type SheetView = "auto" | "success" | "ios-verify";

const K_STATUS = "me.install.status"; // "installed" | "ios-manual"
const K_WELCOMED = "me.install.welcomed";
const K_STRIP = "me.install.stripDismissed";

interface InstallCtx {
  platform: Platform;
  standalone: boolean;
  /** true when the browser has confirmed installation (or we're running installed) */
  installed: boolean;
  /** customer said they added it on iOS (unconfirmed) */
  iosManual: boolean;
  canPrompt: boolean;
  /** Show install affordances in header/menu? */
  showInstall: boolean;
  stripDismissed: boolean;
  dismissStrip: () => void;
  open: (view?: SheetView) => void;
  promptInstall: () => Promise<"accepted" | "dismissed" | "unavailable">;
  markIosManual: () => void;
}

const Ctx = createContext<InstallCtx | null>(null);

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  const iOS =
    /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (iOS) {
    const otherBrowser = /CriOS|FxiOS|EdgiOS|OPiOS|GSA|Instagram|FBAN|FBAV|Line\//.test(ua);
    return otherBrowser ? "ios-other" : "ios-safari";
  }
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function InstallProvider({ children }: { children: React.ReactNode }) {
  const [platform, setPlatform] = useState<Platform>("desktop");
  const [standalone, setStandalone] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [iosManual, setIosManual] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [sheet, setSheet] = useState<SheetView | null>(null);
  const [stripDismissed, setStripDismissed] = useState(true);

  useEffect(() => {
    setPlatform(detectPlatform());
    const sa = isStandalone();
    setStandalone(sa);
    let status: string | null = null;
    try {
      status = localStorage.getItem(K_STATUS);
      setStripDismissed(localStorage.getItem(K_STRIP) === "1");
    } catch {}
    if (status === "installed") setConfirmed(true);
    if (status === "ios-manual") setIosManual(true);

    if (sa) {
      // Running from the Home Screen: installation is confirmed.
      try {
        localStorage.setItem(K_STATUS, "installed");
        if (!localStorage.getItem(K_WELCOMED)) {
          localStorage.setItem(K_WELCOMED, "1");
          setTimeout(() => setSheet("success"), 900);
        }
      } catch {}
      setConfirmed(true);
    }

    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      // The browser only offers this when the app is NOT installed.
      setConfirmed(false);
      try {
        if (localStorage.getItem(K_STATUS) === "installed") localStorage.removeItem(K_STATUS);
      } catch {}
    };
    const onInstalled = () => {
      setDeferred(null);
      setConfirmed(true);
      try {
        localStorage.setItem(K_STATUS, "installed");
        localStorage.setItem(K_WELCOMED, "1");
      } catch {}
      setSheet("success");
    };
    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);
    const mq = window.matchMedia("(display-mode: standalone)");
    const onMq = () => setStandalone(isStandalone());
    mq.addEventListener?.("change", onMq);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
      mq.removeEventListener?.("change", onMq);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferred) return "unavailable" as const;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    // Success is shown on the `appinstalled` event, not here.
    return outcome;
  }, [deferred]);

  const markIosManual = useCallback(() => {
    setIosManual(true);
    try {
      localStorage.setItem(K_STATUS, "ios-manual");
    } catch {}
    setSheet("ios-verify");
  }, []);

  const dismissStrip = useCallback(() => {
    setStripDismissed(true);
    try {
      localStorage.setItem(K_STRIP, "1");
    } catch {}
  }, []);

  const installed = standalone || confirmed;
  const value = useMemo<InstallCtx>(
    () => ({
      platform,
      standalone,
      installed,
      iosManual,
      canPrompt: !!deferred,
      showInstall: !standalone && !installed && !iosManual,
      stripDismissed,
      dismissStrip,
      open: (v: SheetView = "auto") => setSheet(v),
      promptInstall,
      markIosManual,
    }),
    [platform, standalone, installed, iosManual, deferred, stripDismissed, dismissStrip, promptInstall, markIosManual],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      {sheet && <InstallSheet view={sheet} onClose={() => setSheet(null)} />}
    </Ctx.Provider>
  );
}

export function useInstall() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useInstall outside InstallProvider");
  return c;
}
